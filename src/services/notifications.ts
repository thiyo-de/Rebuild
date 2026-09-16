import { Capacitor } from '@capacitor/core';
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { Goal, AppSettings } from '../types';

export const NOTIFICATION_CHANNEL_ID = 'rebuild-reminders';

/**
 * 7-Day Neuroscience & Discipline Quotes for Daily Checkpoints.
 * Day index maps to JavaScript Date.getDay(): 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat.
 * Every day has a unique quote sharing the same underlying scientific principle.
 * Strict constraint: 100% clean text — zero emojis, zero vector symbols.
 */
export const MORNING_DAWN_QUOTES: readonly string[] = [
  // 0: Sunday
  'Neuroscience: Prefrontal willpower peaks early. Win the first 90 minutes to secure the entire day.',
  // 1: Monday
  'Neuroscience: Cortisol awakening response is highest now. Direct this biological focus into your hardest target.',
  // 2: Tuesday
  'Neuroscience: Decision fatigue starts at zero today. Eliminate hesitation before cognitive friction accumulates.',
  // 3: Wednesday
  'Neuroscience: Action precedes dopamine synthesis. Do not wait for motivation; begin the mechanical motion.',
  // 4: Thursday
  'Neuroscience: Neural pathways reinforce through friction. The resistance you feel is literal brain adaptation.',
  // 5: Friday
  'Neuroscience: Dopamine baseline remains steady when effort is valued over outcome. Attack your morning protocol.',
  // 6: Saturday
  'Neuroscience: Habit consolidation requires unbroken morning rhythm regardless of the weekend calendar.',
];

export const MIDDAY_AUDIT_QUOTES: readonly string[] = [
  // 0: Sunday
  'Neuroscience: Midday cognitive dip is biological, not character failure. Stand up, hydrate, and reset focus.',
  // 1: Monday
  'Neuroscience: Algorithmic scrolling spikes cheap dopamine and depletes prefrontal stamina. Guard your attention.',
  // 2: Tuesday
  'Neuroscience: 10 minutes of active execution triggers task momentum through striatal dopamine release.',
  // 3: Wednesday
  'Neuroscience: Friction decreases exponentially once the behavior commences. Break the inertia now.',
  // 4: Thursday
  'Neuroscience: Working memory degrades under context-switching. Protect your single active target.',
  // 5: Friday
  'Neuroscience: Low mental energy is solved by lower friction, not distraction. Execute the next step.',
  // 6: Saturday
  'Neuroscience: Passive consumption steals cognitive bandwidth needed for consolidation. Re-center your vector.',
];

export const EVENING_DEFENSE_QUOTES: readonly string[] = [
  // 0: Sunday
  'Neuroscience: Identity reinforces through consistency. Never miss twice and lock in your weekly baseline.',
  // 1: Monday
  'Neuroscience: Neuroplasticity consolidates during deep sleep. Verify your completed targets before shutting down.',
  // 2: Tuesday
  'Neuroscience: Loss aversion is real. One missed day weakens the synaptic trace; one logged day strengthens it.',
  // 3: Wednesday
  'Neuroscience: Even a 5-minute minimum execution preserves the automaticity loop in your basal ganglia.',
  // 4: Thursday
  'Neuroscience: Evening reflection calibrates executive function and lowers tomorrow morning friction.',
  // 5: Friday
  'Neuroscience: Weekend lapses reset neural gains. Defend your streak tonight with uncompromising discipline.',
  // 6: Saturday
  'Neuroscience: Habit strength is determined by resistance overcome. Finish your day with zero excuses.',
];

/**
 * Format active goals for notification headers.
 * Presents active goals first, clean and concise, with zero emojis.
 */
export function formatGoalsSummary(scheduledGoals: Goal[]): string {
  if (!scheduledGoals || scheduledGoals.length === 0) {
    return 'Daily Protocol';
  }
  const names = scheduledGoals.map((g) => g.name.trim()).filter(Boolean);
  if (names.length === 0) {
    return 'Daily Protocol';
  }
  if (names.length <= 3) {
    return names.join(', ');
  }
  return `${names.slice(0, 3).join(', ')} +${names.length - 3} more`;
}

