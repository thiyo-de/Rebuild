import {
  Goal,
  DailyLogEntry,
  WeeklyReward,
  MonthlyReward,
  Milestone2027,
  AppSettings,
  DayRecord,
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_GOALS,
  INITIAL_MILESTONES_2027,
} from '../data/starterData';

export const STATE_VERSION = 2;

const STORAGE_KEYS = {
  GOALS: 'rebuild_2027_goals_v2',
  DAILY_LOGS: 'rebuild_2027_daily_logs_v2',
  WEEKLY_REWARDS: 'rebuild_2027_weekly_rewards_v2',
  MONTHLY_REWARDS: 'rebuild_2027_monthly_rewards_v2',
  MILESTONES: 'rebuild_2027_milestones_v2',
  SETTINGS: 'rebuild_2027_settings_v2',
  IS_INITIALIZED: 'rebuild_2027_initialized_v2',
  VERSION: 'rebuild_2027_version',
};

export interface AppState {
  goals: Goal[];
  dailyLogs: DailyLogEntry[];
  weeklyRewards: WeeklyReward[];
  monthlyRewards: MonthlyReward[];
  milestones: Milestone2027[];
  settings: AppSettings;
}

// Generate clean slate initial state with NO dummy goals or fake logs, but WITH the requested predefined 2027 milestones
export const generateCleanState = (): AppState => {
  return {
    goals: [],
    dailyLogs: [],
    weeklyRewards: [],
    monthlyRewards: [],
    milestones: INITIAL_MILESTONES_2027,
    settings: INITIAL_SETTINGS,
  };
};

export const loadStarterPresetsState = (): AppState => {
  return {
    goals: INITIAL_GOALS,
    dailyLogs: [],
    weeklyRewards: [],
    monthlyRewards: [],
    milestones: INITIAL_MILESTONES_2027,
    settings: INITIAL_SETTINGS,
  };
};

export const loadStoredState = (): AppState => {
  try {
    const isInitialized = localStorage.getItem(STORAGE_KEYS.IS_INITIALIZED);
    const rawGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
    const rawLogs = localStorage.getItem(STORAGE_KEYS.DAILY_LOGS);
    const rawWeekly = localStorage.getItem(STORAGE_KEYS.WEEKLY_REWARDS);
    const rawMonthly = localStorage.getItem(STORAGE_KEYS.MONTHLY_REWARDS);
    const rawMilestones = localStorage.getItem(STORAGE_KEYS.MILESTONES);
    const rawSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const rawVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
    const storedVersion = rawVersion ? parseInt(rawVersion, 10) : 0;

    if (!isInitialized) {
      // First time loading: start with a clean state with predefined 2027 milestones
      const initial = generateCleanState();
      saveStoredState(initial);
      localStorage.setItem(STORAGE_KEYS.IS_INITIALIZED, 'true');
      return initial;
    }

    let parsedGoals: Goal[] = [];
    if (rawGoals) {
      try {
        const parsed = JSON.parse(rawGoals);
        if (Array.isArray(parsed)) parsedGoals = parsed;
      } catch {}
    }

    let parsedLogs: DailyLogEntry[] = [];
    if (rawLogs) {
      try {
        const parsed = JSON.parse(rawLogs);
        if (Array.isArray(parsed)) parsedLogs = parsed;
      } catch {}
    }

    let parsedWeekly: WeeklyReward[] = [];
    if (rawWeekly) {
      try {
        const parsed = JSON.parse(rawWeekly);
        if (Array.isArray(parsed)) parsedWeekly = parsed;
      } catch {}
    }

    let parsedMonthly: MonthlyReward[] = [];
    if (rawMonthly) {
      try {
        const parsed = JSON.parse(rawMonthly);
        if (Array.isArray(parsed)) parsedMonthly = parsed;
      } catch {}
    }

    let loadedMilestones: Milestone2027[] = [];
    let hasMilestonesStored = false;
    if (rawMilestones !== null && rawMilestones !== undefined) {
      try {
        const parsed = JSON.parse(rawMilestones);
        if (Array.isArray(parsed)) {
          loadedMilestones = parsed;
          hasMilestonesStored = true;
        }
      } catch {}
    }
    const finalMilestones = hasMilestonesStored
      ? loadedMilestones
      : INITIAL_MILESTONES_2027;

    let parsedSettings: AppSettings = { ...INITIAL_SETTINGS };
    if (rawSettings) {
      try {
        const parsed = JSON.parse(rawSettings);
        if (parsed && typeof parsed === 'object') {
          parsedSettings = {
            ...INITIAL_SETTINGS,
            ...parsed,
            categories:
              Array.isArray(parsed.categories) && parsed.categories.length > 0
                ? parsed.categories
                : INITIAL_SETTINGS.categories,
            failureReasons:
              Array.isArray(parsed.failureReasons) && parsed.failureReasons.length > 0
                ? parsed.failureReasons
                : INITIAL_SETTINGS.failureReasons,
          };
        }
      } catch {}
    }

    const assembled = {
      goals: parsedGoals,
      dailyLogs: parsedLogs,
      weeklyRewards: parsedWeekly,
      monthlyRewards: parsedMonthly,
      milestones: finalMilestones,
      settings: parsedSettings,
    };

    if (storedVersion < STATE_VERSION) {
      return migrateState(assembled, storedVersion);
    }

    return assembled;
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
    return generateCleanState();
  }
};

