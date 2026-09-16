import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  hashStringToNotificationId,
  isGoalScheduledForDate,
  buildRollingNotificationSchedule,
  toLocalDateString,
  NOTIFICATION_CHANNEL_ID,
  MORNING_DAWN_QUOTES,
  MIDDAY_AUDIT_QUOTES,
  EVENING_DEFENSE_QUOTES,
  formatGoalsSummary,
} from '../../src/services/notifications';
import { Goal, AppSettings } from '../../src/types';
import { INITIAL_SETTINGS } from '../../src/data/starterData';

const PROJECT_ROOT = process.cwd();

describe('Tier 1 - Feature 16: Local Notification System — Offline, Device-Native (Section 16)', () => {
  it('F16.1: should verify @capacitor/local-notifications dependency in package.json', () => {
    const pkgPath = path.join(PROJECT_ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    assert.ok(
      pkg.dependencies['@capacitor/local-notifications'],
      '@capacitor/local-notifications must be present in dependencies'
    );
  });

  it('F16.2: should generate deterministic positive 32-bit integer IDs from string keys', () => {
    const id1 = hashStringToNotificationId('goal_g1_2026-09-12');
    const id2 = hashStringToNotificationId('goal_g1_2026-09-12');
    const id3 = hashStringToNotificationId('evening_log_2026-09-12');

    assert.strictEqual(id1, id2, 'Identical string keys must produce identical notification IDs');
    assert.notStrictEqual(id1, id3, 'Different string keys should produce different notification IDs');
    assert.ok(Number.isInteger(id1) && id1 > 0 && id1 <= 2000000000, 'Notification ID must be a positive 32-bit integer');
  });

  it('F16.3: should correctly evaluate goal scheduling based on frequency and date bounds', () => {
    // 2026-09-12 is Saturday (day 6), 2026-09-13 is Sunday (day 0), 2026-09-14 is Monday (day 1)
    const sat = new Date('2026-09-12T10:00:00Z');
    const sun = new Date('2026-09-13T10:00:00Z');
    const mon = new Date('2026-09-14T10:00:00Z');

    const dailyGoal: Goal = {
      id: 'g_daily',
      name: 'Daily Goal',
      category: 'SSC',
      target: '1h',
      frequency: 'Daily',
      active: true,
      startDate: '2026-09-01',
    };

    const monFriGoal: Goal = {
      id: 'g_monfri',
      name: 'Mon-Fri Goal',
      category: 'English',
      target: '30m',
      frequency: 'Mon-Fri',
      active: true,
      startDate: '2026-09-01',
    };

    const weekendGoal: Goal = {
      id: 'g_weekend',
      name: 'Weekend Goal',
      category: 'Fitness',
      target: 'Run',
      frequency: 'Weekends',
      active: true,
      startDate: '2026-09-01',
    };

    const customGoal: Goal = {
      id: 'g_custom',
      name: 'Custom Tue/Thu Goal',
      category: 'DeepWork',
      target: '2h',
      frequency: 'Custom',
      customDays: [2, 4], // Tuesday, Thursday
      active: true,
      startDate: '2026-09-01',
    };

    const pausedGoal: Goal = {
      ...dailyGoal,
      id: 'g_paused',
      active: false,
    };

    const archivedGoal: Goal = {
      ...dailyGoal,
      id: 'g_archived',
      archived: true,
    };

    assert.strictEqual(isGoalScheduledForDate(dailyGoal, mon), true);
    assert.strictEqual(isGoalScheduledForDate(dailyGoal, sat), true);

    assert.strictEqual(isGoalScheduledForDate(monFriGoal, mon), true);
    assert.strictEqual(isGoalScheduledForDate(monFriGoal, sat), false);

    assert.strictEqual(isGoalScheduledForDate(weekendGoal, sat), true);
    assert.strictEqual(isGoalScheduledForDate(weekendGoal, sun), true);
    assert.strictEqual(isGoalScheduledForDate(weekendGoal, mon), false);

    assert.strictEqual(isGoalScheduledForDate(customGoal, mon), false);
    assert.strictEqual(isGoalScheduledForDate(pausedGoal, mon), false);
    assert.strictEqual(isGoalScheduledForDate(archivedGoal, mon), false);
  });

  it('F16.4: should build a 7-day rolling schedule with goal, evening log, and weekly review notifications', () => {
    const fixedNow = new Date('2026-09-12T08:00:00'); // Saturday 8:00 AM
    const testGoals: Goal[] = [
      {
        id: 'g_cgl',
        name: 'Quant Practice',
        category: 'SSC',
        target: '50 Qs',
        frequency: 'Daily',
        reminderTime: '09:00',
        active: true,
        startDate: '2026-09-01',
      },
      {
        id: 'g_paused',
        name: 'Paused Goal',
        category: 'SSC',
        target: 'None',
        frequency: 'Daily',
        reminderTime: '10:00',
        active: false,
        startDate: '2026-09-01',
      },
    ];

    const settings: AppSettings = {
      ...INITIAL_SETTINGS,
      eveningReminderEnabled: true,
      eveningReminderTime: '22:00',
      weeklyNudgeEnabled: true,
      weeklyNudgeDay: 0, // Sunday
      weeklyNudgeTime: '20:00',
    };

    const schedule = buildRollingNotificationSchedule(testGoals, settings, fixedNow, 7);

    assert.ok(schedule.length > 0, 'Schedule must contain scheduled items');
    assert.ok(schedule.length <= 64, 'Schedule must stay comfortably within iOS 64-notification limit');

    // Check channel ID on all items
    schedule.forEach((n) => {
      assert.strictEqual(n.channelId, NOTIFICATION_CHANNEL_ID);
      assert.ok(n.schedule?.allowWhileIdle, 'Notification must allowWhileIdle for exact alarm execution');
    });

    // Verify presence of goal reminders
    const goalReminders = schedule.filter((n) => n.extra?.type === 'goal');
    assert.strictEqual(goalReminders.length, 7, '7 days of daily active goal reminders should be scheduled');
    assert.strictEqual(goalReminders[0].title, 'Quant Practice');
    assert.strictEqual(goalReminders[0].body, '50 Qs');

    // Verify evening check-in reminders
    const eveningReminders = schedule.filter((n) => n.extra?.type === 'evening_logging');
    assert.strictEqual(eveningReminders.length, 7, '7 days of evening check-ins should be scheduled');
    assert.ok(
      eveningReminders[0].body.includes('Time to log today'),
      'Evening reminder must use non-shaming neutral copy'
    );

    // Verify weekly review nudge
    const weeklyNudges = schedule.filter((n) => n.extra?.type === 'weekly_nudge');
    assert.strictEqual(weeklyNudges.length, 1, 'Exactly one Sunday weekly review nudge in the 7-day window');
    assert.strictEqual(weeklyNudges[0].title, 'Weekly Review');
  });

  it('F16.5: should respect disabled settings for evening and weekly notifications', () => {
    const fixedNow = new Date('2026-09-12T08:00:00');
    const testGoals: Goal[] = [
      {
        id: 'g_1',
        name: 'Morning Routine',
        category: 'SSC',
        target: 'Wake up',
        frequency: 'Daily',
        reminderTime: '08:30',
        active: true,
        startDate: '2026-09-01',
      },
    ];

    const disabledSettings: AppSettings = {
      ...INITIAL_SETTINGS,
      dailyCheckpointsEnabled: false,
      eveningReminderEnabled: false,
      weeklyNudgeEnabled: false,
    };

    const schedule = buildRollingNotificationSchedule(testGoals, disabledSettings, fixedNow, 7);
    const eveningReminders = schedule.filter((n) => n.extra?.type === 'evening_logging');
    const weeklyNudges = schedule.filter((n) => n.extra?.type === 'weekly_nudge');

    assert.strictEqual(eveningReminders.length, 0, 'No evening reminders when disabled');
    assert.strictEqual(weeklyNudges.length, 0, 'No weekly nudges when disabled');
    assert.strictEqual(schedule.length, 7, 'Only active goal reminders should be present');
  });

  it('F16.6: should verify SettingsView has controls for local notifications', () => {
    const settingsPath = path.join(PROJECT_ROOT, 'src/components/SettingsView.tsx');
    const content = fs.readFileSync(settingsPath, 'utf-8');

    assert.ok(content.includes('Offline Local Notifications'), 'SettingsView must have Notifications section');
    assert.ok(content.includes('dailyCheckpointsEnabled'), 'SettingsView must bind dailyCheckpointsEnabled');
    assert.ok(content.includes('morningBriefingTime'), 'SettingsView must bind morningBriefingTime');
    assert.ok(content.includes('middayAuditTime'), 'SettingsView must bind middayAuditTime');
    assert.ok(content.includes('eveningDefenseTime'), 'SettingsView must bind eveningDefenseTime');
    assert.ok(content.includes('eveningReminderEnabled'), 'SettingsView must bind eveningReminderEnabled');
    assert.ok(content.includes('eveningReminderTime'), 'SettingsView must bind eveningReminderTime');
    assert.ok(content.includes('weeklyNudgeEnabled'), 'SettingsView must bind weeklyNudgeEnabled');
    assert.ok(content.includes('weeklyNudgeTime'), 'SettingsView must bind weeklyNudgeTime');
  });

  it('F16.7: should return empty schedule when master notificationsEnabled is false (RB-16)', () => {
    const fixedNow = new Date('2026-09-12T08:00:00');
    const testGoals: Goal[] = [
      {
        id: 'g_1',
        name: 'Morning Routine',
        category: 'General',
        target: '1 hr',
        frequency: 'Daily',
        reminderTime: '09:00',
        active: true,
        startDate: '2026-09-01',
      },
    ];

    const masterDisabledSettings: AppSettings = {
      ...INITIAL_SETTINGS,
      notificationsEnabled: false,
    };

    const schedule = buildRollingNotificationSchedule(testGoals, masterDisabledSettings, fixedNow, 7);
    assert.strictEqual(schedule.length, 0, 'Master switch disabled must return 0 scheduled notifications');
  });

  it('F16.8: should produce different notification ID when goal reminder time changes (RB-17 diff-sync)', () => {
    const fixedNow = new Date('2026-09-12T08:00:00');
    const goalA: Goal = {
      id: 'g_target',
      name: 'Focus Session',
      category: 'General',
      target: '2 hr',
      frequency: 'Daily',
      reminderTime: '10:00',
      active: true,
      startDate: '2026-09-01',
    };
    const goalB: Goal = {
      ...goalA,
      reminderTime: '11:00',
    };

    const testSettings: AppSettings = {
      ...INITIAL_SETTINGS,
      dailyCheckpointsEnabled: false,
      eveningReminderEnabled: false,
      weeklyNudgeEnabled: false,
    };

    const scheduleA = buildRollingNotificationSchedule([goalA], testSettings, fixedNow, 1);
    const scheduleB = buildRollingNotificationSchedule([goalB], testSettings, fixedNow, 1);

    assert.strictEqual(scheduleA.length, 1);
    assert.strictEqual(scheduleB.length, 1);
    assert.notStrictEqual(
      scheduleA[0].id,
      scheduleB[0].id,
      'Editing reminder time must produce distinct notification ID so diff-sync cancels old and adds new'
    );
  });

  it('F16.9: should evaluate early morning reminders on correct local calendar day without UTC skew', () => {
    // Test a 5:00 AM early morning goal (which in UTC+05:30 would be previous day in UTC)
    const goal: Goal = {
      id: 'g_morning',
      name: 'Early Morning Study',
      category: 'SSC',
      target: '2h',
      frequency: 'Daily',
      reminderTime: '05:00',
      active: true,
      startDate: '2026-09-13',
    };

    const fixedNow = new Date('2026-09-12T20:00:00'); // 8:00 PM evening before
    const testSettings: AppSettings = {
      ...INITIAL_SETTINGS,
      dailyCheckpointsEnabled: false,
      eveningReminderEnabled: false,
      weeklyNudgeEnabled: false,
    };

    const schedule = buildRollingNotificationSchedule([goal], testSettings, fixedNow, 2);
    assert.strictEqual(schedule.length, 1, 'Should schedule tomorrow 5:00 AM');
    assert.strictEqual(
      schedule[0].extra?.date,
      '2026-09-13',
      'Notification date payload must match local calendar day (2026-09-13)'
    );

    // Verify toLocalDateString format consistency
    const morningDate = new Date('2026-09-13T05:00:00');
    assert.strictEqual(toLocalDateString(morningDate), '2026-09-13');
  });

  it('F16.10: should schedule 3 daily checkpoints with goals-first layout, 7-day quote rotation, zero emojis, and high importance channel', () => {
    // 2026-09-12 is Saturday (day 6), 2026-09-13 is Sunday (day 0)
    const fixedNow = new Date('2026-09-12T03:00:00'); // 3:00 AM Saturday
    const testGoals: Goal[] = [
      {
        id: 'g_maths',
        name: 'SSC Maths',
        category: 'SSC',
        target: '2h',
        frequency: 'Daily',
        active: true,
        startDate: '2026-09-01',
      },
      {
        id: 'g_english',
        name: 'English Comprehension',
        category: 'English',
        target: '1h',
        frequency: 'Daily',
        active: true,
        startDate: '2026-09-01',
      },
      {
        id: 'g_gym',
        name: 'Workout',
        category: 'Fitness',
        target: '1h',
        frequency: 'Daily',
        active: true,
        startDate: '2026-09-01',
      },
    ];

    const settings: AppSettings = {
      ...INITIAL_SETTINGS,
      dailyCheckpointsEnabled: true,
      morningBriefingTime: '04:00',
      middayAuditTime: '12:00',
      eveningDefenseTime: '20:00',
      eveningReminderEnabled: false,
      weeklyNudgeEnabled: false,
    };

    const schedule = buildRollingNotificationSchedule(testGoals, settings, fixedNow, 7);
    const checkpoints = schedule.filter((n) =>
      ['dawn_briefing', 'midday_audit', 'evening_defense'].includes(n.extra?.type)
    );

    // 7 days * 3 checkpoints = 21 checkpoint notifications
    assert.strictEqual(checkpoints.length, 21, 'Must schedule exactly 21 checkpoints over 7 days');

    // Goals summary verification
    const summary = formatGoalsSummary(testGoals);
    assert.strictEqual(summary, 'SSC Maths, English Comprehension, Workout');

    // Emoji regex to strictly verify zero emojis or pictographs
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;

    checkpoints.forEach((cp) => {
      // Must put active targets in title
      assert.ok(
        cp.title.endsWith(': SSC Maths, English Comprehension, Workout'),
        `Title must put active targets in title: ${cp.title}`
      );

      // Must be assigned to high importance channel for sound and alert
      assert.strictEqual(cp.channelId, NOTIFICATION_CHANNEL_ID);
      assert.ok(cp.schedule?.allowWhileIdle, 'Must allow exact background alarm while idle');

      // Strictly zero emojis in title or body
      assert.ok(!emojiRegex.test(cp.title), `Title must contain zero emojis: ${cp.title}`);
      assert.ok(!emojiRegex.test(cp.body), `Body must contain zero emojis: ${cp.body}`);

      // Body must state neuroscience principle
      assert.ok(cp.body.startsWith('Neuroscience:'), `Body must state neuroscience principle: ${cp.body}`);
    });

    // Verify 7-day unique quote rotation for each checkpoint type
    const dawnBriefings = checkpoints.filter((cp) => cp.extra?.type === 'dawn_briefing');
    assert.strictEqual(dawnBriefings.length, 7);
    const distinctDawnQuotes = new Set(dawnBriefings.map((cp) => cp.body));
    assert.strictEqual(distinctDawnQuotes.size, 7, 'All 7 days must have distinct dawn quotes');

    const middayAudits = checkpoints.filter((cp) => cp.extra?.type === 'midday_audit');
    assert.strictEqual(middayAudits.length, 7);
    const distinctMiddayQuotes = new Set(middayAudits.map((cp) => cp.body));
    assert.strictEqual(distinctMiddayQuotes.size, 7, 'All 7 days must have distinct midday quotes');

    const eveningDefenses = checkpoints.filter((cp) => cp.extra?.type === 'evening_defense');
    assert.strictEqual(eveningDefenses.length, 7);
    const distinctEveningQuotes = new Set(eveningDefenses.map((cp) => cp.body));
    assert.strictEqual(distinctEveningQuotes.size, 7, 'All 7 days must have distinct evening quotes');
  });
});