/**
 * Generate a stable, deterministic positive 32-bit integer ID from a string key.
 * Required because Capacitor LocalNotifications requires integer IDs.
 */
export function hashStringToNotificationId(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return (Math.abs(hash) % 2000000000) + 1;
}

/**
 * Format a Date object into a local 'YYYY-MM-DD' string based on the device's local calendar.
 * Prevents UTC timezone shifts that push early morning hours back into yesterday.
 */
export function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Determine if a goal is scheduled to execute on a specific date.
 */
export function isGoalScheduledForDate(goal: Goal, date: Date): boolean {
  if (!goal.active || goal.archived) return false;

  const dateStr = toLocalDateString(date);
  if (goal.startDate && dateStr < goal.startDate) return false;
  if (goal.endDate && dateStr > goal.endDate) return false;

  const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat

  switch (goal.frequency) {
    case 'Daily':
      return true;
    case 'Mon-Fri':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'Weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'Weekly': {
      if (goal.startDate) {
        const startDay = new Date(goal.startDate + 'T00:00:00').getDay();
        return dayOfWeek === startDay;
      }
      return dayOfWeek === 0; // default Sunday
    }
    case 'Custom':
      return Array.isArray(goal.customDays) && goal.customDays.includes(dayOfWeek);
    default:
      return true;
  }
}

/**
 * Initialize Android high-importance notification channel.
 */
export async function initNotificationChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.createChannel({
      id: NOTIFICATION_CHANNEL_ID,
      name: 'REBUILD Reminders',
      description: 'Daily checkpoints, habit execution, evening logging, and weekly reviews',
      importance: 5, // High priority (audible chime + heads-up banner)
      visibility: 1, // Public on lockscreen
      vibration: true,
      lights: true,
      lightColor: '#6366F1',
    });
  } catch (err) {
    console.warn('Local notification channel setup skipped/failed:', err);
  }
}

/**
 * Check current notification permission status.
 */
export async function checkNotificationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!Capacitor.isNativePlatform()) {
    return 'granted'; // Mock granted in browser preview
  }
  try {
    const status = await LocalNotifications.checkPermissions();
    return status.display as 'granted' | 'denied' | 'prompt';
  } catch {
    return 'prompt';
  }
}

/**
 * Request notification permission from user.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch (err) {
    console.warn('Request notification permission failed:', err);
    return false;
  }
}

/**
 * Compute the 7-day rolling window of local notification payloads.
 * Pure function to enable deterministic unit and integration testing.
 */
