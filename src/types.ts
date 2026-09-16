export type GoalFrequency = 'Daily' | 'Weekly' | 'Mon-Fri' | 'Weekends' | 'Custom';

export interface Goal {
  id: string;
  name: string;
  category: string;
  target: string; // e.g. "2 hours", "30 mins", "Daily"
  frequency: GoalFrequency;
  customDays?: number[]; // 0 for Sun, 1 for Mon, etc.
  reminderTime?: string; // e.g. "06:00"
  durationMinutes?: number; // e.g. 60
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  active: boolean;
  archived?: boolean;
  notes?: string;
  weight?: number; // default 1
  isBaselineProtector?: boolean; // Dopamine baseline tracker
}

export type FailureReason =
  | 'Illness'
  | 'Mental fog'
  | 'Too tired'
  | 'Lazy / low energy'
  | 'Procrastination'
  | 'Phone / social media'
  | 'Porn / distraction'
  | 'Work'
  | 'Unexpected situation'
  | 'Poor planning'
  | 'Forgot'
  | 'Goal was too difficult'
  | 'Goal was unrealistic'
  | 'No specific reason'
  | 'Other';

export type ActiveTab = 'today' | 'goals' | 'weekly' | 'monthly' | 'milestones' | 'analysis' | 'theory' | 'settings';

export interface DailyLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  goalId: string;
  goalName?: string;
  category?: string;
  target?: string;
  completed: boolean;
  failureReason?: string;
  notes?: string;
  timestamp: number;
}

export interface DayRecord {
  date: string; // YYYY-MM-DD
  score: number; // 0 - 100
  totalGoals: number;
  completedGoals: number;
  entries: Record<string, { completed: boolean; failureReason?: string }>;
}

export type RewardType =
  | 'Food'
  | 'Movie'
  | 'Gaming'
  | 'Shopping'
  | 'Entertainment'
  | 'Experience'
  | 'Technology'
  | 'Personal'
  | 'Other';

export interface WeeklyReward {
  id: string;
  weekId: string; // e.g. "2027-W01" or "2026-W34"
  weekNumber: number;
  year: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  rewardName: string;
  rewardType: RewardType;
  budget: number;
  actualSpend: number;
  currency: string;
  requiredScore: number; // default 90
  isConfigLocked: boolean; // Locked before week starts
  isClaimed: boolean;
  claimedAt?: string;
  notes?: string;
}

export interface MonthlyReward {
  id: string;
  monthId: string; // e.g. "2027-01"
  monthName: string;
  year: number;
  rewardName: string;
  rewardType: RewardType;
  budget: number;
  actualSpend: number;
  currency: string;
  requiredScore: number; // default 90
  isClaimed: boolean;
  claimedAt?: string;
  notes?: string;
}

export interface Milestone2027 {
  id: string;
  title: string;
  description: string;
  category: string;
  reward: string;
  rewardCategory: string;
  budget?: number;
  currency: string;
  achieved: boolean;
  achievedDate?: string;
  isPredefined?: boolean;
}

export interface AppSettings {
  weeklyRewardThreshold: number; // default 90%
  monthlyRewardThreshold: number; // default 90%
  currency: string; // '₹', '$', '€', '£'
  weekStartDay: 0 | 1; // 0 for Sunday, 1 for Monday
  dayRolloverHour?: number; // 0-23 (default 0 for midnight)
  categories: string[];
  failureReasons: string[];
  notificationsEnabled?: boolean;
  eveningReminderEnabled?: boolean;
  eveningReminderTime?: string; // e.g. "22:00" (10:00 PM)
  weeklyNudgeEnabled?: boolean;
  weeklyNudgeDay?: number; // 0 for Sun, 1 for Mon...
  weeklyNudgeTime?: string; // e.g. "20:00" (8:00 PM)
  dailyCheckpointsEnabled?: boolean;
  morningBriefingTime?: string; // e.g. "04:00" (4:00 AM)
  middayAuditTime?: string; // e.g. "12:00" (12:00 PM)
  eveningDefenseTime?: string; // e.g. "20:00" (8:00 PM)
}

export interface CategoryTheme {
  name: string;
  bg: string;
  text: string;
  border: string;
  accent: string;
  badge: string;
}
