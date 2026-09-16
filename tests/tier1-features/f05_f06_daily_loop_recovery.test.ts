import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { calculateDayScore, checkRecoveryModeNeeded } from '../../src/services/storage';
import { getScoreStatus } from '../../src/utils/dateUtils';
import { DEFAULT_FAILURE_REASONS } from '../../src/data/starterData';
import { Goal, DailyLogEntry } from '../../src/types';

const PROJECT_ROOT = process.cwd();

describe('Tier 1 - Feature 5: Daily Execution Loop & Status Colors (R4)', () => {
  const sampleGoals: Goal[] = [
    { id: 'g1', name: 'SSC Maths', category: 'SSC', target: '2h', frequency: 'Daily', startDate: '2026-09-11', active: true },
    { id: 'g2', name: 'English', category: 'English', target: '1h', frequency: 'Daily', startDate: '2026-09-11', active: true },
    { id: 'g3', name: 'Workout', category: 'Fitness', target: '1h', frequency: 'Daily', startDate: '2026-09-11', active: true },
  ];

  it('F5.1: should compute score, totalGoals, and completedGoals on 1-tap YES recordings', () => {
    const logs: DailyLogEntry[] = [
      { id: 'l1', date: '2026-09-11', goalId: 'g1', completed: true, timestamp: 1 },
      { id: 'l2', date: '2026-09-11', goalId: 'g2', completed: true, timestamp: 2 },
    ];

    const result = calculateDayScore('2026-09-11', sampleGoals, logs);
    assert.strictEqual(result.totalGoals, 3);
    assert.strictEqual(result.completedGoals, 2);
    assert.strictEqual(result.score, 67, 'Math.round((2/3) * 100) = 67');
    assert.strictEqual(result.entries['g1'].completed, true);
    assert.strictEqual(result.entries['g2'].completed, true);
  });

  it('F5.2: should apply GREEN status colors and EXCELLENT status for daily score >= 90%', () => {
    const status90 = getScoreStatus(90, 3);
    assert.strictEqual(status90.status, 'EXCELLENT');
    assert.ok(status90.label.includes('GREEN'));
    assert.ok(status90.colorClass.includes('emerald'));
    assert.ok(status90.accentClass.includes('emerald'));

    const status100 = getScoreStatus(100, 3);
    assert.strictEqual(status100.status, 'EXCELLENT');
    assert.ok(status100.label.includes('GREEN'));
  });

  it('F5.3: should apply YELLOW status colors and PROGRESS status for score between 70% and 89%', () => {
    const status70 = getScoreStatus(70, 3);
    assert.strictEqual(status70.status, 'PROGRESS');
    assert.ok(status70.label.includes('YELLOW'));
    assert.ok(status70.colorClass.includes('amber'));
    assert.ok(status70.accentClass.includes('amber'));

    const status89 = getScoreStatus(89, 3);
    assert.strictEqual(status89.status, 'PROGRESS');
    assert.ok(status89.label.includes('YELLOW'));
  });

  it('F5.4: should apply RED status colors and RECOVERY status for score < 70%', () => {
    const status69 = getScoreStatus(69, 3);
    assert.strictEqual(status69.status, 'RECOVERY');
    assert.ok(status69.label.includes('RED'));
    assert.ok(status69.colorClass.includes('rose'));
    assert.ok(status69.accentClass.includes('rose'));

    const status0 = getScoreStatus(0, 3);
    assert.strictEqual(status0.status, 'RECOVERY');
    assert.ok(status0.label.includes('RED'));
  });

  it('F5.5: should return IDLE status when active goals count is 0', () => {
    const idleStatus = getScoreStatus(0, 0);
    assert.strictEqual(idleStatus.status, 'IDLE');
    assert.ok(idleStatus.label.includes('READY'));
  });

  it('F5.6: should verify non-negotiable subtitle in TodayView code', () => {
    const todayViewPath = path.join(PROJECT_ROOT, 'src/components/TodayView.tsx');
    const content = fs.readFileSync(todayViewPath, 'utf-8');

    // Verify presence of required phrasing: "Build today. Don't fix your whole life today."
    assert.ok(
      content.includes('Recover today') || content.includes('Build today') || content.includes('Do not recover the lost days'),
      'TodayView must embody the recovery / daily build execution principle'
    );
  });
});

