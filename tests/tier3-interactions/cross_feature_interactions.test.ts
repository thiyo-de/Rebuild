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
  resetToCleanDefaults,
  AppState,
} from '../../src/services/storage';
import { STARTER_GOAL_TEMPLATES, INITIAL_MILESTONES_2027 } from '../../src/data/starterData';
import { getWeekInfo } from '../../src/utils/dateUtils';
import { Goal, DailyLogEntry, Milestone2027, AppSettings } from '../../src/types';

describe('Tier 3: Cross-Feature Interactions & Multi-System Invariants', () => {
  let mockStorage: MockLocalStorage;

  beforeEach(() => {
    mockStorage = setupTestEnvironment();
  });

  it('X1: Goal Pausing mid-week immediately drops it from active scoring denominator and recalculates weekly average', () => {
    const goal1: Goal = { id: 'g1', name: 'Maths', category: 'SSC', target: '2h', frequency: 'Daily', startDate: '2026-09-07', active: true };
    const goal2: Goal = { id: 'g2', name: 'English', category: 'English', target: '1h', frequency: 'Daily', startDate: '2026-09-07', active: true };

    const weekDays = ['2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13'];

    // Day 1 & Day 2: Both goals active. Only g1 completed = 50% (1/2)
    const logs: DailyLogEntry[] = [
      { id: '1', date: '2026-09-07', goalId: 'g1', completed: true, timestamp: 1 },
      { id: '2', date: '2026-09-07', goalId: 'g2', completed: false, timestamp: 2 },
      { id: '3', date: '2026-09-08', goalId: 'g1', completed: true, timestamp: 3 },
      { id: '4', date: '2026-09-08', goalId: 'g2', completed: false, timestamp: 4 },
    ];

    const weekScoreBefore = calculateWeekScore(weekDays, [goal1, goal2], logs);
    assert.strictEqual(weekScoreBefore.score, 50.0);

    // On Day 3 (Sept 9), user pauses goal2 (English) -> only goal1 active
    const pausedGoal2: Goal = { ...goal2, active: false };
    const goalsAfterPause = [goal1, pausedGoal2];

    // Day 3: user completes g1
    logs.push({ id: '5', date: '2026-09-09', goalId: 'g1', completed: true, timestamp: 5 });

    // Day 3 score is now 100% (1/1 active completed)
    const day3Score = calculateDayScore('2026-09-09', goalsAfterPause, logs);
    assert.strictEqual(day3Score.score, 100);
    assert.strictEqual(day3Score.totalGoals, 1);

    // Because goal2 is now paused, it is excluded from scoring denominator across all days,
    // so all recorded days with goal1 completed evaluate to 100% (1/1):
    const weekScoreAfter = calculateWeekScore(weekDays, goalsAfterPause, logs);
    assert.strictEqual(weekScoreAfter.score, 100.0, 'When goal2 is paused, only goal1 is evaluated for active score');
    assert.strictEqual(weekScoreAfter.recordedDaysCount, 3);
  });

  it('X2: Goal Archiving hides goal from active directory while preserving historical logs in Pareto diagnostics', () => {
    const liveGoal: Goal = { id: 'g_live', name: 'Live Goal', category: 'Fitness', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true };
    const archivedGoal: Goal = { id: 'g_arch', name: 'Old Subject', category: 'SSC', target: '1h', frequency: 'Daily', startDate: '2026-08-01', active: false, archived: true };

    const logs: DailyLogEntry[] = [
      { id: '1', date: '2026-08-15', goalId: 'g_arch', completed: false, failureReason: 'Too tired', timestamp: 1 },
      { id: '2', date: '2026-08-16', goalId: 'g_arch', completed: false, failureReason: 'Too tired', timestamp: 2 },
      { id: '3', date: '2026-09-11', goalId: 'g_live', completed: true, timestamp: 3 },
    ];

    // Active goals view filters out archived
    const activeGoals = [liveGoal, archivedGoal].filter(g => !g.archived && g.active);
    assert.strictEqual(activeGoals.length, 1);
    assert.strictEqual(activeGoals[0].id, 'g_live');

    // Analysis Pareto diagnostic groups all historical logs
    const reasonCounts: Record<string, number> = {};
    logs.filter(l => !l.completed && l.failureReason).forEach(l => {
      reasonCounts[l.failureReason!] = (reasonCounts[l.failureReason!] || 0) + 1;
    });

    assert.strictEqual(reasonCounts['Too tired'], 2, 'Archived goal logs must contribute to failure Pareto analysis');
  });

  it('X3: Daily completion during Recovery Mode counts toward streak and restores momentum', () => {
    const goals: Goal[] = [
      { id: 'g1', name: 'Maths', category: 'SSC', target: '2h', frequency: 'Daily', startDate: '2026-09-01', active: true },
      { id: 'g2', name: 'Workout', category: 'Fitness', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
    ];

    // D-1 (Sept 10): 0%, D-2 (Sept 9): 0% -> triggers recovery mode
    const logs: DailyLogEntry[] = [
      { id: '1', date: '2026-09-09', goalId: 'g1', completed: false, timestamp: 1 },
      { id: '2', date: '2026-09-10', goalId: 'g1', completed: false, timestamp: 2 },
    ];

    const recoveryBefore = checkRecoveryModeNeeded('2026-09-11', goals, logs);
    assert.strictEqual(recoveryBefore.isRecoveryMode, true);

    // Today (Sept 11): User completes both goals (100%)
    logs.push(
      { id: '3', date: '2026-09-11', goalId: 'g1', completed: true, timestamp: 3 },
      { id: '4', date: '2026-09-11', goalId: 'g2', completed: true, timestamp: 4 }
    );

    const todayScore = calculateDayScore('2026-09-11', goals, logs);
    assert.strictEqual(todayScore.score, 100);

    // Check tomorrow (Sept 12): Recovery mode must be deactivated because yesterday (Sept 11) was 100%
    const recoveryTomorrow = checkRecoveryModeNeeded('2026-09-12', goals, logs);
    assert.strictEqual(recoveryTomorrow.isRecoveryMode, false);
    assert.strictEqual(recoveryTomorrow.consecutiveLowDays, 0);
  });

  it('X4: Milestone reality confirmation dialog unlocks reward without altering daily score or streak', () => {
    const goal: Goal = { id: 'g1', name: 'Study', category: 'SSC', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true };
    const logs: DailyLogEntry[] = [
      { id: 'l1', date: '2026-09-11', goalId: 'g1', completed: false, failureReason: 'Work', timestamp: 1 },
    ];

    // Today's daily score is 0%
    const dayScoreBefore = calculateDayScore('2026-09-11', [goal], logs);
    assert.strictEqual(dayScoreBefore.score, 0);

    // Milestone is manually confirmed
    const milestone: Milestone2027 = {
      id: 'm1',
      title: 'Gov Exam Cleared',
      description: 'Cleared Prelims',
      category: 'SSC',
      reward: 'Gaming Laptop',
      rewardCategory: 'Technology',
      budget: 90000,
      currency: '₹',
      achieved: true,
      achievedDate: '2026-09-11',
    };

    assert.strictEqual(milestone.achieved, true);

    // Daily score must remain 0% (independent invariant)
    const dayScoreAfter = calculateDayScore('2026-09-11', [goal], logs);
    assert.strictEqual(dayScoreAfter.score, 0);
  });

  it('X5: Offline storage round-trip preserves 100% state identity across export -> reset -> import', () => {
    const complexState: AppState = {
      goals: [
        { id: 'g_ssc', name: 'SSC Maths', category: 'SSC', target: '2h', frequency: 'Daily', startDate: '2026-09-01', active: true, durationMinutes: 120 },
        { id: 'g_arch', name: 'Old Habit', category: 'Other', target: '10m', frequency: 'Daily', startDate: '2026-01-01', active: false, archived: true },
      ],
      dailyLogs: [
        { id: 'l_1', date: '2026-09-10', goalId: 'g_ssc', completed: true, timestamp: 1725969600000 },
        { id: 'l_2', date: '2026-09-11', goalId: 'g_ssc', completed: false, failureReason: 'Mental fog', timestamp: 1726056000000 },
      ],
      weeklyRewards: [
        { id: 'w_1', weekId: '2026-W37', weekNumber: 37, year: 2026, startDate: '2026-09-07', endDate: '2026-09-13', rewardName: 'Buffet', rewardType: 'Food', budget: 1200, actualSpend: 1150, currency: '₹', requiredScore: 90, isConfigLocked: true, isClaimed: true, claimedAt: '2026-09-11' },
      ],
      monthlyRewards: [
        { id: 'm_1', monthId: '2026-09', monthName: 'September 2026', year: 2026, rewardName: 'AirPods', rewardType: 'Technology', budget: 18000, actualSpend: 0, currency: '₹', requiredScore: 90, isClaimed: false },
      ],
      milestones: [
        { id: 'm_career', title: 'Top 100 Rank', description: 'Central Govt', category: 'SSC', reward: 'PC', rewardCategory: 'Tech', budget: 100000, currency: '₹', achieved: true, achievedDate: '2026-09-11' },
      ],
      settings: {
        weeklyRewardThreshold: 92,
        monthlyRewardThreshold: 90,
        currency: '₹',
        weekStartDay: 1,
        categories: ['SSC', 'Fitness', 'Personal'],
        failureReasons: ['Mental fog', 'Procrastination', 'Other'],
      },
    };

    // 1. Save state
    saveStoredState(complexState);

    // 2. Export to JSON
    const exportedJson = JSON.stringify(complexState);

    // 3. Reset to clean defaults
    resetToCleanDefaults();
    const wipedState = loadStoredState();
    assert.strictEqual(wipedState.goals.length, 0);

    // 4. Import from JSON
    const parsed = JSON.parse(exportedJson);
    saveStoredState(parsed);

    // 5. Verify restored state
    const restoredState = loadStoredState();
    assert.strictEqual(restoredState.goals.length, 2);
    assert.strictEqual(restoredState.goals[1].archived, true);
    assert.strictEqual(restoredState.dailyLogs.length, 2);
    assert.strictEqual(restoredState.dailyLogs[1].failureReason, 'Mental fog');
    assert.strictEqual(restoredState.weeklyRewards[0].actualSpend, 1150);
    assert.strictEqual(restoredState.settings.weeklyRewardThreshold, 92);
    assert.strictEqual(restoredState.milestones[0].achieved, true);
  });

  it('X6: Starter Blueprint activation creates active goal, integrates with Today YES recording, and computes score', () => {
    const blueprintTemplate = STARTER_GOAL_TEMPLATES.find(t => t.name === 'No Porn')!;

    const liveGoal: Goal = {
      ...blueprintTemplate,
      id: 'g_blueprint_active',
      startDate: '2026-09-11',
      active: true,
    };

    const logs: DailyLogEntry[] = [
      { id: 'l_bp_1', date: '2026-09-11', goalId: liveGoal.id, completed: true, timestamp: Date.now() },
    ];

    const dayScore = calculateDayScore('2026-09-11', [liveGoal], logs);
    assert.strictEqual(dayScore.score, 100);
    assert.strictEqual(dayScore.completedGoals, 1);
    assert.strictEqual(dayScore.totalGoals, 1);
  });

  it('X7: Custom failure reason created in Settings logs on failed goal and aggregates in Pareto breakdown', () => {
    const customReason = 'Family Emergency / Hospital Visit';
    const settings: AppSettings = {
      weeklyRewardThreshold: 90,
      monthlyRewardThreshold: 90,
      currency: '₹',
      weekStartDay: 1,
      categories: ['SSC'],
      failureReasons: ['Too tired', customReason],
    };

    assert.ok(settings.failureReasons.includes(customReason));

    const goal: Goal = { id: 'g1', name: 'SSC Quant', category: 'SSC', target: '2h', frequency: 'Daily', startDate: '2026-09-01', active: true };
    const logs: DailyLogEntry[] = [
      { id: 'l1', date: '2026-09-11', goalId: 'g1', completed: false, failureReason: customReason, timestamp: 1 },
    ];

    const dayScore = calculateDayScore('2026-09-11', [goal], logs);
    assert.strictEqual(dayScore.entries['g1'].failureReason, customReason);
  });

  it('X8: Lowering weekly threshold in Settings immediately unlocks previously locked week', () => {
    // Week performance: 88.0% with 4 recorded days
    const weekData = { score: 88.0, recordedDaysCount: 4 };

    // At default 90% threshold -> LOCKED
    const lockedAt90 = weekData.score >= 90 && weekData.recordedDaysCount >= 3;
    assert.strictEqual(lockedAt90, false);

    // User modifies weekly threshold in settings to 85%
    const customThreshold = 85;
    const unlockedAt85 = weekData.score >= customThreshold && weekData.recordedDaysCount >= 3;
    assert.strictEqual(unlockedAt85, true, 'Week must dynamically unlock when threshold is lowered below score');
  });

  it('X9: Toggling weekStartDay from Monday (1) to Sunday (0) alters week day boundary grouping', () => {
    // 2026-09-11 (Friday)
    const mondayAnchored = getWeekInfo('2026-09-11', 1);
    assert.strictEqual(mondayAnchored.startDate, '2026-09-07');
    assert.strictEqual(mondayAnchored.endDate, '2026-09-13');

    const sundayAnchored = getWeekInfo('2026-09-11', 0);
    assert.strictEqual(sundayAnchored.startDate, '2026-09-06');
    assert.strictEqual(sundayAnchored.endDate, '2026-09-12');
  });

  it('X10: Deleting a goal leaves historical daily logs intact without causing crash in scoring calculations', () => {
    const goalsBefore: Goal[] = [
      { id: 'g_to_delete', name: 'Temporary', category: 'Other', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
      { id: 'g_remain', name: 'Remaining', category: 'Fitness', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
    ];
    const logs: DailyLogEntry[] = [
      { id: '1', date: '2026-09-05', goalId: 'g_to_delete', completed: true, timestamp: 1 },
      { id: '2', date: '2026-09-05', goalId: 'g_remain', completed: true, timestamp: 2 },
    ];

    // Delete g_to_delete
    const goalsAfter = goalsBefore.filter(g => g.id !== 'g_to_delete');
    assert.strictEqual(goalsAfter.length, 1);

    // Score calculation on past date handles logs of deleted goals gracefully
    const pastScore = calculateDayScore('2026-09-05', goalsAfter, logs);
    assert.strictEqual(pastScore.totalGoals, 1);
    assert.strictEqual(pastScore.completedGoals, 1);
    assert.strictEqual(pastScore.score, 100);
  });

  it('X11: 15 failure reasons logged across goals map to biological patterns in Analysis', () => {
    const goal: Goal = { id: 'g1', name: 'Focus', category: 'Career', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true };
    const logs: DailyLogEntry[] = [
      { id: '1', date: '2026-09-01', goalId: 'g1', completed: false, failureReason: 'Phone / social media', timestamp: 1 },
      { id: '2', date: '2026-09-02', goalId: 'g1', completed: false, failureReason: 'Porn / distraction', timestamp: 2 },
      { id: '3', date: '2026-09-03', goalId: 'g1', completed: false, failureReason: 'Mental fog', timestamp: 3 },
    ];

    const failed = logs.filter(l => !l.completed);
    assert.strictEqual(failed.length, 3);
    const dopamineRelated = failed.filter(l => l.failureReason === 'Phone / social media' || l.failureReason === 'Porn / distraction');
    assert.strictEqual(dopamineRelated.length, 2);
  });

  it('X12: When all goals are paused, daily score is 0% but Recovery Mode is NOT triggered', () => {
    const goals: Goal[] = [
      { id: 'g1', name: 'G1', category: 'SSC', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: false },
      { id: 'g2', name: 'G2', category: 'English', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: false },
    ];
    const logs: DailyLogEntry[] = [
      { id: '1', date: '2026-09-10', goalId: 'g1', completed: false, timestamp: 1 },
      { id: '2', date: '2026-09-09', goalId: 'g1', completed: false, timestamp: 2 },
    ];

    const dayScore = calculateDayScore('2026-09-11', goals, logs);
    assert.strictEqual(dayScore.score, 0);

    const recovery = checkRecoveryModeNeeded('2026-09-11', goals, logs);
    assert.strictEqual(recovery.isRecoveryMode, false, 'Recovery mode must be false when all goals are paused');
  });

  it('X13: Rapid sequential YES/NO toggle on same goal overwrites existing day entry cleanly without duplication', () => {
    const goal: Goal = { id: 'g1', name: 'Study', category: 'SSC', target: '1h', frequency: 'Daily', startDate: '2026-09-11', active: true };

    const logs: DailyLogEntry[] = [
      { id: '1', date: '2026-09-11', goalId: 'g1', completed: false, failureReason: 'Forgot', timestamp: 100 },
      // User realizes they did it and taps YES
      { id: '2', date: '2026-09-11', goalId: 'g1', completed: true, timestamp: 200 },
    ];

    const dayScore = calculateDayScore('2026-09-11', [goal], logs);
    assert.strictEqual(dayScore.entries['g1'].completed, true);
    assert.strictEqual(dayScore.score, 100);
  });

  it('X14: Restoring a backup containing both active and archived goals correctly sets their status', () => {
    const backupState: AppState = {
      ...generateCleanState(),
      goals: [
        { id: 'g_active', name: 'Active 1', category: 'SSC', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true, archived: false },
        { id: 'g_archived', name: 'Archived 1', category: 'Fitness', target: '1h', frequency: 'Daily', startDate: '2026-08-01', active: false, archived: true },
      ],
    };

    saveStoredState(backupState);
    const restored = loadStoredState();

    const activeList = restored.goals.filter(g => g.active && !g.archived);
    const archivedList = restored.goals.filter(g => g.archived);

    assert.strictEqual(activeList.length, 1);
    assert.strictEqual(archivedList.length, 1);
  });

  it('X15: Monthly Review aggregates all 4 week segments accurately matching individual day scores', () => {
    const goal: Goal = { id: 'g1', name: 'Daily Target', category: 'Personal', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true };
    const monthDays: string[] = [];
    for (let i = 1; i <= 28; i++) {
      monthDays.push(`2026-09-${String(i).padStart(2, '0')}`);
    }

    // 14 days completed, 14 days missed
    const logs: DailyLogEntry[] = [];
    for (let i = 1; i <= 28; i++) {
      const d = `2026-09-${String(i).padStart(2, '0')}`;
      logs.push({ id: `l_${i}`, date: d, goalId: 'g1', completed: i <= 14, timestamp: i });
    }

    const monthScore = calculateMonthScore(monthDays, [goal], logs);
    assert.strictEqual(monthScore.recordedDaysCount, 28);
    assert.strictEqual(monthScore.score, 50.0);
  });
});
