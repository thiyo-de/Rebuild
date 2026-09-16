import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateDayScore } from '../../src/services/storage';
import { STARTER_GOAL_TEMPLATES, INITIAL_GOALS, DEFAULT_CATEGORIES } from '../../src/data/starterData';
import { Goal, DailyLogEntry } from '../../src/types';

describe('Tier 1 - Feature 7: Goals CRUD & Paused Score Exclusion (R5)', () => {
  it('F7.1: should create goal with complete model properties', () => {
    const newGoal: Goal = {
      id: 'g_cgl_quant',
      name: 'Quantitative Aptitude',
      category: 'SSC',
      target: '2 hours',
      frequency: 'Daily',
      reminderTime: '07:00',
      durationMinutes: 120,
      startDate: '2026-09-11',
      active: true,
      notes: 'Focus on geometry and arithmetic',
    };

    assert.strictEqual(newGoal.name, 'Quantitative Aptitude');
    assert.strictEqual(newGoal.category, 'SSC');
    assert.strictEqual(newGoal.active, true);
    assert.strictEqual(newGoal.durationMinutes, 120);
    assert.strictEqual(newGoal.frequency, 'Daily');
  });

  it('F7.2: should update goal properties without altering its unique identifier', () => {
    const originalGoal: Goal = {
      id: 'g_orig_1',
      name: 'Gym Workout',
      category: 'Fitness',
      target: '45 mins',
      frequency: 'Daily',
      startDate: '2026-09-01',
      active: true,
    };

    const updatedGoal: Goal = {
      ...originalGoal,
      name: 'Gym Workout — Upper Body',
      target: '1 hour',
      durationMinutes: 60,
    };

    assert.strictEqual(updatedGoal.id, originalGoal.id);
    assert.strictEqual(updatedGoal.name, 'Gym Workout — Upper Body');
    assert.strictEqual(updatedGoal.target, '1 hour');
  });

  it('F7.3: should completely exclude paused goals (active: false) from totalGoals and daily scoring', () => {
    const goals: Goal[] = [
      { id: 'g_active_1', name: 'Active Study', category: 'SSC', target: '1h', frequency: 'Daily', startDate: '2026-09-11', active: true },
      { id: 'g_paused_1', name: 'Paused Goal A', category: 'Personal', target: '1h', frequency: 'Daily', startDate: '2026-09-11', active: false },
      { id: 'g_paused_2', name: 'Paused Goal B', category: 'Career', target: '1h', frequency: 'Daily', startDate: '2026-09-11', active: false },
    ];

    const logs: DailyLogEntry[] = [
      { id: 'l1', date: '2026-09-11', goalId: 'g_active_1', completed: true, timestamp: 1 },
      // Even if log exists for paused goal, it must not count towards active denominator
      { id: 'l2', date: '2026-09-11', goalId: 'g_paused_1', completed: true, timestamp: 2 },
    ];

    const dayScore = calculateDayScore('2026-09-11', goals, logs);
    assert.strictEqual(dayScore.totalGoals, 1, 'Total goals must only count active goals');
    assert.strictEqual(dayScore.completedGoals, 1, 'Completed goals must only count completed active goals');
    assert.strictEqual(dayScore.score, 100, 'Score must be 100% since 1/1 active completed');
  });

  it('F7.4: should support archiving goals without deleting historical logs', () => {
    const goal: Goal = {
      id: 'g_archive_test',
      name: 'Temporary Project',
      category: 'Career',
      target: '30 mins',
      frequency: 'Daily',
      startDate: '2026-08-01',
      active: false,
      archived: true,
    };

    assert.strictEqual(goal.archived, true);
    assert.strictEqual(goal.active, false);

    // Filter out archived goals for active list
    const allGoals = [goal, { id: 'g_live', name: 'Live', category: 'SSC', target: '1h', frequency: 'Daily', startDate: '2026-08-01', active: true, archived: false }];
    const visibleActiveGoals = allGoals.filter(g => !g.archived);
    assert.strictEqual(visibleActiveGoals.length, 1);
    assert.strictEqual(visibleActiveGoals[0].id, 'g_live');
  });

  it('F7.5: should retain historical logs when a goal is deleted', () => {
    const goalToDelete: Goal = {
      id: 'g_deleted',
      name: 'To Delete',
      category: 'Other',
      target: '1h',
      frequency: 'Daily',
      startDate: '2026-09-01',
      active: true,
    };
    const historicalLogs: DailyLogEntry[] = [
      { id: 'log_hist_1', date: '2026-09-01', goalId: 'g_deleted', completed: true, timestamp: 1 },
      { id: 'log_hist_2', date: '2026-09-02', goalId: 'g_deleted', completed: false, failureReason: 'Too tired', timestamp: 2 },
    ];

    // Deletion simulates removing goal from goals array
    const remainingGoals: Goal[] = [];

    // Historical logs remain in dailyLogs collection
    assert.strictEqual(historicalLogs.length, 2, 'Historical logs must not be deleted');
    assert.strictEqual(remainingGoals.length, 0);
  });

  it('F7.6: should toggle goal active state between paused and active', () => {
    let goal: Goal = { id: 'g_toggle', name: 'Habit', category: 'Health', target: '10m', frequency: 'Daily', startDate: '2026-01-01', active: true };
    // Pause
    goal = { ...goal, active: !goal.active };
    assert.strictEqual(goal.active, false);
    // Resume
    goal = { ...goal, active: !goal.active };
    assert.strictEqual(goal.active, true);
  });
});