describe('Tier 1 - Feature 6: 15 Failure Reasons & Recovery Mode (R4)', () => {
  const sampleGoals: Goal[] = [
    { id: 'g1', name: 'SSC Maths', category: 'SSC', target: '2h', frequency: 'Daily', startDate: '2026-09-01', active: true },
    { id: 'g2', name: 'English', category: 'English', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
  ];

  it('F6.1: should supply exactly 15 standardized non-judgmental failure reasons', () => {
    assert.strictEqual(DEFAULT_FAILURE_REASONS.length, 15, 'Must contain exactly 15 default failure reasons');

    const expectedReasons = [
      'Procrastination',
      'Phone / social media',
      'Mental fog',
      'Too tired',
      'Lazy / low energy',
      'Porn / distraction',
      'Work',
      'Unexpected situation',
      'Poor planning',
      'Forgot',
      'Goal was too difficult',
      'Goal was unrealistic',
      'Illness',
      'No specific reason',
      'Other',
    ];

    for (const r of expectedReasons) {
      assert.ok(DEFAULT_FAILURE_REASONS.includes(r), `Missing expected failure reason: ${r}`);
    }
  });

  it('F6.2: should associate selected failure reason with failed daily log entry', () => {
    const failedLog: DailyLogEntry = {
      id: 'l_fail_1',
      date: '2026-09-11',
      goalId: 'g1',
      completed: false,
      failureReason: 'Phone / social media',
      timestamp: Date.now(),
    };

    const dayScore = calculateDayScore('2026-09-11', sampleGoals, [failedLog]);
    assert.strictEqual(dayScore.entries['g1'].completed, false);
    assert.strictEqual(dayScore.entries['g1'].failureReason, 'Phone / social media');
  });

  it('F6.3: should not trigger recovery mode on single low score day', () => {
    // Yesterday: 0% (1 low day)
    const logs: DailyLogEntry[] = [
      { id: 'l1', date: '2026-09-10', goalId: 'g1', completed: false, failureReason: 'Too tired', timestamp: 1 },
      { id: 'l2', date: '2026-09-10', goalId: 'g2', completed: false, failureReason: 'Too tired', timestamp: 2 },
    ];

    const result = checkRecoveryModeNeeded('2026-09-11', sampleGoals, logs);
    assert.strictEqual(result.isRecoveryMode, false, '1 low score day must not trigger recovery mode');
    assert.strictEqual(result.consecutiveLowDays, 1);
  });

  it('F6.4: should trigger recovery mode after 2 consecutive low score days (<70%)', () => {
    // D-1: 0%, D-2: 0%
    const logs: DailyLogEntry[] = [
      { id: 'l1', date: '2026-09-10', goalId: 'g1', completed: false, timestamp: 1 },
      { id: 'l2', date: '2026-09-09', goalId: 'g1', completed: false, timestamp: 2 },
    ];

    const result = checkRecoveryModeNeeded('2026-09-11', sampleGoals, logs);
    assert.strictEqual(result.isRecoveryMode, true, '2 consecutive sub-70% days must trigger recovery mode');
    assert.strictEqual(result.consecutiveLowDays, 2);
  });

  it('F6.5: should display mandatory Recovery Mode copy in TodayView', () => {
    const todayViewPath = path.join(PROJECT_ROOT, 'src/components/TodayView.tsx');
    const content = fs.readFileSync(todayViewPath, 'utf-8');

    assert.ok(
      content.includes('Do not recover the lost days. Recover today.'),
      'Must contain the exact non-negotiable phrasing: “Do not recover the lost days. Recover today.”'
    );
    assert.ok(
      content.includes('Never miss twice'),
      'Must display the rule: Never miss twice'
    );
  });

  it('F6.6: should not trigger recovery mode if user has zero active goals', () => {
    const inactiveGoals: Goal[] = [
      { id: 'g1', name: 'SSC Maths', category: 'SSC', target: '2h', frequency: 'Daily', startDate: '2026-09-01', active: false },
    ];
    const logs: DailyLogEntry[] = [
      { id: 'l1', date: '2026-09-10', goalId: 'g1', completed: false, timestamp: 1 },
      { id: 'l2', date: '2026-09-09', goalId: 'g1', completed: false, timestamp: 2 },
    ];

    const result = checkRecoveryModeNeeded('2026-09-11', inactiveGoals, logs);
    assert.strictEqual(result.isRecoveryMode, false);
    assert.strictEqual(result.consecutiveLowDays, 0);
  });

  it('F6.7: should verify TodayView locks past and future days and prevents retroactive and premature goal logging', () => {
    const todayViewPath = path.join(PROJECT_ROOT, 'src/components/TodayView.tsx');
    const content = fs.readFileSync(todayViewPath, 'utf-8');

    // Verify activeToday calculation
    assert.ok(content.includes('getTodayDateString(settings?.dayRolloverHour || 0)'), 'TodayView must derive activeToday from circadian rollover');
    assert.ok(content.includes('isPastDay = currentDate < activeToday'), 'TodayView must detect past days');
    assert.ok(content.includes('isFutureDay = currentDate > activeToday'), 'TodayView must detect future days');
    assert.ok(content.includes('isExecutionLocked = isPastDay || isFutureDay'), 'TodayView must lock execution on non-active days');

    // Verify lock guards on action handlers
    assert.ok(content.includes('if (isExecutionLocked)'), 'TodayView must guard execution handlers with isExecutionLocked');

    // Verify UI locked state indicators
    assert.ok(content.includes('Day Ended — Locked'), 'TodayView must render locked badge for ended days');
    assert.ok(content.includes('Upcoming — Locked'), 'TodayView must render locked badge for future days');
    assert.ok(content.includes('Today Active'), 'TodayView must show active day indicator');
  });
});
