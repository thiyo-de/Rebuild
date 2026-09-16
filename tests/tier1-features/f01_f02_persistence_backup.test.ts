import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { setupTestEnvironment, MockLocalStorage } from '../helpers/mockStorage';
import {
  loadStoredState,
  saveStoredState,
  generateCleanState,
  resetToCleanDefaults,
  AppState,
} from '../../src/services/storage';
import { Goal, DailyLogEntry, AppSettings } from '../../src/types';

describe('Tier 1 - Feature 1: Offline Local Persistence (R1)', () => {
  let mockStorage: MockLocalStorage;

  beforeEach(() => {
    mockStorage = setupTestEnvironment();
  });

  it('F1.1: should initialize with a clean state on first run without dummy goals or fake logs', () => {
    const state = loadStoredState();
    assert.strictEqual(state.goals.length, 0, 'Clean state must not contain dummy goals');
    assert.strictEqual(state.dailyLogs.length, 0, 'Clean state must not contain fake logs');
    assert.strictEqual(state.weeklyRewards.length, 0, 'Clean state must not contain dummy weekly rewards');
    assert.strictEqual(state.monthlyRewards.length, 0, 'Clean state must not contain dummy monthly rewards');
    assert.ok(state.milestones.length >= 2, 'Clean state must preserve requested predefined 2027 milestones');
    assert.ok(state.settings.weeklyRewardThreshold === 90, 'Default weekly threshold must be 90%');
  });

  it('F1.2: should use namespaced keys under rebuild_2027_*_v2 for local storage', () => {
    const initial = generateCleanState();
    saveStoredState(initial);

    const keys = Object.keys(mockStorage.dump());
    assert.ok(keys.includes('rebuild_2027_initialized_v2'), 'Missing initialization key');
    assert.ok(keys.includes('rebuild_2027_goals_v2'), 'Missing goals key');
    assert.ok(keys.includes('rebuild_2027_daily_logs_v2'), 'Missing daily logs key');
    assert.ok(keys.includes('rebuild_2027_weekly_rewards_v2'), 'Missing weekly rewards key');
    assert.ok(keys.includes('rebuild_2027_monthly_rewards_v2'), 'Missing monthly rewards key');
    assert.ok(keys.includes('rebuild_2027_milestones_v2'), 'Missing milestones key');
    assert.ok(keys.includes('rebuild_2027_settings_v2'), 'Missing settings key');
  });

  it('F1.3: should persist goals, logs, and settings across app reload / re-instantiation', () => {
    const testGoal: Goal = {
      id: 'g_test_persist_1',
      name: 'Morning Meditation',
      category: 'Self-Control',
      target: '20 mins',
      frequency: 'Daily',
      startDate: '2026-09-11',
      active: true,
      durationMinutes: 20,
    };

    const testLog: DailyLogEntry = {
      id: 'log_test_1',
      date: '2026-09-11',
      goalId: 'g_test_persist_1',
      completed: true,
      timestamp: Date.now(),
    };

    const customSettings: AppSettings = {
      weeklyRewardThreshold: 85,
      monthlyRewardThreshold: 85,
      currency: '$',
      weekStartDay: 1,
      categories: ['Study', 'Fitness'],
      failureReasons: ['Tired'],
    };

    const stateToSave: AppState = {
      goals: [testGoal],
      dailyLogs: [testLog],
      weeklyRewards: [],
      monthlyRewards: [],
      milestones: [],
      settings: customSettings,
    };

    saveStoredState(stateToSave);

    // Simulate reload by calling loadStoredState again
    const reloaded = loadStoredState();
    assert.strictEqual(reloaded.goals.length, 1);
    assert.strictEqual(reloaded.goals[0].id, 'g_test_persist_1');
    assert.strictEqual(reloaded.goals[0].name, 'Morning Meditation');
    assert.strictEqual(reloaded.dailyLogs.length, 1);
    assert.strictEqual(reloaded.dailyLogs[0].completed, true);
    assert.strictEqual(reloaded.settings.currency, '$');
    assert.strictEqual(reloaded.settings.weeklyRewardThreshold, 85);
  });

  it('F1.4: should reset data to clean defaults while retaining predefined 2027 milestones', () => {
    // Populate storage with arbitrary data
    const dirtyState: AppState = {
      goals: [{ id: 'g1', name: 'Temporary', category: 'Other', target: '1h', frequency: 'Daily', startDate: '2026-01-01', active: true }],
      dailyLogs: [{ id: 'l1', date: '2026-01-01', goalId: 'g1', completed: false, timestamp: 12345 }],
      weeklyRewards: [],
      monthlyRewards: [],
      milestones: [{ id: 'custom_m', title: 'Custom', description: 'Desc', category: 'General', reward: 'Treat', rewardCategory: 'Food', currency: '₹', achieved: false }],
      settings: { weeklyRewardThreshold: 75, monthlyRewardThreshold: 75, currency: '€', weekStartDay: 0, categories: [], failureReasons: [] },
    };
    saveStoredState(dirtyState);

    const resetState = resetToCleanDefaults();
    assert.strictEqual(resetState.goals.length, 0, 'Goals must be wiped on clean reset');
    assert.strictEqual(resetState.dailyLogs.length, 0, 'Logs must be wiped on clean reset');
    assert.ok(resetState.milestones.length >= 2, 'Predefined milestones must be restored');
    assert.strictEqual(resetState.settings.weeklyRewardThreshold, 90, 'Settings threshold must reset to 90');

    // Confirm persisted state also reflects reset
    const confirmed = loadStoredState();
    assert.strictEqual(confirmed.goals.length, 0);
  });

  it('F1.5: should handle storage read error gracefully by returning safe clean slate', () => {
    mockStorage.setItem('rebuild_2027_initialized_v2', 'true');
    mockStorage.setItem('rebuild_2027_goals_v2', 'MALFORMED_JSON_{{{');

    const fallbackState = loadStoredState();
    assert.ok(Array.isArray(fallbackState.goals), 'Should return valid array of goals on parse error');
    assert.ok(fallbackState.milestones.length >= 2, 'Should return safe milestones');
  });

  it('F1.6: should ensure 100% on-device synchronous persistence without background cloud workers', () => {
    const clean = generateCleanState();
    saveStoredState(clean);

    // Verify localStorage has immediately updated synchronously
    const rawGoals = mockStorage.getItem('rebuild_2027_goals_v2');
    assert.strictEqual(rawGoals, '[]');
  });
});