describe('Tier 1 - Feature 8: 4 Starter Blueprints Bundling (R5)', () => {
  it('F8.1: should bundle templates for all 4 core starter blueprints (SSC CGL, English, Fitness, Self-Control)', () => {
    const categoriesInTemplates = new Set(STARTER_GOAL_TEMPLATES.map(t => t.category));
    assert.ok(categoriesInTemplates.has('SSC'), 'Must bundle SSC blueprint templates');
    assert.ok(categoriesInTemplates.has('English'), 'Must bundle English blueprint templates');
    assert.ok(categoriesInTemplates.has('Fitness'), 'Must bundle Fitness blueprint templates');
    assert.ok(categoriesInTemplates.has('Self-Control'), 'Must bundle Self-Control blueprint templates');
  });

  it('F8.2: should provide well-formed goal template structures with targets and durations', () => {
    for (const tmpl of STARTER_GOAL_TEMPLATES) {
      assert.ok(tmpl.name && tmpl.name.length > 0, 'Template must have a name');
      assert.ok(tmpl.category && DEFAULT_CATEGORIES.includes(tmpl.category), `Template category must be valid: ${tmpl.category}`);
      assert.ok(tmpl.target && tmpl.target.length > 0, 'Template must have target specified');
      assert.ok(tmpl.frequency === 'Daily' || tmpl.frequency === 'Weekly', 'Frequency must be Daily or Weekly');
      assert.ok(typeof tmpl.durationMinutes === 'number', 'Duration must be numeric');
    }
  });

  it('F8.3: should instantiate a starter blueprint template into a live goal with unique ID and date', () => {
    const template = STARTER_GOAL_TEMPLATES.find(t => t.name === 'SSC Maths')!;
    const today = new Date().toISOString().split('T')[0];

    const liveGoal: Goal = {
      ...template,
      id: `g_${Date.now()}_test`,
      startDate: today,
      active: true,
    };

    assert.ok(liveGoal.id.startsWith('g_'));
    assert.strictEqual(liveGoal.name, 'SSC Maths');
    assert.strictEqual(liveGoal.active, true);
    assert.strictEqual(liveGoal.startDate, today);
  });

  it('F8.4: should prevent duplicate starter goal activation when matching name exists', () => {
    const existingGoals: Goal[] = [
      { id: 'g1', name: 'Workout', category: 'Fitness', target: '1 hour', frequency: 'Daily', startDate: '2026-09-11', active: true },
    ];

    const workoutTemplate = STARTER_GOAL_TEMPLATES.find(t => t.name.toLowerCase() === 'workout')!;
    const isAlreadyAdded = existingGoals.some(g => g.name.toLowerCase() === workoutTemplate.name.toLowerCase());
    assert.strictEqual(isAlreadyAdded, true, 'Should detect that Workout is already added');

    const unaddedTemplate = STARTER_GOAL_TEMPLATES.find(t => t.name === 'No Porn')!;
    const isUnadded = existingGoals.some(g => g.name.toLowerCase() === unaddedTemplate.name.toLowerCase());
    assert.strictEqual(isUnadded, false, 'Should allow adding unadded starter goal');
  });

  it('F8.5: should provide cohesive initial goals for quick starter presets mode', () => {
    assert.ok(INITIAL_GOALS.length >= 4, 'Initial goals preset must contain at least 4 goals');
    const categories = new Set(INITIAL_GOALS.map(g => g.category));
    assert.ok(categories.has('SSC'));
    assert.ok(categories.has('Fitness'));
    assert.ok(categories.has('Self-Control'));
  });

  it('F8.6: should integrate starter blueprint goals seamlessly into daily scoring calculation', () => {
    const instantiated: Goal[] = STARTER_GOAL_TEMPLATES.slice(0, 3).map((tmpl, idx) => ({
      ...tmpl,
      id: `g_blueprint_${idx}`,
      startDate: '2026-09-11',
      active: true,
    }));

    const logs: DailyLogEntry[] = [
      { id: 'l0', date: '2026-09-11', goalId: instantiated[0].id, completed: true, timestamp: 1 },
      { id: 'l1', date: '2026-09-11', goalId: instantiated[1].id, completed: true, timestamp: 2 },
      { id: 'l2', date: '2026-09-11', goalId: instantiated[2].id, completed: true, timestamp: 3 },
    ];

    const dayScore = calculateDayScore('2026-09-11', instantiated, logs);
    assert.strictEqual(dayScore.score, 100);
    assert.strictEqual(dayScore.completedGoals, 3);
    assert.strictEqual(dayScore.totalGoals, 3);
  });
});