export function buildRollingNotificationSchedule(
  goals: Goal[],
  settings: AppSettings,
  now: Date = new Date(),
  rollingDaysCount: number = 7
): LocalNotificationSchema[] {
  // If master notifications switch is disabled, return an empty schedule (RB-16)
  if (settings.notificationsEnabled === false) {
    return [];
  }

  const notifications: LocalNotificationSchema[] = [];
  const activeGoals = goals.filter((g) => g.active && !g.archived);

  // 1. Per-Goal Execution Reminders
  for (const goal of activeGoals) {
    if (!goal.reminderTime) continue;
    const [hours, minutes] = goal.reminderTime.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) continue;

    for (let i = 0; i < rollingDaysCount; i++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + i);

      if (!isGoalScheduledForDate(goal, targetDate)) continue;

      const scheduleTime = new Date(targetDate);
      scheduleTime.setHours(hours, minutes, 0, 0);

      // Only schedule future timestamps
      if (scheduleTime.getTime() <= now.getTime()) continue;

      const dateStr = toLocalDateString(scheduleTime);
      // Include time, name, and target in fingerprint so edits trigger cancel/reschedule (RB-17)
      const notifId = hashStringToNotificationId(
        `goal_${goal.id}_${dateStr}_${goal.reminderTime || ''}_${goal.name}_${goal.target || ''}`
      );

      notifications.push({
        id: notifId,
        title: goal.name,
        body: goal.target ? `${goal.target}` : 'Time to execute your target.',
        schedule: { at: scheduleTime, allowWhileIdle: true },
        channelId: NOTIFICATION_CHANNEL_ID,
        smallIcon: 'ic_notification',
        iconColor: '#6366F1',
        extra: {
          type: 'goal',
          goalId: goal.id,
          date: dateStr,
        },
      });
    }
  }

  // 2. Daily Evening Logging Reminder
  if (settings.eveningReminderEnabled !== false && activeGoals.length > 0) {
    const eveningTime = settings.eveningReminderTime || '22:00';
    const [evHours, evMins] = eveningTime.split(':').map(Number);
    const validHours = isNaN(evHours) ? 22 : evHours;
    const validMins = isNaN(evMins) ? 0 : evMins;

    for (let i = 0; i < rollingDaysCount; i++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + i);

      const scheduleTime = new Date(targetDate);
      scheduleTime.setHours(validHours, validMins, 0, 0);

      if (scheduleTime.getTime() <= now.getTime()) continue;

      const dateStr = toLocalDateString(scheduleTime);
      const notifId = hashStringToNotificationId(`evening_log_${dateStr}_${validHours}:${validMins}`);

      notifications.push({
        id: notifId,
        title: 'Daily Check-in',
        body: 'Time to log today. Build today, become different tomorrow.',
        schedule: { at: scheduleTime, allowWhileIdle: true },
        channelId: NOTIFICATION_CHANNEL_ID,
        smallIcon: 'ic_notification',
        iconColor: '#6366F1',
        extra: {
          type: 'evening_logging',
          date: dateStr,
        },
      });
    }
  }

  // 3. Weekly Review Nudge
  if (settings.weeklyNudgeEnabled !== false) {
    const nudgeDay = settings.weeklyNudgeDay ?? 0; // Default Sunday
    const nudgeTime = settings.weeklyNudgeTime || '20:00';
    const [nuHours, nuMins] = nudgeTime.split(':').map(Number);
    const validHours = isNaN(nuHours) ? 20 : nuHours;
    const validMins = isNaN(nuMins) ? 0 : nuMins;

    for (let i = 0; i < rollingDaysCount; i++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + i);

      if (targetDate.getDay() !== nudgeDay) continue;

      const scheduleTime = new Date(targetDate);
      scheduleTime.setHours(validHours, validMins, 0, 0);

      if (scheduleTime.getTime() <= now.getTime()) continue;

      const dateStr = toLocalDateString(scheduleTime);
      const notifId = hashStringToNotificationId(`weekly_nudge_${dateStr}_${nudgeDay}_${validHours}:${validMins}`);

      notifications.push({
        id: notifId,
        title: 'Weekly Review',
        body: 'Check your weekly score and reward eligibility.',
        schedule: { at: scheduleTime, allowWhileIdle: true },
        channelId: NOTIFICATION_CHANNEL_ID,
        smallIcon: 'ic_notification',
        iconColor: '#6366F1',
        extra: {
          type: 'weekly_nudge',
          date: dateStr,
        },
      });
    }
  }

  // 4. Three-Checkpoint Daily System (04:00 AM Dawn Briefing, 12:00 PM Midday Audit, 20:00 Evening Defense)
  if (settings.dailyCheckpointsEnabled !== false && activeGoals.length > 0) {
    const morningTime = settings.morningBriefingTime || '04:00';
    const middayTime = settings.middayAuditTime || '12:00';
    const eveningDefenseTime = settings.eveningDefenseTime || '20:00';

    const checkpoints = [
      {
        type: 'dawn_briefing',
        time: morningTime,
        defaultHour: 4,
        defaultMin: 0,
        quotes: MORNING_DAWN_QUOTES,
        checkpointLabel: 'Dawn Briefing',
      },
      {
        type: 'midday_audit',
        time: middayTime,
        defaultHour: 12,
        defaultMin: 0,
        quotes: MIDDAY_AUDIT_QUOTES,
        checkpointLabel: 'Midday Vector Audit',
      },
      {
        type: 'evening_defense',
        time: eveningDefenseTime,
        defaultHour: 20,
        defaultMin: 0,
        quotes: EVENING_DEFENSE_QUOTES,
        checkpointLabel: 'Evening Streak Defense',
      },
    ];

    for (let i = 0; i < rollingDaysCount; i++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + i);
      const dayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon...
      const dateStr = toLocalDateString(targetDate);

      // Filter goals scheduled for this specific date
      const scheduledForDay = activeGoals.filter((g) => isGoalScheduledForDate(g, targetDate));
      const goalsSummary = formatGoalsSummary(scheduledForDay.length > 0 ? scheduledForDay : activeGoals);

      for (const cp of checkpoints) {
        const [cpHours, cpMins] = cp.time.split(':').map(Number);
        const validHours = isNaN(cpHours) ? cp.defaultHour : cpHours;
        const validMins = isNaN(cpMins) ? cp.defaultMin : cpMins;

        const scheduleTime = new Date(targetDate);
        scheduleTime.setHours(validHours, validMins, 0, 0);

        if (scheduleTime.getTime() <= now.getTime()) continue;

        const quote = cp.quotes[dayOfWeek] || cp.quotes[0];
        const notifId = hashStringToNotificationId(
          `${cp.type}_${dateStr}_${validHours}:${validMins}_${goalsSummary}`
        );

        notifications.push({
          id: notifId,
          title: `${cp.checkpointLabel}: ${goalsSummary}`,
          body: quote,
          schedule: { at: scheduleTime, allowWhileIdle: true },
          channelId: NOTIFICATION_CHANNEL_ID,
          smallIcon: 'ic_notification',
          iconColor: '#6366F1',
          extra: {
            type: cp.type,
            checkpoint: cp.checkpointLabel,
            date: dateStr,
            goals: goalsSummary,
          },
        });
      }
    }
  }

  return notifications;
}

