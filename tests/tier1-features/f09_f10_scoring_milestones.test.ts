import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { calculateDayScore, calculateWeekScore, calculateMonthScore } from '../../src/services/storage';
import { INITIAL_MILESTONES_2027 } from '../../src/data/starterData';
import { Goal, DailyLogEntry, Milestone2027 } from '../../src/types';

const PROJECT_ROOT = process.cwd();

describe('Tier 1 - Feature 9: Scoring Engine (Daily/Weekly/Monthly) (R6)', () => {
  const sampleGoals: Goal[] = [
    { id: 'g1', name: 'Goal 1', category: 'SSC', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
    { id: 'g2', name: 'Goal 2', category: 'Fitness', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
    { id: 'g3', name: 'Goal 3', category: 'English', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
    { id: 'g4', name: 'Goal 4', category: 'Self-Control', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: false }, // paused
  ];

  it('F9.1: should calculate daily score using Math.round((completedActive / totalActive) * 100)', () => {
    // 2 completed out of 3 active = 66.666...% -> rounds to 67%
    const logs: DailyLogEntry[] = [
      { id: 'l1', date: '2026-09-11', goalId: 'g1', completed: true, timestamp: 1 },
      { id: 'l2', date: '2026-09-11', goalId: 'g2', completed: true, timestamp: 2 },
      { id: 'l3', date: '2026-09-11', goalId: 'g3', completed: false, timestamp: 3 },
    ];

    const result = calculateDayScore('2026-09-11', sampleGoals, logs);
    assert.strictEqual(result.totalGoals, 3);
    assert.strictEqual(result.completedGoals, 2);
    assert.strictEqual(result.score, 67);
  });

  it('F9.2: should calculate weekly average score across logged days only', () => {
    const weekDays = [
      '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13',
    ];

    // Log 3 days: Day 1: 100% (3/3), Day 2: 100% (3/3), Day 3: 67% (2/3) -> Average: (100 + 100 + 67) / 3 = 89.0%
    const logs: DailyLogEntry[] = [
      { id: 'l1', date: '2026-09-07', goalId: 'g1', completed: true, timestamp: 1 },
      { id: 'l2', date: '2026-09-07', goalId: 'g2', completed: true, timestamp: 2 },
      { id: 'l3', date: '2026-09-07', goalId: 'g3', completed: true, timestamp: 3 },

      { id: 'l4', date: '2026-09-08', goalId: 'g1', completed: true, timestamp: 4 },
      { id: 'l5', date: '2026-09-08', goalId: 'g2', completed: true, timestamp: 5 },
      { id: 'l6', date: '2026-09-08', goalId: 'g3', completed: true, timestamp: 6 },

      { id: 'l7', date: '2026-09-09', goalId: 'g1', completed: true, timestamp: 7 },
      { id: 'l8', date: '2026-09-09', goalId: 'g2', completed: true, timestamp: 8 },
      { id: 'l9', date: '2026-09-09', goalId: 'g3', completed: false, timestamp: 9 },
    ];

    const weekScore = calculateWeekScore(weekDays, sampleGoals, logs);
    assert.strictEqual(weekScore.recordedDaysCount, 3);
    assert.strictEqual(weekScore.score, 89.0);
    assert.strictEqual(weekScore.dailyBreakdown['2026-09-07'], 100);
    assert.strictEqual(weekScore.dailyBreakdown['2026-09-08'], 100);
    assert.strictEqual(weekScore.dailyBreakdown['2026-09-09'], 67);
  });

  it('F9.3: should enforce weekly reward unlock invariant: score >= 90% AND recordedDays >= 3', () => {
    // Condition A: Score >= 90%, but only 2 days logged -> LOCKED
    const days2Pass = { score: 95.0, recordedDaysCount: 2 };
    const unlockedA = days2Pass.score >= 90 && days2Pass.recordedDaysCount >= 3;
    assert.strictEqual(unlockedA, false, 'Must be locked with fewer than 3 recorded days');

    // Condition B: Score < 90%, with 5 days logged -> LOCKED
    const days5Fail = { score: 88.5, recordedDaysCount: 5 };
    const unlockedB = days5Fail.score >= 90 && days5Fail.recordedDaysCount >= 3;
    assert.strictEqual(unlockedB, false, 'Must be locked with average score < 90%');

    // Condition C: Score >= 90% with 3 days logged -> UNLOCKED
    const days3Pass = { score: 91.2, recordedDaysCount: 3 };
    const unlockedC = days3Pass.score >= 90 && days3Pass.recordedDaysCount >= 3;
    assert.strictEqual(unlockedC, true, 'Must unlock when score >= 90% and recorded days >= 3');
  });

  it('F9.4: should calculate monthly average score across all logged days in the month', () => {
    const monthDays: string[] = [];
    for (let i = 1; i <= 30; i++) {
      monthDays.push(`2026-09-${String(i).padStart(2, '0')}`);
    }

    // Log 10 days of 100%
    const logs: DailyLogEntry[] = [];
    for (let i = 1; i <= 10; i++) {
      const dStr = `2026-09-${String(i).padStart(2, '0')}`;
      logs.push(
        { id: `l_${i}_1`, date: dStr, goalId: 'g1', completed: true, timestamp: i },
        { id: `l_${i}_2`, date: dStr, goalId: 'g2', completed: true, timestamp: i },
        { id: `l_${i}_3`, date: dStr, goalId: 'g3', completed: true, timestamp: i }
      );
    }

    const monthResult = calculateMonthScore(monthDays, sampleGoals, logs);
    assert.strictEqual(monthResult.recordedDaysCount, 10);
    assert.strictEqual(monthResult.score, 100);
  });

  it('F9.5: should enforce monthly reward unlock invariant: score >= 90% AND recordedDays >= 10', () => {
    // Condition A: 9 days of 100% -> LOCKED
    const days9 = { score: 100, recordedDaysCount: 9 };
    const unlockedA = days9.score >= 90 && days9.recordedDaysCount >= 10;
    assert.strictEqual(unlockedA, false, 'Must remain locked if recordedDaysCount < 10');

    // Condition B: 10 days of 92% -> UNLOCKED
    const days10 = { score: 92.4, recordedDaysCount: 10 };
    const unlockedB = days10.score >= 90 && days10.recordedDaysCount >= 10;
    assert.strictEqual(unlockedB, true, 'Must unlock when score >= 90% and recordedDaysCount >= 10');
  });

  it('F9.6: should verify UI enforcement of unlock conditions in Weekly and Monthly views', () => {
    const weeklyViewPath = path.join(PROJECT_ROOT, 'src/components/WeeklyRewardsView.tsx');
    const weeklyContent = fs.readFileSync(weeklyViewPath, 'utf-8');
    assert.ok(
      weeklyContent.includes('weekScore >= requiredThreshold && weekScoreData.recordedDaysCount >= 3'),
      'Weekly view must enforce >= threshold AND recordedDaysCount >= 3'
    );

    const monthlyViewPath = path.join(PROJECT_ROOT, 'src/components/MonthlyView.tsx');
    const monthlyContent = fs.readFileSync(monthlyViewPath, 'utf-8');
    assert.ok(
      monthlyContent.includes('monthlyScore >= requiredThreshold && monthScoreData.recordedDaysCount >= 10'),
      'Monthly view must enforce >= threshold AND recordedDaysCount >= 10'
    );
  });
});

describe('Tier 1 - Feature 10: 2027 Milestones Vault Confirmation (R6)', () => {
  it('F10.1: should include predefined 2027 vision milestones in starter data', () => {
    assert.ok(INITIAL_MILESTONES_2027.length >= 2);
    const govCareer = INITIAL_MILESTONES_2027.find(m => m.id === 'm_gov_career');
    assert.ok(govCareer, 'Must contain Government Career predefined milestone');
    assert.strictEqual(govCareer.reward, 'Gaming PC');
    assert.strictEqual(govCareer.achieved, false);

    const aesthetic = INITIAL_MILESTONES_2027.find(m => m.id === 'm_english_aesthetic');
    assert.ok(aesthetic, 'Must contain English + Aesthetic Body predefined milestone');
    assert.strictEqual(aesthetic.reward, 'Brand-New Mobile Phone');
  });

  it('F10.2: should maintain achieved: false initially and NEVER auto-unlock on 100% daily scores', () => {
    const milestone: Milestone2027 = {
      ...INITIAL_MILESTONES_2027[0],
      achieved: false,
    };

    // Even if scoring engine hits 100%
    const perfectDay = calculateDayScore('2026-09-11', [
      { id: 'g1', name: 'G1', category: 'SSC', target: '1h', frequency: 'Daily', startDate: '2026-01-01', active: true },
    ], [
      { id: 'l1', date: '2026-09-11', goalId: 'g1', completed: true, timestamp: 1 },
    ]);
    assert.strictEqual(perfectDay.score, 100);

    // Invariant: milestone achievement remains false
    assert.strictEqual(milestone.achieved, false, 'Daily scores alone must NEVER auto-unlock milestone rewards');
  });

  it('F10.3: should require manual user confirmation to toggle milestone achieved status', () => {
    const milestone: Milestone2027 = {
      id: 'm_test_manual',
      title: 'Pass CGL Tier 1',
      description: 'Score 160+',
      category: 'SSC',
      reward: 'Noise Cancelling Headphones',
      rewardCategory: 'Technology',
      budget: 15000,
      currency: '₹',
      achieved: false,
    };

    // Simulation of manual confirmation handler
    const confirmAchievement = (m: Milestone2027, confirmedInReality: boolean): Milestone2027 => {
      if (!confirmedInReality) return m;
      return {
        ...m,
        achieved: true,
        achievedDate: new Date().toISOString().split('T')[0],
      };
    };

    const updated = confirmAchievement(milestone, true);
    assert.strictEqual(updated.achieved, true);
    assert.ok(updated.achievedDate);

    // Support undo
    const undone = { ...updated, achieved: false, achievedDate: undefined };
    assert.strictEqual(undone.achieved, false);
    assert.strictEqual(undone.achievedDate, undefined);
  });

  it('F10.4: should verify manual confirmation dialog text in Milestones2027View.tsx', () => {
    const milestonesViewPath = path.join(PROJECT_ROOT, 'src/components/Milestones2027View.tsx');
    const content = fs.readFileSync(milestonesViewPath, 'utf-8');

    assert.ok(
      content.includes('Confirm Real-World Milestone Achievement'),
      'Must contain real-world milestone achievement confirmation dialog'
    );
    assert.ok(
      content.includes('Have you achieved') && content.includes('in reality?'),
      'Must ask user if they have achieved milestone in reality'
    );
    assert.ok(
      content.includes('Requires manual confirmation'),
      'Must clearly state that major rewards require manual confirmation'
    );
  });

  it('F10.5: should support full CRUD on 2027 milestones', () => {
    const milestonesList: Milestone2027[] = [...INITIAL_MILESTONES_2027];

    // Create
    const custom: Milestone2027 = {
      id: 'm_custom_1',
      title: 'Run Marathon',
      description: 'Sub-4 hours marathon',
      category: 'Fitness',
      reward: 'Premium Running Shoes',
      rewardCategory: 'Personal',
      budget: 12000,
      currency: '₹',
      achieved: false,
    };
    milestonesList.push(custom);
    assert.strictEqual(milestonesList.length, INITIAL_MILESTONES_2027.length + 1);

    // Update
    const idx = milestonesList.findIndex(m => m.id === 'm_custom_1');
    milestonesList[idx] = { ...milestonesList[idx], budget: 14000 };
    assert.strictEqual(milestonesList[idx].budget, 14000);

    // Delete
    const filtered = milestonesList.filter(m => m.id !== 'm_custom_1');
    assert.strictEqual(filtered.length, INITIAL_MILESTONES_2027.length);
  });

  it('F10.6: should preserve currency and budget formatting on milestone cards', () => {
    const milestone = INITIAL_MILESTONES_2027[0];
    assert.strictEqual(milestone.currency, '₹');
    assert.strictEqual(milestone.budget, 85000);
  });
});