export const saveStoredState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEYS.IS_INITIALIZED, 'true');
    localStorage.setItem(STORAGE_KEYS.VERSION, String(STATE_VERSION));
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(state.goals));
    localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(state.dailyLogs));
    localStorage.setItem(STORAGE_KEYS.WEEKLY_REWARDS, JSON.stringify(state.weeklyRewards));
    localStorage.setItem(STORAGE_KEYS.MONTHLY_REWARDS, JSON.stringify(state.monthlyRewards));
    localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(state.milestones));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
  } catch (err) {
    if (
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      const storageErr = new Error('localStorage quota exceeded — unable to save state');
      storageErr.name = 'StorageQuotaError';
      throw storageErr;
    }
    console.error('Failed to save state to localStorage:', err);
  }
};

const PARTIAL_KEY_MAP: Partial<Record<keyof AppState, string>> = {
  goals: STORAGE_KEYS.GOALS,
  dailyLogs: STORAGE_KEYS.DAILY_LOGS,
  weeklyRewards: STORAGE_KEYS.WEEKLY_REWARDS,
  monthlyRewards: STORAGE_KEYS.MONTHLY_REWARDS,
  milestones: STORAGE_KEYS.MILESTONES,
  settings: STORAGE_KEYS.SETTINGS,
};

export const savePartialState = (updates: Partial<AppState>) => {
  try {
    (Object.keys(updates) as (keyof AppState)[]).forEach((key) => {
      const storageKey = PARTIAL_KEY_MAP[key];
      if (storageKey !== undefined) {
        localStorage.setItem(storageKey, JSON.stringify(updates[key]));
      }
    });
  } catch (err) {
    if (
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      const storageErr = new Error('localStorage quota exceeded — unable to save partial state');
      storageErr.name = 'StorageQuotaError';
      throw storageErr;
    }
    console.error('Failed to save partial state to localStorage:', err);
  }
};

export const getStorageUsageInfo = async (): Promise<{
  usedBytes: number;
  quota: number;
  percentUsed: number;
}> => {
  if (navigator.storage?.estimate) {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    return {
      usedBytes: usage,
      quota,
      percentUsed: quota > 0 ? Number(((usage / quota) * 100).toFixed(2)) : 0,
    };
  }
  // Fallback: estimate from the serialised lengths of stored values
  const usedBytes = Object.values(STORAGE_KEYS).reduce((acc, key) => {
    const val = localStorage.getItem(key);
    return acc + (val ? new Blob([val]).size : 0);
  }, 0);
  return { usedBytes, quota: 0, percentUsed: 0 };
};

export const migrateState = (rawState: any, version: number): AppState => {
  // v0 / v1 → v2: merge with clean defaults to fill any missing keys
  const defaults = generateCleanState();
  const migrated: AppState = {
    goals: Array.isArray(rawState?.goals) ? rawState.goals : defaults.goals,
    dailyLogs: Array.isArray(rawState?.dailyLogs) ? rawState.dailyLogs : defaults.dailyLogs,
    weeklyRewards: Array.isArray(rawState?.weeklyRewards)
      ? rawState.weeklyRewards
      : defaults.weeklyRewards,
    monthlyRewards: Array.isArray(rawState?.monthlyRewards)
      ? rawState.monthlyRewards
      : defaults.monthlyRewards,
    milestones:
      Array.isArray(rawState?.milestones) && rawState.milestones.length > 0
        ? rawState.milestones
        : defaults.milestones,
    settings:
      rawState?.settings && typeof rawState.settings === 'object'
        ? { ...defaults.settings, ...rawState.settings }
        : defaults.settings,
  };
  return migrated;
};