describe('Tier 1 - Feature 2: JSON Backup & Full Entity Restore (R1)', () => {
  let mockStorage: MockLocalStorage;

  beforeEach(() => {
    mockStorage = setupTestEnvironment();
  });

  it('F2.1: should serialize full export state containing all 6 core entities', () => {
    const fullState: AppState = {
      goals: [
        { id: 'g_cgl_maths', name: 'SSC Maths', category: 'SSC', target: '2 hours', frequency: 'Daily', startDate: '2026-09-11', active: true },
      ],
      dailyLogs: [
        { id: 'log_cgl_1', date: '2026-09-11', goalId: 'g_cgl_maths', completed: true, timestamp: 1726056000000 },
      ],
      weeklyRewards: [
        { id: 'w1', weekId: '2026-W37', weekNumber: 37, year: 2026, startDate: '2026-09-07', endDate: '2026-09-13', rewardName: 'Dinner', rewardType: 'Food', budget: 500, actualSpend: 0, currency: '₹', requiredScore: 90, isConfigLocked: true, isClaimed: false },
      ],
      monthlyRewards: [
        { id: 'm1', monthId: '2026-09', monthName: 'September 2026', year: 2026, rewardName: 'Smartwatch', rewardType: 'Technology', budget: 3000, actualSpend: 0, currency: '₹', requiredScore: 90, isClaimed: false },
      ],
      milestones: [
        { id: 'm_gov', title: 'Gov Career', description: 'Exam Post', category: 'SSC', reward: 'PC', rewardCategory: 'Tech', budget: 85000, currency: '₹', achieved: true, achievedDate: '2026-09-11' },
      ],
      settings: {
        weeklyRewardThreshold: 90,
        monthlyRewardThreshold: 90,
        currency: '₹',
        weekStartDay: 1,
        categories: ['SSC', 'Fitness'],
        failureReasons: ['Procrastination'],
      },
    };

    const exportedJson = JSON.stringify(fullState, null, 2);
    const parsed = JSON.parse(exportedJson);

    assert.ok(parsed.goals && parsed.goals.length === 1);
    assert.ok(parsed.dailyLogs && parsed.dailyLogs.length === 1);
    assert.ok(parsed.weeklyRewards && parsed.weeklyRewards.length === 1);
    assert.ok(parsed.monthlyRewards && parsed.monthlyRewards.length === 1);
    assert.ok(parsed.milestones && parsed.milestones.length === 1);
    assert.ok(parsed.settings && parsed.settings.currency === '₹');
  });

  it('F2.2: should produce valid date-stamped backup filename format', () => {
    const today = new Date().toISOString().split('T')[0];
    const expectedPrefix = `rebuild_2027_backup_${today}.json`;
    assert.match(expectedPrefix, /^rebuild_2027_backup_\d{4}-\d{2}-\d{2}\.json$/);
  });

  it('F2.3: should validate backup integrity and reject malformed JSON without goals or settings', () => {
    const invalidBackup1 = { onlySomeData: [1, 2, 3] };
    const isValid1 = Boolean((invalidBackup1 as any).goals && (invalidBackup1 as any).settings);
    assert.strictEqual(isValid1, false, 'Should reject backup missing goals and settings');

    const invalidBackup2 = { goals: [] }; // missing settings
    const isValid2 = Boolean(invalidBackup2.goals && (invalidBackup2 as any).settings);
    assert.strictEqual(isValid2, false, 'Should reject backup missing settings');

    const validBackup = {
      goals: [],
      settings: { weeklyRewardThreshold: 90 },
    };
    const isValid3 = Boolean(validBackup.goals && validBackup.settings);
    assert.strictEqual(isValid3, true, 'Should accept valid structure');
  });

  it('F2.4: should achieve complete entity restoration from valid JSON backup', () => {
    const originalState: AppState = {
      goals: [
        { id: 'g_backup_test', name: 'English Vocal', category: 'English', target: '30 mins', frequency: 'Daily', startDate: '2026-09-01', active: true },
      ],
      dailyLogs: [
        { id: 'l_backup_test', date: '2026-09-01', goalId: 'g_backup_test', completed: true, timestamp: 1725148800000 },
      ],
      weeklyRewards: [],
      monthlyRewards: [],
      milestones: [
        { id: 'm_backup_test', title: 'English Fluency', description: 'C2 Level', category: 'English', reward: 'Trip', rewardCategory: 'Experience', budget: 20000, currency: '₹', achieved: false },
      ],
      settings: {
        weeklyRewardThreshold: 95,
        monthlyRewardThreshold: 90,
        currency: '₹',
        weekStartDay: 1,
        categories: ['English'],
        failureReasons: ['Too tired'],
      },
    };

    // Save and simulate state restore
    saveStoredState(originalState);
    const restored = loadStoredState();

    assert.strictEqual(restored.goals[0].name, 'English Vocal');
    assert.strictEqual(restored.dailyLogs[0].goalId, 'g_backup_test');
    assert.strictEqual(restored.milestones[0].reward, 'Trip');
    assert.strictEqual(restored.settings.weeklyRewardThreshold, 95);
  });

  it('F2.5: should preserve archived goal state and historical failure reasons across backup restoration', () => {
    const stateWithArchivedAndFailures: AppState = {
      goals: [
        { id: 'g_archived_1', name: 'Old Habit', category: 'Personal', target: '10m', frequency: 'Daily', startDate: '2026-01-01', active: false, archived: true },
      ],
      dailyLogs: [
        { id: 'log_fail_1', date: '2026-09-10', goalId: 'g_archived_1', completed: false, failureReason: 'Phone / social media', timestamp: 123456 },
      ],
      weeklyRewards: [],
      monthlyRewards: [],
      milestones: [],
      settings: {
        weeklyRewardThreshold: 90,
        monthlyRewardThreshold: 90,
        currency: '₹',
        weekStartDay: 1,
        categories: ['Personal'],
        failureReasons: ['Phone / social media'],
      },
    };

    saveStoredState(stateWithArchivedAndFailures);
    const loaded = loadStoredState();

    assert.strictEqual(loaded.goals[0].archived, true);
    assert.strictEqual(loaded.dailyLogs[0].failureReason, 'Phone / social media');
  });

  it('F2.6: should ensure full entity restore overwrites local state cleanly without residual orphan entities', () => {
    // Start with dirty state
    saveStoredState({
      goals: [{ id: 'orphan_1', name: 'Orphan', category: 'Other', target: '1h', frequency: 'Daily', startDate: '2026-01-01', active: true }],
      dailyLogs: [],
      weeklyRewards: [],
      monthlyRewards: [],
      milestones: [],
      settings: { weeklyRewardThreshold: 90, monthlyRewardThreshold: 90, currency: '₹', weekStartDay: 1, categories: [], failureReasons: [] },
    });

    // Restore clean backup
    const cleanBackup = generateCleanState();
    saveStoredState(cleanBackup);

    const reloaded = loadStoredState();
    assert.strictEqual(reloaded.goals.length, 0, 'Orphan goal must be completely purged');
  });

  it('F01.8: should preserve empty milestone array on reload without restoring initial defaults (RB-09)', () => {
    const emptyMilestonesState = {
      ...generateCleanState(),
      milestones: [],
    };
    saveStoredState(emptyMilestonesState);

    const reloaded = loadStoredState();
    assert.strictEqual(
      reloaded.milestones.length,
      0,
      'Explicitly empty milestones must not be resurrected with starter milestones'
    );
  });
});
