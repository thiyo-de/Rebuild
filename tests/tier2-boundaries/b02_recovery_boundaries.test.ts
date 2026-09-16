import { describe, it } from 'node:test';
import assert from 'node:assert';
import { checkRecoveryModeNeeded } from '../../src/services/storage';
import { Goal, DailyLogEntry } from '../../src/types';

describe('Tier 2 - Boundary 2: Recovery Mode 2-Consecutive Sub-70% Trigger Rules', () => {
  const activeGoals: Goal[] = [
    { id: 'g1', name: 'Maths', category: 'SSC', target: '2h', frequency: 'Daily', startDate: '2026-09-01', active: true },
    { id: 'g2', name: 'English', category: 'English', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
    { id: 'g3', name: 'Workout', category: 'Fitness', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
    { id: 'g4', name: 'Stretching', category: 'Fitness', target: '10m', frequency: 'Daily', startDate: '2026-09-01', active: true },
    { id: 'g5', name: 'No Porn', category: 'Self-Control', target: 'Zero', frequency: 'Daily', startDate: '2026-09-01', active: true },
    { id: 'g6', name: 'Reading', category: 'English', target: '30m', frequency: 'Daily', startDate: '2026-09-01', active: true },
    { id: 'g7', name: 'Mock Test', category: 'SSC', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
    { id: 'g8', name: 'Cardio', category: 'Fitness', target: '30m', frequency: 'Daily', startDate: '2026-09-01', active: true },
    { id: 'g9', name: 'Grammar', category: 'English', target: '30m', frequency: 'Daily', startDate: '2026-09-01', active: true },
    { id: 'g10', name: 'Vocab', category: 'English', target: '20m', frequency: 'Daily', startDate: '2026-09-01', active: true },
  ]; // 10 goals: 1 goal = 10%

  it('B2.1: should not trigger recovery mode when 0 past days are logged', () => {
    const result = checkRecoveryModeNeeded('2026-09-11', activeGoals, []);
    assert.strictEqual(result.isRecoveryMode, false);
    assert.strictEqual(result.consecutiveLowDays, 0);
  });

  it('B2.2: should not trigger recovery mode after exactly 1 low score day (boundary)', () => {
    // Yesterday (D-1): 0%
    const logs: DailyLogEntry[] = [
      { id: 'l1', date: '2026-09-10', goalId: 'g1', completed: false, timestamp: 1 },
    ];

    const result = checkRecoveryModeNeeded('2026-09-11', activeGoals, logs);
    assert.strictEqual(result.isRecoveryMode, false, '1 sub-70% day must not trigger recovery mode');
    assert.strictEqual(result.consecutiveLowDays, 1);
  });

  it('B2.3: should trigger recovery mode after exactly 2 consecutive low score days (boundary)', () => {
    // D-1: 50% (5/10), D-2: 60% (6/10) - both < 70%
    const logs: DailyLogEntry[] = [];
    // D-1
    for (let i = 1; i <= 5; i++) logs.push({ id: `d1_${i}`, date: '2026-09-10', goalId: `g${i}`, completed: true, timestamp: i });
    // D-2
    for (let i = 1; i <= 6; i++) logs.push({ id: `d2_${i}`, date: '2026-09-09', goalId: `g${i}`, completed: true, timestamp: i });

    const result = checkRecoveryModeNeeded('2026-09-11', activeGoals, logs);
    assert.strictEqual(result.isRecoveryMode, true, '2 consecutive sub-70% days must trigger recovery mode');
    assert.strictEqual(result.consecutiveLowDays, 2);
  });

  it('B2.4: should trigger recovery mode after 3 consecutive low score days', () => {
    // D-1: 30%, D-2: 40%, D-3: 20%
    const logs: DailyLogEntry[] = [
      { id: '1', date: '2026-09-10', goalId: 'g1', completed: true, timestamp: 1 },
      { id: '2', date: '2026-09-09', goalId: 'g1', completed: true, timestamp: 2 },
      { id: '3', date: '2026-09-08', goalId: 'g1', completed: true, timestamp: 3 },
    ];

    const result = checkRecoveryModeNeeded('2026-09-11', activeGoals, logs);
    assert.strictEqual(result.isRecoveryMode, true);
    assert.strictEqual(result.consecutiveLowDays, 3);
  });

  it('B2.5: should treat exact score of 69% as sub-70% (low day threshold boundary)', () => {
    // 100 goals: 69 completed = 69%
    const hundredGoals: Goal[] = Array.from({ length: 100 }, (_, i) => ({
      id: `g_${i}`, name: `G ${i}`, category: 'SSC', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true,
    }));

    const logs: DailyLogEntry[] = [];
    // D-1: 69%
    for (let i = 0; i < 69; i++) logs.push({ id: `d1_${i}`, date: '2026-09-10', goalId: `g_${i}`, completed: true, timestamp: i });
    // D-2: 69%
    for (let i = 0; i < 69; i++) logs.push({ id: `d2_${i}`, date: '2026-09-09', goalId: `g_${i}`, completed: true, timestamp: i });

    const result = checkRecoveryModeNeeded('2026-09-11', hundredGoals, logs);
    assert.strictEqual(result.isRecoveryMode, true, '69% must be recognized as sub-70%');
    assert.strictEqual(result.consecutiveLowDays, 2);
  });

  it('B2.6: should treat exact score of 70% as safe and BREAK the consecutive low day streak', () => {
    // D-1: 70% (7/10), D-2: 0% (0/10)
    const logs: DailyLogEntry[] = [];
    // D-1 (yesterday) scored 70%
    for (let i = 1; i <= 7; i++) logs.push({ id: `d1_${i}`, date: '2026-09-10', goalId: `g${i}`, completed: true, timestamp: i });
    // D-2 scored 0%
    logs.push({ id: 'd2_0', date: '2026-09-09', goalId: 'g1', completed: false, timestamp: 100 });

    const result = checkRecoveryModeNeeded('2026-09-11', activeGoals, logs);
    assert.strictEqual(result.isRecoveryMode, false, '70% score yesterday must prevent recovery mode');
    assert.strictEqual(result.consecutiveLowDays, 0, 'Yesterday meeting 70% breaks consecutive low day count');
  });

  it('B2.7: should not trigger recovery mode when low days are non-consecutive (interrupted by >=70% day)', () => {
    // D-1 (yesterday): 50% (<70%), D-2: 90% (>=70%), D-3: 40% (<70%)
    const logs: DailyLogEntry[] = [];
    // D-1: 50%
    for (let i = 1; i <= 5; i++) logs.push({ id: `d1_${i}`, date: '2026-09-10', goalId: `g${i}`, completed: true, timestamp: i });
    // D-2: 90%
    for (let i = 1; i <= 9; i++) logs.push({ id: `d2_${i}`, date: '2026-09-09', goalId: `g${i}`, completed: true, timestamp: i });
    // D-3: 40%
    for (let i = 1; i <= 4; i++) logs.push({ id: `d3_${i}`, date: '2026-09-08', goalId: `g${i}`, completed: true, timestamp: i });

    const result = checkRecoveryModeNeeded('2026-09-11', activeGoals, logs);
    assert.strictEqual(result.isRecoveryMode, false, 'Non-consecutive low days must not trigger recovery mode');
    assert.strictEqual(result.consecutiveLowDays, 1, 'Only D-1 is counted as current consecutive low day');
  });

  it('B2.8: should deactivate recovery mode immediately on subsequent day if momentum is restored', () => {
    // Simulate recovery progression:
    // On 2026-09-11: D-1 (Sept 10 = 30%), D-2 (Sept 9 = 40%) -> Recovery Mode: TRUE
    const logs: DailyLogEntry[] = [
      { id: '1', date: '2026-09-10', goalId: 'g1', completed: true, timestamp: 1 },
      { id: '2', date: '2026-09-09', goalId: 'g1', completed: true, timestamp: 2 },
    ];
    const triggerDay = checkRecoveryModeNeeded('2026-09-11', activeGoals, logs);
    assert.strictEqual(triggerDay.isRecoveryMode, true);

    // On Sept 11 (Today), user executes 100% of active goals (Redemption!)
    for (let i = 1; i <= 10; i++) {
      logs.push({ id: `redempt_${i}`, date: '2026-09-11', goalId: `g${i}`, completed: true, timestamp: Date.now() });
    }

    // On 2026-09-12 (Tomorrow): D-1 (Sept 11 = 100%)
    const nextDay = checkRecoveryModeNeeded('2026-09-12', activeGoals, logs);
    assert.strictEqual(nextDay.isRecoveryMode, false, 'Recovery mode must be cleared after momentum reset');
    assert.strictEqual(nextDay.consecutiveLowDays, 0);
  });

  it('B2.9: should return isRecoveryMode=false when all goals are paused even if previous low logs exist', () => {
    const allPaused = activeGoals.map(g => ({ ...g, active: false }));
    const logs: DailyLogEntry[] = [
      { id: '1', date: '2026-09-10', goalId: 'g1', completed: false, timestamp: 1 },
      { id: '2', date: '2026-09-09', goalId: 'g1', completed: false, timestamp: 2 },
    ];

    const result = checkRecoveryModeNeeded('2026-09-11', allPaused, logs);
    assert.strictEqual(result.isRecoveryMode, false);
    assert.strictEqual(result.consecutiveLowDays, 0);
  });
});