let activeSyncPromise: Promise<number> | null = null;

/**
 * Synchronize the on-device local notification queue.
 * Performs a serialized diff-sync: cancels only stale notifications and schedules only new ones.
 */
export function syncNotificationSchedule(
  goals: Goal[],
  settings: AppSettings,
  now: Date = new Date()
): Promise<number> {
  const executeSync = async (): Promise<number> => {
    if (!Capacitor.isNativePlatform()) {
      const mockSchedule = buildRollingNotificationSchedule(goals, settings, now);
      return mockSchedule.length;
    }

    try {
      await initNotificationChannel();

      const newNotifications = buildRollingNotificationSchedule(goals, settings, now);
      const newIdSet = new Set(newNotifications.map((n) => n.id));

      // 1. Get currently pending notifications
      const pending = await LocalNotifications.getPending();
      const pendingIds = new Set((pending.notifications || []).map((n) => n.id));

      // 2. Cancel only notifications that are no longer in the new schedule
      const toCancel = (pending.notifications || []).filter((n) => !newIdSet.has(n.id));
      if (toCancel.length > 0) {
        await LocalNotifications.cancel({ notifications: toCancel.map((n) => ({ id: n.id })) });
      }

      // 3. Schedule only new notifications that aren't already pending
      const toAdd = newNotifications.filter((n) => !pendingIds.has(n.id));
      if (toAdd.length > 0) {
        await LocalNotifications.schedule({ notifications: toAdd });
      }

      return newNotifications.length;
    } catch (err) {
      console.warn('Syncing local notifications failed:', err);
      return 0;
    }
  };

  // Serialize successive sync requests so rapid goal/settings edits do not race
  activeSyncPromise = (activeSyncPromise || Promise.resolve()).then(executeSync, executeSync);
  return activeSyncPromise;
}
