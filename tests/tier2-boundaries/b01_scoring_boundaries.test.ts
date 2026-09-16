import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateDayScore } from '../../src/services/storage';
import { Goal, DailyLogEntry } from '../../src/types';

describe('Tier 2 - Boundary 1: Scoring Engine Precision & Extremes', () => {
  it('B1.1: should return score=0, totalGoals=0, completedGoals=0 when 0 active goals exist (divide-by-zero protection)', () => {
    const emptyGoals: Goal[] = [];
    const logs: DailyLogEntry[] = [
      { id: 'l1', date: '2026-09-11', goalId: 'nonexistent', completed: true, timestamp: 1 },
    ];

    const result = calculateDayScore('2026-09-11', emptyGoals, logs);
    assert.strictEqual(result.totalGoals, 0);
    assert.strictEqual(result.completedGoals, 0);
    assert.strictEqual(result.score, 0);
    assert.strictEqual(Number.isNaN(result.score), false, 'Score must not be NaN');
  });

  it('B1.2: should return score=0 when all existing goals are paused', () => {
    const pausedGoals: Goal[] = [
      { id: 'g1', name: 'Paused 1', category: 'Other', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: false },
      { id: 'g2', name: 'Paused 2', category: 'Other', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: false },
    ];
    const logs: DailyLogEntry[] = [
      { id: 'l1', date: '2026-09-11', goalId: 'g1', completed: true, timestamp: 1 },
    ];

    const result = calculateDayScore('2026-09-11', pausedGoals, logs);
    assert.strictEqual(result.totalGoals, 0);
    assert.strictEqual(result.score, 0);
  });

  it('B1.3: should return score=100% when 100% of active goals are completed (upper bound)', () => {
    const goals: Goal[] = [
      { id: 'g1', name: 'G1', category: 'SSC', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
      { id: 'g2', name: 'G2', category: 'Fitness', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
      { id: 'g3', name: 'G3', category: 'English', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
    ];
    const logs: DailyLogEntry[] = [
      { id: 'l1', date: '2026-09-11', goalId: 'g1', completed: true, timestamp: 1 },
      { id: 'l2', date: '2026-09-11', goalId: 'g2', completed: true, timestamp: 2 },
      { id: 'l3', date: '2026-09-11', goalId: 'g3', completed: true, timestamp: 3 },
    ];

    const result = calculateDayScore('2026-09-11', goals, logs);
    assert.strictEqual(result.score, 100);
    assert.strictEqual(result.completedGoals, 3);
    assert.strictEqual(result.totalGoals, 3);
  });

  it('B1.4: should return score=0% when 0 active goals are completed (lower bound)', () => {
    const goals: Goal[] = [
      { id: 'g1', name: 'G1', category: 'SSC', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
      { id: 'g2', name: 'G2', category: 'Fitness', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
    ];
    const logs: DailyLogEntry[] = [
      { id: 'l1', date: '2026-09-11', goalId: 'g1', completed: false, failureReason: 'Too tired', timestamp: 1 },
      { id: 'l2', date: '2026-09-11', goalId: 'g2', completed: false, failureReason: 'Procrastination', timestamp: 2 },
    ];

    const result = calculateDayScore('2026-09-11', goals, logs);
    assert.strictEqual(result.score, 0);
    assert.strictEqual(result.completedGoals, 0);
    assert.strictEqual(result.totalGoals, 2);
  });

  it('B1.5: should correctly round 1/3 completed active goals to 33%', () => {
    const goals: Goal[] = [
      { id: 'g1', name: 'G1', category: 'SSC', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
      { id: 'g2', name: 'G2', category: 'Fitness', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
      { id: 'g3', name: 'G3', category: 'English', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
    ];
    const logs: DailyLogEntry[] = [
      { id: 'l1', date: '2026-09-11', goalId: 'g1', completed: true, timestamp: 1 },
    ];

    const result = calculateDayScore('2026-09-11', goals, logs);
    assert.strictEqual(result.score, 33);
  });

  it('B1.6: should correctly round 2/3 completed active goals to 67%', () => {
    const goals: Goal[] = [
      { id: 'g1', name: 'G1', category: 'SSC', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
      { id: 'g2', name: 'G2', category: 'Fitness', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
      { id: 'g3', name: 'G3', category: 'English', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
    ];
    const logs: DailyLogEntry[] = [
      { id: 'l1', date: '2026-09-11', goalId: 'g1', completed: true, timestamp: 1 },
      { id: 'l2', date: '2026-09-11', goalId: 'g2', completed: true, timestamp: 2 },
    ];

    const result = calculateDayScore('2026-09-11', goals, logs);
    assert.strictEqual(result.score, 67);
  });

  it('B1.7: should correctly round 5/6 completed active goals to 83%', () => {
    const goals: Goal[] = Array.from({ length: 6 }, (_, i) => ({
      id: `g_${i}`,
      name: `Goal ${i}`,
      category: 'SSC',
      target: '1h',
      frequency: 'Daily',
      startDate: '2026-09-01',
      active: true,
    }));
    const logs: DailyLogEntry[] = Array.from({ length: 5 }, (_, i) => ({
      id: `l_${i}`,
      date: '2026-09-11',
      goalId: `g_${i}`,
      completed: true,
      timestamp: i,
    }));

    const result = calculateDayScore('2026-09-11', goals, logs);
    assert.strictEqual(result.score, 83);
  });

  it('B1.8: should correctly round 6/7 completed active goals to 86%', () => {
    const goals: Goal[] = Array.from({ length: 7 }, (_, i) => ({
      id: `g_${i}`,
      name: `Goal ${i}`,
      category: 'SSC',
      target: '1h',
      frequency: 'Daily',
      startDate: '2026-09-01',
      active: true,
    }));
    const logs: DailyLogEntry[] = Array.from({ length: 6 }, (_, i) => ({
      id: `l_${i}`,
      date: '2026-09-11',
      goalId: `g_${i}`,
      completed: true,
      timestamp: i,
    }));

    const result = calculateDayScore('2026-09-11', goals, logs);
    assert.strictEqual(result.score, 86);
  });

  it('B1.9: should treat unrecorded goals as incomplete without crashing', () => {
    const goals: Goal[] = [
      { id: 'g1', name: 'G1', category: 'SSC', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
      { id: 'g2', name: 'G2', category: 'Fitness', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
    ];
    // No logs recorded for this day
    const result = calculateDayScore('2026-09-11', goals, []);
    assert.strictEqual(result.totalGoals, 2);
    assert.strictEqual(result.completedGoals, 0);
    assert.strictEqual(result.score, 0);
  });

  it('B1.10: should handle a single active goal binary state (0% vs 100%)', () => {
    const singleGoal: Goal[] = [
      { id: 'g_solo', name: 'Solo', category: 'Personal', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
    ];

    const uncompleted = calculateDayScore('2026-09-11', singleGoal, [
      { id: 'l1', date: '2026-09-11', goalId: 'g_solo', completed: false, timestamp: 1 },
    ]);
    assert.strictEqual(uncompleted.score, 0);

    const completed = calculateDayScore('2026-09-11', singleGoal, [
      { id: 'l2', date: '2026-09-11', goalId: 'g_solo', completed: true, timestamp: 2 },
    ]);
    assert.strictEqual(completed.score, 100);
  });

  it('B1.11: should handle large scale active goal stress test (100 active goals)', () => {
    const goals: Goal[] = Array.from({ length: 100 }, (_, i) => ({
      id: `g_stress_${i}`,
      name: `Goal ${i}`,
      category: 'SSC',
      target: '1h',
      frequency: 'Daily',
      startDate: '2026-09-01',
      active: true,
    }));

    const logs: DailyLogEntry[] = Array.from({ length: 73 }, (_, i) => ({
      id: `l_${i}`,
      date: '2026-09-11',
      goalId: `g_stress_${i}`,
      completed: true,
      timestamp: i,
    }));

    const result = calculateDayScore('2026-09-11', goals, logs);
    assert.strictEqual(result.totalGoals, 100);
    assert.strictEqual(result.completedGoals, 73);
    assert.strictEqual(result.score, 73);
  });

  it('B1.12: should ignore duplicate log entries for the same goalId by taking latest entry', () => {
    const goals: Goal[] = [
      { id: 'g1', name: 'G1', category: 'SSC', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
    ];
    const logs: DailyLogEntry[] = [
      { id: 'l1', date: '2026-09-11', goalId: 'g1', completed: false, timestamp: 1 },
      { id: 'l2', date: '2026-09-11', goalId: 'g1', completed: true, timestamp: 2 },
    ];

    const result = calculateDayScore('2026-09-11', goals, logs);
    // In entries loop, later entry overwrites earlier
    assert.strictEqual(result.entries['g1'].completed, true);
    assert.strictEqual(result.completedGoals, 1);
    assert.strictEqual(result.score, 100);
  });
});