export const resetToCleanDefaults = (): AppState => {
  const fresh = generateCleanState();
  saveStoredState(fresh);
  return fresh;
};

export const resetToStarterDefaults = resetToCleanDefaults;

// Calculate Day Record (Score, Completed, Total)
export const calculateDayScore = (
  dateStr: string,
  goals: Goal[],
  dailyLogs: DailyLogEntry[]
): DayRecord => {
  const activeGoals = goals.filter((g) => g.active);
  const dayLogs = dailyLogs.filter((l) => l.date === dateStr);

  const entries: Record<string, { completed: boolean; failureReason?: string }> = {};
  dayLogs.forEach((l) => {
    entries[l.goalId] = {
      completed: l.completed,
      failureReason: l.failureReason,
    };
  });

  if (activeGoals.length === 0) {
    return {
      date: dateStr,
      score: 0,
      totalGoals: 0,
      completedGoals: 0,
      entries,
    };
  }

  let completedCount = 0;
  activeGoals.forEach((g) => {
    if (entries[g.id]?.completed) {
      completedCount += 1;
    }
  });

  const score = Math.round((completedCount / activeGoals.length) * 100);

  return {
    date: dateStr,
    score,
    totalGoals: activeGoals.length,
    completedGoals: completedCount,
    entries,
  };
};

// Calculate Week Average Score
export const calculateWeekScore = (
  weekDays: string[],
  goals: Goal[],
  dailyLogs: DailyLogEntry[]
): { score: number; recordedDaysCount: number; dailyBreakdown: Record<string, number> } => {
  const dailyBreakdown: Record<string, number> = {};
  let totalScore = 0;
  let recordedDays = 0;
  const activeGoals = goals.filter((g) => g.active);

  weekDays.forEach((d) => {
    const hasLogs = dailyLogs.some((l) => l.date === d);
    if (hasLogs && activeGoals.length > 0) {
      const dayRec = calculateDayScore(d, goals, dailyLogs);
      dailyBreakdown[d] = dayRec.score;
      totalScore += dayRec.score;
      recordedDays += 1;
    } else {
      dailyBreakdown[d] = 0;
    }
  });

  const avgScore = recordedDays > 0 ? Number((totalScore / recordedDays).toFixed(1)) : 0;

  return {
    score: avgScore,
    recordedDaysCount: recordedDays,
    dailyBreakdown,
  };
};

// Calculate Month Average Score
export const calculateMonthScore = (
  monthDays: string[],
  goals: Goal[],
  dailyLogs: DailyLogEntry[]
): { score: number; recordedDaysCount: number } => {
  let totalScore = 0;
  let recordedDays = 0;
  const activeGoals = goals.filter((g) => g.active);

  monthDays.forEach((d) => {
    const hasLogs = dailyLogs.some((l) => l.date === d);
    if (hasLogs && activeGoals.length > 0) {
      const dayRec = calculateDayScore(d, goals, dailyLogs);
      totalScore += dayRec.score;
      recordedDays += 1;
    }
  });

  const avgScore = recordedDays > 0 ? Number((totalScore / recordedDays).toFixed(1)) : 0;
  return { score: avgScore, recordedDaysCount: recordedDays };
};

// Recovery Mode Detection: checks if user has 2 or more consecutive recorded low-score days (< 70%)
export const checkRecoveryModeNeeded = (
  currentDate: string,
  goals: Goal[],
  dailyLogs: DailyLogEntry[]
): { isRecoveryMode: boolean; consecutiveLowDays: number } => {
  if (goals.filter((g) => g.active).length === 0) {
    return { isRecoveryMode: false, consecutiveLowDays: 0 };
  }

  const [year, month, day] = currentDate.split('-').map(Number);
  let lowCount = 0;

  for (let i = 1; i <= 3; i++) {
    const d = new Date(year, month - 1, day - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    const pastDateStr = `${y}-${m}-${da}`;

    const hasLogs = dailyLogs.some((l) => l.date === pastDateStr);
    if (hasLogs) {
      const dayRec = calculateDayScore(pastDateStr, goals, dailyLogs);
      if (dayRec.score < 70) {
        lowCount += 1;
      } else {
        break;
      }
    }
  }

  return {
    isRecoveryMode: lowCount >= 2,
    consecutiveLowDays: lowCount,
  };
};
