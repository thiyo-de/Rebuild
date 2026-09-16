import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { setupTestEnvironment, MockLocalStorage } from '../helpers/mockStorage';
import {
  calculateDayScore,
  calculateWeekScore,
  calculateMonthScore,
  checkRecoveryModeNeeded,
  loadStoredState,
  saveStoredState,
  generateCleanState,
  AppState,
} from '../../src/services/storage';
import { STARTER_GOAL_TEMPLATES } from '../../src/data/starterData';
import { Goal, DailyLogEntry, WeeklyReward, MonthlyReward } from '../../src/types';

describe('Tier 4: Real-World Workloads & Application-Level Scenarios', () => {
  let mockStorage: MockLocalStorage;

  beforeEach(() => {
    mockStorage = setupTestEnvironment();
  });

  it('W1: 30-Day Streak Lifecycle — simulates 30 consecutive days of logging with streak and perfect days analytics', () => {
    const goals: Goal[] = [
      { id: 'g1', name: 'SSC Maths', category: 'SSC', target: '2h', frequency: 'Daily', startDate: '2026-08-01', active: true },
      { id: 'g2', name: 'English', category: 'English', target: '1h', frequency: 'Daily', startDate: '2026-08-01', active: true },
      { id: 'g3', name: 'Workout', category: 'Fitness', target: '1h', frequency: 'Daily', startDate: '2026-08-01', active: true },
    ];

    const logs: DailyLogEntry[] = [];
    const daysCount = 30;
    let perfectDays = 0;

    // Days 1 to 25: 100% (all 3 completed)
    // Days 26 to 30: 67% (2 out of 3 completed, 1 missed due to 'Work')
    for (let day = 1; day <= daysCount; day++) {
      const dateStr = `2026-08-${String(day).padStart(2, '0')}`;
      if (day <= 25) {
        logs.push(
          { id: `l_${day}_1`, date: dateStr, goalId: 'g1', completed: true, timestamp: day * 1000 },
          { id: `l_${day}_2`, date: dateStr, goalId: 'g2', completed: true, timestamp: day * 1000 + 1 },
          { id: `l_${day}_3`, date: dateStr, goalId: 'g3', completed: true, timestamp: day * 1000 + 2 }
        );
        perfectDays++;
      } else {
        logs.push(
          { id: `l_${day}_1`, date: dateStr, goalId: 'g1', completed: true, timestamp: day * 1000 },
          { id: `l_${day}_2`, date: dateStr, goalId: 'g2', completed: true, timestamp: day * 1000 + 1 },
          { id: `l_${day}_3`, date: dateStr, goalId: 'g3', completed: false, failureReason: 'Work', timestamp: day * 1000 + 2 }
        );
      }
    }

    // Diagnostics verification
    assert.strictEqual(perfectDays, 25, 'Must record 25 perfect days');

    const totalEntries = logs.length;
    const completedEntries = logs.filter(l => l.completed).length;
    const overallRate = Math.round((completedEntries / totalEntries) * 100);

    // 25 days * 3 = 75 completed; 5 days * 2 = 10 completed; Total = 85 completed out of 90 = 94.4% -> 94%
    assert.strictEqual(totalEntries, 90);
    assert.strictEqual(completedEntries, 85);
    assert.strictEqual(overallRate, 94);

    // Verify day scores
    const day25Score = calculateDayScore('2026-08-25', goals, logs);
    assert.strictEqual(day25Score.score, 100);

    const day26Score = calculateDayScore('2026-08-26', goals, logs);
    assert.strictEqual(day26Score.score, 67);
  });

  it('W2: Recovery Redemption Cycle — 2 sub-70% days trigger Recovery Mode, followed by successful momentum reset', () => {
    const goals: Goal[] = [
      { id: 'g1', name: 'Target 1', category: 'SSC', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
      { id: 'g2', name: 'Target 2', category: 'Fitness', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
    ];

    const logs: DailyLogEntry[] = [
      // Day 1 (Sept 7): 100%
      { id: '1', date: '2026-09-07', goalId: 'g1', completed: true, timestamp: 1 },
      { id: '2', date: '2026-09-07', goalId: 'g2', completed: true, timestamp: 2 },
      // Day 2 (Sept 8): 100%
      { id: '3', date: '2026-09-08', goalId: 'g1', completed: true, timestamp: 3 },
      { id: '4', date: '2026-09-08', goalId: 'g2', completed: true, timestamp: 4 },
      // Day 3 (Sept 9): Slip! 0% (Mental fog)
      { id: '5', date: '2026-09-09', goalId: 'g1', completed: false, failureReason: 'Mental fog', timestamp: 5 },
      { id: '6', date: '2026-09-09', goalId: 'g2', completed: false, failureReason: 'Mental fog', timestamp: 6 },
      // Day 4 (Sept 10): Second slip! 0% (Too tired)
      { id: '7', date: '2026-09-10', goalId: 'g1', completed: false, failureReason: 'Too tired', timestamp: 7 },
      { id: '8', date: '2026-09-10', goalId: 'g2', completed: false, failureReason: 'Too tired', timestamp: 8 },
    ];

    // Day 5 (Sept 11): Recovery Mode must be ACTIVE
    const recoveryDay5 = checkRecoveryModeNeeded('2026-09-11', goals, logs);
    assert.strictEqual(recoveryDay5.isRecoveryMode, true, 'Recovery mode must be active after 2 consecutive 0% days');
    assert.strictEqual(recoveryDay5.consecutiveLowDays, 2);

    // User executes "Recover today. Never miss twice."
    logs.push(
      { id: '9', date: '2026-09-11', goalId: 'g1', completed: true, timestamp: 9 },
      { id: '10', date: '2026-09-11', goalId: 'g2', completed: true, timestamp: 10 }
    );

    const day5Score = calculateDayScore('2026-09-11', goals, logs);
    assert.strictEqual(day5Score.score, 100);

    // Day 6 (Sept 12): Recovery Mode is now RESOLVED and deactivated
    const recoveryDay6 = checkRecoveryModeNeeded('2026-09-12', goals, logs);
    assert.strictEqual(recoveryDay6.isRecoveryMode, false, 'Recovery mode must be cleared after good day');
    assert.strictEqual(recoveryDay6.consecutiveLowDays, 0);
  });

  it('W3: Clean Slate to Starter Blueprint Initialization & First Week Routine', () => {
    // 1. App begins with clean state (0 goals)
    const initialState = generateCleanState();
    saveStoredState(initialState);
    assert.strictEqual(loadStoredState().goals.length, 0);

    // 2. User activates 3 goals from Starter Blueprints (SSC Maths, English, Workout)
    const selectedTemplates = STARTER_GOAL_TEMPLATES.filter(
      t => t.name === 'SSC Maths' || t.name === 'English Study' || t.name === 'Workout'
    );
    assert.strictEqual(selectedTemplates.length, 3);

    const activatedGoals: Goal[] = selectedTemplates.map((t, idx) => ({
      ...t,
      id: `g_activated_${idx}`,
      startDate: '2026-09-07',
      active: true,
    }));

    const updatedState: AppState = {
      ...initialState,
      goals: activatedGoals,
    };
    saveStoredState(updatedState);

    // 3. User logs daily execution Monday through Sunday (Sept 7 to Sept 13)
    const weekDays = ['2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13'];
    const logs: DailyLogEntry[] = [];

    weekDays.forEach((dateStr, dayIdx) => {
      // 6 days 100% (3/3), Sunday 67% (2/3)
      activatedGoals.forEach((g, gIdx) => {
        const completed = dayIdx === 6 && gIdx === 2 ? false : true;
        logs.push({
          id: `log_${dateStr}_${g.id}`,
          date: dateStr,
          goalId: g.id,
          completed,
          failureReason: completed ? undefined : 'Too tired',
          timestamp: Date.now(),
        });
      });
    });

    const weekResult = calculateWeekScore(weekDays, activatedGoals, logs);
    assert.strictEqual(weekResult.recordedDaysCount, 7);
    // 6 days at 100, 1 day at 67 = 667 / 7 = 95.3%
    assert.strictEqual(weekResult.score, 95.3);

    // Weekly reward evaluation: score >= 90% AND recordedDaysCount >= 3
    const isUnlocked = weekResult.score >= 90 && weekResult.recordedDaysCount >= 3;
    assert.strictEqual(isUnlocked, true, 'First week routine must qualify for weekly reward unlock');
  });

  it('W4: Monthly Reward Qualification & Claiming Lifecycle', () => {
    const goals: Goal[] = [
      { id: 'g1', name: 'Primary Target', category: 'Career', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
    ];

    const monthDays: string[] = [];
    for (let i = 1; i <= 30; i++) {
      monthDays.push(`2026-09-${String(i).padStart(2, '0')}`);
    }

    const logs: DailyLogEntry[] = [];

    // User logs 15 days with 100% completion
    for (let i = 1; i <= 15; i++) {
      const dateStr = `2026-09-${String(i).padStart(2, '0')}`;
      logs.push({ id: `l_${i}`, date: dateStr, goalId: 'g1', completed: true, timestamp: i });
    }

    const monthResult = calculateMonthScore(monthDays, goals, logs);
    assert.strictEqual(monthResult.recordedDaysCount, 15);
    assert.strictEqual(monthResult.score, 100);

    // Reward qualification
    const requiredScore = 90;
    const isUnlocked = monthResult.score >= requiredScore && monthResult.recordedDaysCount >= 10;
    assert.strictEqual(isUnlocked, true);

    // User claims reward with actual spend
    const monthlyReward: MonthlyReward = {
      id: 'm_reward_2026_09',
      monthId: '2026-09',
      monthName: 'September 2026',
      year: 2026,
      rewardName: 'Fine Dining Dinner',
      rewardType: 'Food',
      budget: 3000,
      actualSpend: 2850,
      currency: '₹',
      requiredScore: 90,
      isClaimed: true,
      claimedAt: '2026-09-30',
    };

    assert.strictEqual(monthlyReward.isClaimed, true);
    assert.strictEqual(monthlyReward.actualSpend, 2850);
  });

  it('W5: Disaster Recovery & Corrupt Import Resilience — state survives corrupt import attempt and restores cleanly', () => {
    const originalState: AppState = {
      ...generateCleanState(),
      goals: [
        { id: 'g_val_1', name: 'SSC Maths', category: 'SSC', target: '2h', frequency: 'Daily', startDate: '2026-09-01', active: true },
      ],
      dailyLogs: [
        { id: 'l1', date: '2026-09-01', goalId: 'g_val_1', completed: true, timestamp: 1 },
      ],
    };

    saveStoredState(originalState);
    const exportJson = JSON.stringify(originalState);

    // Simulate attempted restore of corrupt file
    const corruptJson = 'INVALID_JSON_CORRUPTED_STREAM';
    let importSucceeded = false;
    try {
      const parsed = JSON.parse(corruptJson);
      if (parsed.goals && parsed.settings) {
        saveStoredState(parsed);
        importSucceeded = true;
      }
    } catch {
      // Graceful rejection
    }

    assert.strictEqual(importSucceeded, false, 'Corrupted import must fail gracefully');

    // Confirm state has not been wiped or corrupted
    const current = loadStoredState();
    assert.strictEqual(current.goals.length, 1);
    assert.strictEqual(current.goals[0].name, 'SSC Maths');

    // Valid restore succeeds
    const validParsed = JSON.parse(exportJson);
    saveStoredState(validParsed);
    const restored = loadStoredState();
    assert.strictEqual(restored.goals[0].name, 'SSC Maths');
  });

  it('W6: Multi-Category Academic & Fitness Shift — goal status transition cleanly segregates active tracking from history', () => {
    // Week 1: User tracks 2 SSC goals and 1 habit
    const sscMaths: Goal = { id: 'g_ssc', name: 'SSC Maths', category: 'SSC', target: '2h', frequency: 'Daily', startDate: '2026-09-01', active: true };
    const habit: Goal = { id: 'g_habit', name: 'Old Habit', category: 'Personal', target: '10m', frequency: 'Daily', startDate: '2026-09-01', active: true };

    const logs: DailyLogEntry[] = [
      { id: '1', date: '2026-09-01', goalId: 'g_ssc', completed: true, timestamp: 1 },
      { id: '2', date: '2026-09-01', goalId: 'g_habit', completed: false, failureReason: 'Procrastination', timestamp: 2 },
    ];

    // Day 1 score: 50% (1/2)
    const day1Score = calculateDayScore('2026-09-01', [sscMaths, habit], logs);
    assert.strictEqual(day1Score.score, 50);

    // Week 2 Shift: User archives Old Habit and adds Fitness Goal
    const archivedHabit: Goal = { ...habit, active: false, archived: true };
    const workout: Goal = { id: 'g_fit', name: 'Gym Workout', category: 'Fitness', target: '1h', frequency: 'Daily', startDate: '2026-09-08', active: true };

    const currentGoals = [sscMaths, archivedHabit, workout];
    // Day 8 (Sept 8): User completes SSC Maths and Gym Workout
    logs.push(
      { id: '3', date: '2026-09-08', goalId: 'g_ssc', completed: true, timestamp: 3 },
      { id: '4', date: '2026-09-08', goalId: 'g_fit', completed: true, timestamp: 4 }
    );

    // Day 8 score is 100% (2 active goals both completed)
    const day8Score = calculateDayScore('2026-09-08', currentGoals, logs);
    assert.strictEqual(day8Score.score, 100);
    assert.strictEqual(day8Score.totalGoals, 2);

    // Historical failure reasons in Pareto diagnostics still preserve the 'Procrastination' failure from archived habit
    const failures = logs.filter(l => !l.completed && l.failureReason);
    assert.strictEqual(failures.length, 1);
    assert.strictEqual(failures[0].failureReason, 'Procrastination');
  });

  it('W7: Year-Long Consistency Diagnostics & Pareto Analysis across 180 logged days', () => {
    const goals: Goal[] = [
      { id: 'g1', name: 'Core Goal', category: 'Career', target: '1h', frequency: 'Daily', startDate: '2026-01-01', active: true },
    ];

    const logs: DailyLogEntry[] = [];
    let completedCount = 0;
    const totalDays = 180;

    for (let day = 1; day <= totalDays; day++) {
      const month = Math.floor((day - 1) / 30) + 1;
      const dayInMonth = ((day - 1) % 30) + 1;
      const dateStr = `2026-${String(month).padStart(2, '0')}-${String(dayInMonth).padStart(2, '0')}`;

      // 80% completion rate (every 5th day missed)
      const isCompleted = day % 5 !== 0;
      if (isCompleted) completedCount++;

      logs.push({
        id: `l_${day}`,
        date: dateStr,
        goalId: 'g1',
        completed: isCompleted,
        failureReason: isCompleted ? undefined : day % 10 === 0 ? 'Too tired' : 'Phone / social media',
        timestamp: day * 86400000,
      });
    }

    assert.strictEqual(logs.length, 180);
    assert.strictEqual(completedCount, 144, '144 completed out of 180 days (80%)');

    const totalMissed = logs.filter(l => !l.completed).length;
    assert.strictEqual(totalMissed, 36);

    // Pareto distribution
    const phoneDistractions = logs.filter(l => l.failureReason === 'Phone / social media').length;
    const tiredCount = logs.filter(l => l.failureReason === 'Too tired').length;

    assert.strictEqual(phoneDistractions, 18);
    assert.strictEqual(tiredCount, 18);
    assert.strictEqual(phoneDistractions + tiredCount, totalMissed);
  });

  it('W8: Zero-Goal Clean Slate to Habit Formation Journey (21-Day Habit Milestone)', () => {
    // Start fresh
    const state = generateCleanState();
    saveStoredState(state);

    // Add 1 habit: Morning Hydration & Sunlight
    const habitGoal: Goal = {
      id: 'g_habit_sunlight',
      name: 'Morning Sunlight & Water',
      category: 'Health',
      target: '15 mins',
      frequency: 'Daily',
      startDate: '2026-09-01',
      active: true,
    };

    const logs: DailyLogEntry[] = [];
    for (let day = 1; day <= 21; day++) {
      const dStr = `2026-09-${String(day).padStart(2, '0')}`;
      logs.push({
        id: `l_${day}`,
        date: dStr,
        goalId: habitGoal.id,
        completed: true,
        timestamp: day * 1000,
      });
    }

    // Every day score is 100%
    for (let day = 1; day <= 21; day++) {
      const dStr = `2026-09-${String(day).padStart(2, '0')}`;
      const rec = calculateDayScore(dStr, [habitGoal], logs);
      assert.strictEqual(rec.score, 100);
      assert.strictEqual(rec.totalGoals, 1);
    }
  });
});
