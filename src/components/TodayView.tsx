import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Goal, DailyLogEntry, AppSettings, GoalFrequency } from '../types';
import { calculateDayScore, checkRecoveryModeNeeded } from '../services/storage';
import { formatDateDisplay, getScoreStatus, formatTime12Hour, getTodayDateString, getWeekInfo, getDayOfWeekName } from '../utils/dateUtils';
import { getCategoryTheme, STARTER_GOAL_TEMPLATES } from '../data/starterData';
import { CustomSelect } from './CustomSelect';
import { GoalModal } from './GoalModal';
import { triggerHaptic } from '../services/native';
import { Button } from './ui/Button';

interface TodayViewProps {
  currentDate: string;
  onChangeDate: (newDate: string) => void;
  goals: Goal[];
  dailyLogs: DailyLogEntry[];
  settings: AppSettings;
  onRecordExecution: (date: string, goalId: string, completed: boolean, reason?: string) => void;
  onClearExecution: (date: string, goalId: string) => void;
  onNavigateToGoals: () => void;
  onAddGoal?: (goal: Goal) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  currentDate,
  onChangeDate,
  goals,
  dailyLogs,
  settings,
  onRecordExecution,
  onClearExecution,
  onNavigateToGoals,
  onAddGoal,
}) => {
  const [activeReasonGoal, setActiveReasonGoal] = useState<Goal | null>(null);
  const [customReasonInput, setCustomReasonInput] = useState('');
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [isLimbicSheetOpen, setIsLimbicSheetOpen] = useState(false);
  const [limbicTimer, setLimbicTimer] = useState<number | null>(null);
  const [undoToast, setUndoToast] = useState<{ goalId: string; goalName: string; timeoutId: ReturnType<typeof setTimeout> } | null>(null);
  const [pulseView, setPulseView] = useState<'wave' | 'pillars'>('wave');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const confettiCleanupRef = React.useRef<(() => void) | null>(null);

  // Dynamic greeting based on device time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Hardware back button registration for failure reason bottom sheet
  useEffect(() => {
    if (!activeReasonGoal) return;
    const handler = () => {
      setActiveReasonGoal(null);
      return true;
    };
    const win = window as any;
    win.__REBUILD_BACK_STACK__ = win.__REBUILD_BACK_STACK__ || [];
    win.__REBUILD_BACK_STACK__.push(handler);
    return () => {
      if (win.__REBUILD_BACK_STACK__) {
        win.__REBUILD_BACK_STACK__ = win.__REBUILD_BACK_STACK__.filter((h: any) => h !== handler);
      }
    };
  }, [activeReasonGoal]);

  // Hardware back button registration for quick add goal modal
  useEffect(() => {
    if (!isQuickAddModalOpen) return;
    const handler = () => {
      setIsQuickAddModalOpen(false);
      return true;
    };
    const win = window as any;
    win.__REBUILD_BACK_STACK__ = win.__REBUILD_BACK_STACK__ || [];
    win.__REBUILD_BACK_STACK__.push(handler);
    return () => {
      if (win.__REBUILD_BACK_STACK__) {
        win.__REBUILD_BACK_STACK__ = win.__REBUILD_BACK_STACK__.filter((h: any) => h !== handler);
      }
    };
  }, [isQuickAddModalOpen]);

  // Hardware back button registration for limbic tactical override sheet
  useEffect(() => {
    if (!isLimbicSheetOpen) return;
    const handler = () => {
      setIsLimbicSheetOpen(false);
      setLimbicTimer(null);
      return true;
    };
    const win = window as any;
    win.__REBUILD_BACK_STACK__ = win.__REBUILD_BACK_STACK__ || [];
    win.__REBUILD_BACK_STACK__.push(handler);
    return () => {
      if (win.__REBUILD_BACK_STACK__) {
        win.__REBUILD_BACK_STACK__ = win.__REBUILD_BACK_STACK__.filter((h: any) => h !== handler);
      }
    };
  }, [isLimbicSheetOpen]);

  // 3-Minute Tactical Horizon Countdown Engine
  useEffect(() => {
    if (limbicTimer === null || limbicTimer <= 0) return;
    const interval = setInterval(() => {
      setLimbicTimer((prev) => {
        if (prev === null || prev <= 1) {
          triggerHaptic('success');
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [limbicTimer]);

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Exclude paused and archived goals from daily scoring and Today
  const nonArchivedGoals = useMemo(() => goals.filter((g) => !g.archived), [goals]);
  const activeGoals = useMemo(() => nonArchivedGoals.filter((g) => g.active), [nonArchivedGoals]);
  
  const dayRecord = useMemo(() => calculateDayScore(currentDate, nonArchivedGoals, dailyLogs), [currentDate, nonArchivedGoals, dailyLogs]);
  const scoreInfo = useMemo(() => getScoreStatus(dayRecord.score, activeGoals.length), [dayRecord.score, activeGoals.length]);
  const recoveryInfo = useMemo(() => checkRecoveryModeNeeded(currentDate, nonArchivedGoals, dailyLogs), [currentDate, nonArchivedGoals, dailyLogs]);

  // Active circadian day based on rollover hour
  const activeToday = useMemo(
    () => getTodayDateString(settings?.dayRolloverHour || 0),
    [settings?.dayRolloverHour]
  );
  const isPastDay = currentDate < activeToday;
  const isFutureDay = currentDate > activeToday;
  const isExecutionLocked = isPastDay || isFutureDay;

  const currentStreak = React.useMemo(() => {
    let streak = 0;
    const today = new Date();
    const logDates = new Set(dailyLogs.map(l => l.date));
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      if (logDates.has(ds) && dailyLogs.some(l => l.date === ds && l.completed)) {
        streak++;
      } else if (i > 0) break;
    }
    return streak;
  }, [dailyLogs]);

  const topFailureReasons = React.useMemo(() => {
    const counts: Record<string, number> = {};
    dailyLogs.filter(l => !l.completed && l.failureReason).forEach(l => {
      counts[l.failureReason!] = (counts[l.failureReason!] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([r]) => r);
  }, [dailyLogs]);

  // Count how many goals are checked for today
  const recordedCount = activeGoals.filter((g) => dayRecord.entries[g.id] !== undefined).length;
  const allGoalsRecorded = activeGoals.length > 0 && recordedCount === activeGoals.length;

  const failedBaselineProtectors = activeGoals.filter(
    (g) => g.isBaselineProtector && dayRecord.entries[g.id]?.completed === false
  );

  // 7-Day Consistency Wave calculation (SVG Bézier spline & area coordinates)
  const weekWaveData = useMemo(() => {
    const weekInfo = getWeekInfo(currentDate, settings?.weekStartDay ?? 1);
    const days = weekInfo.days;
    const dayScores = days.map((dStr) => {
      const rec = calculateDayScore(dStr, nonArchivedGoals, dailyLogs);
      const dayOfWeek = getDayOfWeekName(dStr);
      const isToday = dStr === currentDate;
      return {
        dateStr: dStr,
        dayLabel: dayOfWeek,
        score: rec.totalGoals > 0 ? rec.score : 0,
        completed: rec.completedGoals,
        total: rec.totalGoals,
        isToday,
        hasGoals: rec.totalGoals > 0,
      };
    });

    // Map 7 days across viewBox width 350, height 105
    const points = dayScores.map((ds, idx) => {
      const x = Math.round(20 + idx * 51.66);
      const y = Math.round(84 - (ds.score / 100) * 62);
      return { x, y, ...ds };
    });

    // Smooth cubic Bézier spline through all 7 points
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = Math.round((p0.x + p1.x) / 2);
      pathD += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    // Closed area polygon down to y=96 for gradient background
    const areaD = `${pathD} L ${points[points.length - 1].x} 96 L ${points[0].x} 96 Z`;

    const todayPoint = points.find((p) => p.isToday) || points[0];
    const threshold = settings?.weeklyRewardThreshold || 90;
    const thresholdY = Math.round(84 - (threshold / 100) * 62);

    return {
      points,
      pathD,
      areaD,
      todayPoint,
      threshold,
      thresholdY,
    };
  }, [currentDate, nonArchivedGoals, dailyLogs, settings?.weekStartDay, settings?.weeklyRewardThreshold]);

  // Core Pillars category breakdown with 7-day sparklines
  const pillarData = useMemo(() => {
    const catMap = new Map<string, Goal[]>();
    activeGoals.forEach((g) => {
      const cat = g.category || 'General';
      if (!catMap.has(cat)) catMap.set(cat, []);
      catMap.get(cat)!.push(g);
    });

    const categories = Array.from(catMap.keys());
    if (categories.length === 0) return [];

    const weekInfo = getWeekInfo(currentDate, settings?.weekStartDay ?? 1);

    return categories.map((cat) => {
      const catGoals = catMap.get(cat)!;
      let completedToday = 0;
      catGoals.forEach((g) => {
        if (dayRecord.entries[g.id]?.completed) completedToday++;
      });
      const totalToday = catGoals.length;
      const rateToday = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

      // 7-day sparkline micro-points (width 60, height 18)
      const sparklinePoints: number[] = weekInfo.days.map((dStr) => {
        const dayLogs = dailyLogs.filter((l) => l.date === dStr);
        const catGoalIds = new Set(catGoals.map((g) => g.id));
        const logsInCat = dayLogs.filter((l) => catGoalIds.has(l.goalId));
        const done = logsInCat.filter((l) => l.completed).length;
        return catGoals.length > 0 ? Math.round((done / catGoals.length) * 100) : 0;
      });

      const pts = sparklinePoints.map((val, idx) => ({
        x: Math.round(2 + idx * 9.33),
        y: Math.round(16 - (val / 100) * 13),
      }));

      let sparkPath = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const cpX = Math.round((pts[i].x + pts[i + 1].x) / 2);
        sparkPath += ` C ${cpX} ${pts[i].y}, ${cpX} ${pts[i + 1].y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
      }
      const sparkArea = `${sparkPath} L ${pts[pts.length - 1].x} 18 L ${pts[0].x} 18 Z`;

      return {
        category: cat,
        totalGoals: totalToday,
        completedGoals: completedToday,
        rate: rateToday,
        sparkPath,
        sparkArea,
        theme: getCategoryTheme(cat),
      };
    });
  }, [activeGoals, dayRecord, currentDate, dailyLogs, settings?.weekStartDay]);

  // Filtered goals stream when a category pillar is tapped
  const displayedActiveGoals = useMemo(() => {
    if (!selectedCategoryFilter) return activeGoals;
    return activeGoals.filter((g) => g.category === selectedCategoryFilter);
  }, [activeGoals, selectedCategoryFilter]);

  // Quick date change (strictly locked to active day: cannot navigate to past or future days)
  const handleShiftDate = (days: number) => {
    triggerHaptic('light');
    const [y, m, d] = currentDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d + days);
    const nextY = dateObj.getFullYear();
    const nextM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const nextD = String(dateObj.getDate()).padStart(2, '0');
    const targetDate = `${nextY}-${nextM}-${nextD}`;
    if (targetDate !== activeToday) {
      triggerHaptic('warning');
      return;
    }
    onChangeDate(targetDate);
  };

  const handleYes = (goal: Goal) => {
    if (isExecutionLocked) {
      triggerHaptic('error');
      return;
    }
    triggerHaptic('medium');
    onRecordExecution(currentDate, goal.id, true, undefined);

    // If day reaches 100% or high score on this action, trigger light confetti & success haptic
    if (dayRecord.completedGoals + 1 === activeGoals.length && activeGoals.length > 0) {
      triggerHaptic('success');
      const result = confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 }, colors: ['#10B981', '#6366F1', '#F59E0B'] });
      if (result) confettiCleanupRef.current = () => (result as any).reset?.();
    }
  };

  useEffect(() => {
    return () => { confettiCleanupRef.current?.(); };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (limbicTimer !== null && limbicTimer > 0) {
      interval = setInterval(() => {
        setLimbicTimer((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (limbicTimer === 0) {
      triggerHaptic('success');
      setLimbicTimer(null);
      setIsLimbicSheetOpen(false);
      // Optional: Trigger confetti or success toast here
    }
    return () => clearInterval(interval);
  }, [limbicTimer]);

  const handleClearWithUndo = (goal: Goal) => {
    if (isExecutionLocked) {
      triggerHaptic('error');
      return;
    }
    triggerHaptic('light');
    const timeoutId = setTimeout(() => setUndoToast(null), 3000);
    onClearExecution(currentDate, goal.id);
    setUndoToast({ goalId: goal.id, goalName: goal.name, timeoutId });
  };

  const handleNoClick = (goal: Goal) => {
    if (isExecutionLocked) {
      triggerHaptic('error');
      return;
    }
    triggerHaptic('light');
    setActiveReasonGoal(goal);
    setCustomReasonInput('');
  };

  const handleSelectReason = (reason: string) => {
    if (!activeReasonGoal || isExecutionLocked) return;
    triggerHaptic('medium');
    onRecordExecution(currentDate, activeReasonGoal.id, false, reason);
    setActiveReasonGoal(null);
  };

  const handleCustomReasonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReasonGoal || !customReasonInput.trim()) return;
    triggerHaptic('medium');
    onRecordExecution(currentDate, activeReasonGoal.id, false, customReasonInput.trim());
    setActiveReasonGoal(null);
  };

  const handleQuickAddTemplate = (template: Omit<Goal, 'id' | 'startDate'>) => {
    triggerHaptic('light');
    if (onAddGoal) {
      const newGoal: Goal = {
        ...template,
        id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        startDate: currentDate,
        active: true,
      };
      onAddGoal(newGoal);
    } else {
      onNavigateToGoals();
    }
  };

  const handleCreateCustomGoal = (goal: Goal) => {
    if (onAddGoal) {
      onAddGoal(goal);
    }
    setIsQuickAddModalOpen(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Active Day Header Bar (Past/Future Navigation Locked to Protect Streak Stakes) */}
      <div className="relative overflow-hidden bg-[#0C101D] rounded-3xl p-4 sm:p-5 border border-white/[0.08] shadow-xl">
        {/* Top Meta Bar: Eyebrow + Unified Status Badge */}
        <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-indigo-300 truncate">
              REBUILD — DAILY EXECUTION
            </span>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {!isExecutionLocked ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 whitespace-nowrap shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Today Active
              </span>
            ) : (
              <div className="flex items-center gap-2">
                {isPastDay ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-slate-800/80 text-slate-400 border border-white/10 whitespace-nowrap">
                    <i className="ri-lock-2-line text-xs text-rose-400/80" /> Day Ended — Locked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-slate-800/80 text-slate-400 border border-white/10 whitespace-nowrap">
                    <i className="ri-time-line text-xs text-amber-400/80" /> Upcoming — Locked
                  </span>
                )}
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onChangeDate(activeToday);
                  }}
                  className="min-h-[30px] px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 rounded-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap shadow-xs"
                >
                  <i className="ri-focus-3-line text-xs" />
                  <span>Jump to Today</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Hero Row: Calendar Icon & Date Display */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
            <i className="ri-calendar-event-line text-lg sm:text-xl" />
          </div>
          <h2 className="text-base sm:text-xl md:text-2xl font-bold text-white tracking-tight break-words">
            {formatDateDisplay(currentDate)}
          </h2>
        </div>
      </div>

      {/* Dynamic Greeting, Tracking Budget & Philosophy Subtitle */}
      <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-xl rounded-3xl p-4 sm:p-6 border border-white/[0.08] shadow-lg before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.03] before:to-transparent before:pointer-events-none">
        <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {getGreeting()}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-normal mt-0.5">
              Build today. Don't fix your whole life today.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 backdrop-blur-md self-start sm:self-center shadow-xs">
            <i className="ri-timer-flash-line text-sm text-indigo-400 shrink-0" />
            <span>Daily tracking budget: 30 seconds to 2 minutes</span>
          </div>
        </div>
      </div>

      {/* Recovery Mode Alert (Shown if 2+ consecutive low score days detected) */}
      {recoveryInfo.isRecoveryMode && (
        <div className="p-4 sm:p-5 bg-[#0C101D] border border-white/5 rounded-3xl flex items-start gap-3.5">
          <div className="p-2 sm:p-2.5 rounded-2xl shrink-0">
            <i className="ri-shield-keyhole-line text-xl text-indigo-400 shrink-0" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-slate-950 rounded-md tracking-wider whitespace-nowrap">
                RECOVERY MODE
              </span>
              <span className="text-xs font-semibold text-amber-200/80">
                Rule: Never miss twice.
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm font-bold text-amber-200">
              “Do not recover the lost days. Recover today.”
            </p>
            <p className="mt-0.5 text-xs text-slate-300">
              One bad day does not destroy the system. Check off your next goal right now to reset momentum.
            </p>
          </div>
        </div>
      )}

      {/* Large Animated Circular Progress Ring (Primary Hero Visualization) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/95 via-[#0A0F1E]/95 to-slate-950/95 backdrop-blur-2xl rounded-3xl p-5 sm:p-8 border border-white/[0.08] shadow-xl shadow-black/40 shadow-[inset_0_0_50px_rgba(0,0,0,0.7)] before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.04] before:to-transparent before:pointer-events-none transition-all duration-300">
        {/* Top-Left Ambient Subtle Tone Circle */}
        <div
          className={`absolute -top-1/4 -left-1/4 w-[65%] aspect-square rounded-full blur-[80px] sm:blur-[100px] pointer-events-none transition-all duration-700 ${
            recoveryInfo.isRecoveryMode
              ? 'bg-rose-500/10'
              : dayRecord.score >= 90
              ? 'bg-emerald-500/10'
              : dayRecord.score >= 70
              ? 'bg-amber-500/10'
              : 'bg-indigo-600/10'
          }`}
        />

        {/* Bottom-Right Ambient Subtle Tone Circle */}
        <div
          className={`absolute -bottom-1/4 -right-1/4 w-[65%] aspect-square rounded-full blur-[80px] sm:blur-[100px] pointer-events-none transition-all duration-700 ${
            recoveryInfo.isRecoveryMode
              ? 'bg-amber-500/10'
              : dayRecord.score >= 90
              ? 'bg-teal-400/10'
              : dayRecord.score >= 70
              ? 'bg-indigo-500/10'
              : 'bg-cyan-500/10'
          }`}
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8 relative z-10">
          {/* Animated SVG Circular Progress Ring */}
          <div className="relative flex items-center justify-center shrink-0 w-48 h-48 sm:w-56 sm:h-56">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
              {/* Background ring - Black 40% stroke with 30% black backing */}
              <circle
                cx="80"
                cy="80"
                r="64"
                stroke="rgba(0, 0, 0, 0.45)"
                strokeWidth="15"
                fill="rgba(0, 0, 0, 0.3)"
              />
              <circle
                cx="80"
                cy="80"
                r="64"
                className={`transition-all duration-700 ease-out ${
                  activeGoals.length === 0
                    ? 'stroke-slate-600'
                    : dayRecord.score >= 90
                    ? 'stroke-emerald-400'
                    : dayRecord.score >= 70
                    ? 'stroke-amber-400'
                    : 'stroke-rose-400'
                }`}
                strokeWidth="15"
                strokeDasharray={402.12}
                strokeDashoffset={
                  activeGoals.length === 0
                    ? 402.12
                    : 402.12 - (402.12 * Math.min(Math.max(dayRecord.score, 0), 100)) / 100
                }
                strokeLinecap="round"
                fill="transparent"
                style={{
                  filter:
                    activeGoals.length === 0 || dayRecord.score === 0
                      ? 'none'
                      : dayRecord.score >= 90
                      ? 'drop-shadow(0 0 5px rgba(52, 211, 153, 0.25))'
                      : dayRecord.score >= 70
                      ? 'drop-shadow(0 0 5px rgba(251, 191, 36, 0.25))'
                      : 'drop-shadow(0 0 5px rgba(244, 63, 94, 0.25))',
                }}
              />
            </svg>

            {/* Inner Center Score Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none">
              <span className="text-3xl sm:text-5xl font-bold text-white tracking-tight whitespace-nowrap">
                {activeGoals.length === 0 ? '0%' : `${dayRecord.score}%`}
              </span>
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-indigo-300 mt-1 whitespace-nowrap">
                Daily Score
              </span>
            </div>
          </div>

          {/* Hero Target Information & Badge */}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold mb-2.5 max-w-full bg-[#080C16] border border-white/[0.08]">
              <span className={`w-2 h-2 rounded-full shrink-0 ${scoreInfo.accentClass}`} />
              <span className={`${scoreInfo.colorClass} truncate font-bold tracking-wide`}>{scoreInfo.label}</span>
            </div>

            <h3 className="text-lg sm:text-2xl font-bold text-white break-words">
              {activeGoals.length === 0
                ? 'No active targets configured'
                : `${dayRecord.completedGoals} / ${dayRecord.totalGoals} targets completed`}
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-md leading-relaxed">
              {scoreInfo.subtext}
            </p>

            {currentStreak > 0 && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <i className="ri-fire-line text-base text-amber-500" />
                <span>{currentStreak} day streak</span>
              </div>
            )}

            <div className="mt-3 flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-slate-300">
              <i className="ri-fire-line text-amber-400 text-sm shrink-0" />
              <span>Reward Target: ≥ {settings.weeklyRewardThreshold}% consistency</span>
            </div>
          </div>

          {/* Add Goal Action Button */}
          <div className="shrink-0 flex items-center justify-center gap-3">
            <button
              onClick={() => setIsQuickAddModalOpen(true)}
              className="min-h-[44px] min-w-[44px] inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm rounded-2xl transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <i className="ri-add-line text-sm shrink-0" />
              <span className="whitespace-nowrap">Add goal</span>
            </button>
            <button
              onClick={() => setIsLimbicSheetOpen(true)}
              className="min-h-[44px] min-w-[44px] inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 hover:bg-indigo-500/25 rounded-2xl transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <i className="ri-brain-line text-sm text-indigo-400 shrink-0" />
              <span className="whitespace-nowrap">Override</span>
            </button>
          </div>
        </div>
      </div>

      {/* Performance Pulse Analytics Card */}
      <div className="bg-[#0C101D] border border-white/[0.08] rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        {/* SVG Gradients Definition */}
        <svg className="w-0 h-0 absolute pointer-events-none" aria-hidden="true">
          <defs>
            <linearGradient id="pulseWaveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="pulseLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            <linearGradient id="pillarRingGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>

        {/* Card Header: Title & Segmented Toggle Switch */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <i className="ri-pulse-line text-sm text-cyan-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white tracking-tight truncate">
                Performance Pulse
              </h3>
            </div>
          </div>

          {/* Segmented Switch: 7-Day Wave vs Core Pillars */}
          <div className="flex items-center p-0.5 rounded-xl bg-[#080C16] border border-white/[0.08] shrink-0">
            <button
              onClick={() => {
                triggerHaptic('light');
                setPulseView('wave');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                pulseView === 'wave'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              7-Day Wave
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                setPulseView('pillars');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                pulseView === 'pillars'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Core Pillars
            </button>
          </div>
        </div>

        {/* View 1: 7-Day Consistency Wave */}
        {pulseView === 'wave' && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1 px-1">
              <span className="text-slate-400 font-medium">Weekly consistency curve</span>
              <span className="text-[11px] font-semibold text-amber-400/90 flex items-center gap-1">
                <span className="inline-block w-2.5 h-0.5 border-b border-dashed border-amber-400/80" />
                Target: {weekWaveData.threshold}%
              </span>
            </div>

            <div className="w-full relative pt-1">
              <svg
                viewBox="0 0 350 110"
                className="w-full h-auto overflow-visible"
                preserveAspectRatio="none"
              >
                {/* 90% Target Guideline */}
                <line
                  x1="12"
                  y1={weekWaveData.thresholdY}
                  x2="338"
                  y2={weekWaveData.thresholdY}
                  stroke="rgba(245, 158, 11, 0.4)"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />

                {/* Shaded Area Fill */}
                <path d={weekWaveData.areaD} fill="url(#pulseWaveGradient)" />

                {/* Spline Wave Line */}
                <path
                  d={weekWaveData.pathD}
                  fill="none"
                  stroke="url(#pulseLineGradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Day Nodes */}
                {weekWaveData.points.map((pt) => {
                  const isToday = pt.isToday;
                  return (
                    <g key={`node-${pt.dateStr}`}>
                      {isToday ? (
                        <>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="6"
                            fill="#0C101D"
                            stroke="#22d3ee"
                            strokeWidth="2"
                          />
                          <circle cx={pt.x} cy={pt.y} r="2.5" fill="#22d3ee" />
                        </>
                      ) : (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="3"
                          fill="#0C101D"
                          stroke="#818cf8"
                          strokeWidth="1.5"
                        />
                      )}

                      {/* Day Name Label below chart */}
                      <text
                        x={pt.x}
                        y="105"
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight={isToday ? '700' : '500'}
                        fill={isToday ? '#22d3ee' : '#64748b'}
                        fontFamily="sans-serif"
                      >
                        {pt.dayLabel.slice(0, 3)}
                      </text>
                    </g>
                  );
                })}

                {/* Floating Score Badge on Today's Point */}
                {weekWaveData.todayPoint && (
                  <g
                    transform={`translate(${weekWaveData.todayPoint.x}, ${Math.max(
                      14,
                      weekWaveData.todayPoint.y - 12
                    )})`}
                  >
                    <rect
                      x="-18"
                      y="-12"
                      width="36"
                      height="14"
                      rx="7"
                      fill="#090D1A"
                      stroke="#22d3ee"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="-2"
                      textAnchor="middle"
                      fill="#22d3ee"
                      fontSize="9"
                      fontWeight="700"
                      fontFamily="sans-serif"
                    >
                      {weekWaveData.todayPoint.score}%
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>
        )}

        {/* View 2: Core Pillars Triad */}
        {pulseView === 'pillars' && (
          <div>
            {pillarData.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No active targets configured in categories yet
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {pillarData.map((pillar) => {
                  const isSelected = selectedCategoryFilter === pillar.category;
                  const ringRadius = 19;
                  const ringCircumference = 2 * Math.PI * ringRadius; // ~119.38
                  const strokeOffset = ringCircumference - (ringCircumference * pillar.rate) / 100;

                  return (
                    <button
                      key={pillar.category}
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedCategoryFilter(isSelected ? null : pillar.category);
                      }}
                      className={`relative p-3 rounded-2xl border text-left transition-all cursor-pointer active:scale-[0.98] ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500/40'
                          : 'bg-[#080C16] border-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-xs font-bold truncate ${pillar.theme?.text || 'text-slate-200'}`}>
                          {pillar.category}
                        </span>
                        {isSelected ? (
                          <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded-md border border-indigo-500/30">
                            Filtered
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            {pillar.completedGoals}/{pillar.totalGoals}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        {/* Circular Progress Ring */}
                        <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                            <circle
                              cx="24"
                              cy="24"
                              r={ringRadius}
                              fill="none"
                              stroke="rgba(255,255,255,0.08)"
                              strokeWidth="3"
                            />
                            <circle
                              cx="24"
                              cy="24"
                              r={ringRadius}
                              fill="none"
                              stroke="url(#pillarRingGrad)"
                              strokeWidth="3"
                              strokeDasharray={ringCircumference}
                              strokeDashoffset={strokeOffset}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-[11px] font-bold text-white tracking-tight flex items-baseline justify-center">
                              <span>{pillar.rate}</span>
                              <span className="text-[8px] font-semibold text-slate-400 ml-0.5">%</span>
                            </span>
                          </div>
                        </div>

                        {/* 7-Day Sparkline */}
                        <div className="flex-1 flex flex-col items-end">
                          <svg className="w-[60px] h-[18px]" viewBox="0 0 60 18">
                            <defs>
                              <linearGradient id={`sparkGrad-${pillar.category.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            <path d={pillar.sparkArea} fill={`url(#sparkGrad-${pillar.category.replace(/\s+/g, '-')})`} />
                            <path d={pillar.sparkPath} fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                          <span className="text-[9px] text-slate-400 mt-1 font-medium">7-Day Trend</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Goal Execution Stream */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-400">
              Today's Active Goals ({selectedCategoryFilter ? `${displayedActiveGoals.length} / ${activeGoals.length}` : activeGoals.length})
            </h3>
            {selectedCategoryFilter && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedCategoryFilter(null);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/40 hover:bg-indigo-500/30 transition-colors cursor-pointer active:scale-95"
              >
                <span>Filtered: {selectedCategoryFilter}</span>
                <i className="ri-close-line text-xs font-bold" />
              </button>
            )}
            {allGoalsRecorded && !selectedCategoryFilter && (
              <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-500/15 text-emerald-300 rounded-md border border-emerald-500/30 backdrop-blur-md whitespace-nowrap">
                All Logged
              </span>
            )}
          </div>
        </div>

        {activeGoals.length === 0 ? (
          <div className="p-8 sm:p-10 text-center bg-[#0C101D] rounded-3xl border border-white/[0.08] shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
              <i className="ri-focus-3-line text-2xl" />
            </div>
            <h4 className="text-lg font-bold text-white">
              No Goals in Your System Yet
            </h4>
            <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
              Create your own custom goals or select starter templates below to kick off your daily tracking and build unbroken consistency.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setIsQuickAddModalOpen(true)}
                className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition-colors cursor-pointer inline-flex items-center gap-2 whitespace-nowrap"
              >
                <i className="ri-add-line text-sm shrink-0" />
                <span className="whitespace-nowrap">Create Custom Goal</span>
              </button>
              <button
                onClick={onNavigateToGoals}
                className="px-4 py-2.5 text-xs font-bold text-slate-300 bg-slate-800/70 hover:bg-slate-700/70 border border-slate-700/70 rounded-xl transition-colors cursor-pointer whitespace-nowrap backdrop-blur-md"
              >
                Open Goal Directory
              </button>
            </div>

            {/* Quick Template Starters */}
            <div className="mt-8 pt-6 border-t border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400  block mb-3">
                Or add instant starter targets (1-click):
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {STARTER_GOAL_TEMPLATES.slice(0, 6).map((template) => (
                  <button
                    key={template.name}
                    onClick={() => handleQuickAddTemplate(template)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-950/60 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/40 transition-colors cursor-pointer whitespace-nowrap backdrop-blur-md"
                  >
                    <i className="ri-add-line text-xs text-indigo-400 shrink-0" />
                    <span className="whitespace-nowrap">{template.name}</span>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">({template.target})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : displayedActiveGoals.length === 0 ? (
          <div className="p-8 text-center bg-[#0C101D] rounded-2xl border border-white/[0.08] shadow-xl">
            <p className="text-xs text-slate-400">
              No active targets found in <span className="text-indigo-400 font-semibold">{selectedCategoryFilter}</span>.
            </p>
            <button
              onClick={() => {
                triggerHaptic('light');
                setSelectedCategoryFilter(null);
              }}
              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 rounded-xl hover:bg-indigo-500/25 transition-all cursor-pointer active:scale-95"
            >
              <i className="ri-filter-off-line text-xs" />
              <span>Clear Category Filter</span>
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {displayedActiveGoals.map((goal) => {
              const theme = getCategoryTheme(goal.category);
              const entry = dayRecord.entries[goal.id];
              const isCompleted = entry?.completed === true;
              const isFailed = entry && entry.completed === false;
              const failureReason = entry?.failureReason;

              return (
                <div
                  key={goal.id}
                  id={`goal-item-${goal.id}`}
                  className={`group relative overflow-hidden rounded-2xl p-4 sm:p-5 border transition-all duration-200 shadow-xl ${
                    isCompleted
                      ? 'border-emerald-500/40 bg-gradient-to-br from-[#061812] via-[#081F17] to-[#0A0E1A] shadow-emerald-950/20'
                      : isFailed
                      ? 'border-rose-500/40 bg-gradient-to-br from-[#1C0A10] via-[#16080E] to-[#0A0E1A] shadow-rose-950/20'
                      : 'bg-[#0C101D] border-white/[0.08] hover:border-indigo-500/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    {/* Goal Info */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-bold shrink-0 whitespace-nowrap ${theme.badge}`}
                      >
                        {goal.category}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm sm:text-base font-semibold text-white break-words">
                            {goal.name}
                          </h4>
                          {goal.reminderTime && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 whitespace-nowrap shrink-0 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/5">
                              <i className="ri-time-line text-xs shrink-0 text-slate-400" /> {formatTime12Hour(goal.reminderTime)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs font-semibold text-slate-300">
                            Target: <span className="text-white font-bold">{goal.target}</span>
                          </span>
                          {goal.notes && (
                            <span className="text-xs text-slate-400 hidden sm:inline truncate max-w-xs">
                              • {goal.notes}
                            </span>
                          )}
                        </div>

                        {/* If Failed Reason displayed */}
                        {isFailed && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 break-words max-w-full backdrop-blur-md">
                            <span className="break-words">Reason: {failureReason || 'Not completed'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* YES / NO Action Controls (or Locked State) */}
                    <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-center justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                      {isExecutionLocked ? (
                        <div className="flex items-center gap-2">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap min-h-[44px]">
                              <i className="ri-check-line text-base font-bold" /> Completed
                            </span>
                          ) : isFailed ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 whitespace-nowrap min-h-[44px]">
                              <i className="ri-close-line text-base font-bold" /> Missed
                            </span>
                          ) : isPastDay ? (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 text-slate-400 border border-white/5 whitespace-nowrap min-h-[44px]">
                              <i className="ri-lock-2-line text-sm text-slate-500" /> Day Ended — Locked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 text-slate-400 border border-white/5 whitespace-nowrap min-h-[44px]">
                              <i className="ri-time-line text-sm text-slate-500" /> Upcoming — Locked
                            </span>
                          )}
                        </div>
                      ) : isCompleted ? (
                        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 text-slate-950 whitespace-nowrap min-h-[44px]">
                            <i className="ri-check-line text-base shrink-0 font-bold" /> Completed
                          </span>
                          <button
                            onClick={() => handleClearWithUndo(goal)}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-white/5 transition-colors cursor-pointer active:scale-95"
                            aria-label="Reset execution"
                            title="Reset execution"
                          >
                            <i className="ri-restart-line text-base shrink-0" />
                          </button>
                        </div>
                      ) : isFailed ? (
                        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-rose-500 text-white whitespace-nowrap min-h-[44px]">
                            <i className="ri-close-line text-base shrink-0 font-bold" /> Missed
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleNoClick(goal)}
                              className="min-h-[44px] px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-white rounded-xl bg-slate-800/80 border border-slate-700/60 cursor-pointer whitespace-nowrap active:scale-95 backdrop-blur-md"
                            >
                              Reason
                            </button>
                            <button
                              onClick={() => {
                                triggerHaptic('light');
                                onClearExecution(currentDate, goal.id);
                              }}
                              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-white/5 transition-colors cursor-pointer active:scale-95"
                              aria-label="Reset execution"
                              title="Reset execution"
                            >
                              <i className="ri-restart-line text-base shrink-0" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                          <button
                            id={`btn-yes-${goal.id}`}
                            onClick={() => handleYes(goal)}
                            aria-label={`Mark ${goal.name} as completed`}
                            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all active:scale-95 cursor-pointer min-h-[44px] sm:min-w-[84px] whitespace-nowrap tracking-wide"
                          >
                            <i className="ri-check-line text-base shrink-0 font-bold" />
                            <span className="whitespace-nowrap">YES</span>
                          </button>
                          <button
                            id={`btn-no-${goal.id}`}
                            onClick={() => handleNoClick(goal)}
                            aria-label={`Mark ${goal.name} as missed`}
                            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-all active:scale-95 cursor-pointer min-h-[44px] sm:min-w-[84px] whitespace-nowrap tracking-wide"
                          >
                            <i className="ri-close-line text-base shrink-0 font-bold" />
                            <span className="whitespace-nowrap">NO</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Failure Reason Bottom Sheet */}
      {activeReasonGoal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="absolute inset-0 -z-10"
            onClick={() => setActiveReasonGoal(null)}
          />
          <div className="relative w-full max-w-lg bg-[#0C101D] border-t border-white/10 shadow-2xl rounded-3xl max-h-[88dvh] flex flex-col text-white animate-in zoom-in-95 duration-200 overflow-hidden">
            {/* Pinned Header */}
            <div className="p-5 pb-3.5 border-b border-white/[0.08] shrink-0 relative z-10 bg-gradient-to-b from-white/[0.04] to-transparent">
              <div className="hidden w-12 rounded-full" aria-hidden="true" />
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 text-[11px] font-bold  bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-md">
                      Friction Diagnostic
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white break-words">
                    Why was “{activeReasonGoal.name}” missed?
                  </h3>
                </div>
                <button
                  onClick={() => setActiveReasonGoal(null)}
                  aria-label="Close reason selector"
                  className="w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-white/10 active:scale-95 cursor-pointer shrink-0 transition-all"
                >
                  <i className="ri-close-line text-xl shrink-0" />
                </button>
              </div>
            </div>

            {/* Scrollable Reason Selection Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 relative z-10">
              <p className="text-xs text-slate-400 leading-relaxed">
                Logging friction points builds self-awareness and recalibrates your next routine without breaking momentum.
              </p>

              {/* Quick Reason Chips in 2-Column Grid */}
              {topFailureReasons.length > 0 && (
                <div className="mb-1">
                  <span className="text-[11px] font-bold text-slate-400  block mb-2">Your top reasons</span>
                  <div className="flex flex-wrap gap-2">
                    {topFailureReasons.map(reason => (
                      <button
                        key={`top-${reason}`}
                        onClick={() => handleSelectReason(reason)}
                        className="min-h-[40px] px-3.5 py-2 rounded-2xl text-xs font-bold text-amber-200 bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/40 hover:border-amber-500/60 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                      >
                        <i className="ri-shield-flash-line text-amber-500" />
                        <span>{reason}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {(settings?.failureReasons || []).map((reason) => (
                  <button
                    key={reason}
                    onClick={() => handleSelectReason(reason)}
                    className="min-h-[48px] px-3.5 py-2.5 rounded-2xl text-left text-xs font-bold text-slate-200 bg-slate-900/80 hover:bg-rose-500/20 hover:text-rose-200 border border-white/10 hover:border-rose-500/50 backdrop-blur-md transition-all cursor-pointer active:scale-95 flex items-center leading-snug break-words shadow-sm hover:shadow-rose-500/20"
                  >
                    <span className="line-clamp-2">{reason}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pinned Sticky Footer with Custom Reason Input */}
            <div className="p-4 bg-slate-950/60 backdrop-blur-2xl border-t border-white/[0.08] shrink-0 pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] relative z-10">
              <form onSubmit={handleCustomReasonSubmit} className="flex gap-2.5">
                <input
                  type="text"
                  placeholder="Or enter tactical reason..."
                  value={customReasonInput}
                  autoCapitalize="sentences"
                  spellCheck={false}
                  onChange={(e) => setCustomReasonInput(e.target.value)}
                  className="flex-1 min-h-[48px] px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-[#080C16] border border-white/10 focus:border-indigo-500/50 outline-none text-white placeholder-slate-500"
                />
                <button
                  type="submit"
                  disabled={!customReasonInput.trim()}
                  className="min-h-[48px] px-6 text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 text-white shadow-sm disabled:opacity-40 rounded-2xl transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center justify-center "
                >
                  Log
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Goal Modal */}
      <GoalModal
        isOpen={isQuickAddModalOpen}
        onClose={() => setIsQuickAddModalOpen(false)}
        onSaveGoal={handleCreateCustomGoal}
        categories={settings?.categories || ['General', 'Study', 'Fitness']}
        currentDate={currentDate}
        badgeTitle="Quest Deployment"
        submitButtonText="Deploy goal"
      />
      
      {/* Global Success Toast */}
      {saveSuccess && (
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[100] flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-slate-950 rounded-2xl shadow-xl text-xs sm:text-sm font-bold animate-in slide-in-from-right-4 duration-200">
          <i className="ri-checkbox-circle-line text-lg" />
          <span>Goal deployed successfully</span>
        </div>
      )}
      
      {undoToast && (
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[100] flex items-center gap-3 px-4 py-3 bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-xl text-xs font-bold text-white whitespace-nowrap animate-in slide-in-from-right-4 duration-200">
          <i className="ri-restart-line text-slate-400" />
          <span>Marked as missed — <span className="text-slate-300">{undoToast.goalName}</span></span>
          <button onClick={() => { clearTimeout(undoToast.timeoutId); onRecordExecution(currentDate, undoToast.goalId, true); setUndoToast(null); }} className="ml-1 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95">
            Undo
          </button>
          <button onClick={() => { clearTimeout(undoToast.timeoutId); setUndoToast(null); }} className="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
            <i className="ri-close-line text-sm" />
          </button>
        </div>
      )}

      {/* Limbic Tactical Override Sheet (Concept 1: Neuro-Calm Tactical Override) */}
      {isLimbicSheetOpen && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="absolute inset-0 -z-10"
            onClick={() => {
              setLimbicTimer(null);
              setIsLimbicSheetOpen(false);
            }}
          />
          <div className="relative w-full max-w-md bg-[#0C101D] sm:rounded-3xl rounded-t-3xl border-t sm:border border-indigo-500/20 overflow-hidden flex flex-col text-white shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200">
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

            <div className="p-6 text-center relative z-10">
              {/* Calm Neuroscience Icon */}
              <div className="w-14 h-14 mx-auto bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mb-3.5 shadow-inner">
                <i className="ri-brain-line text-2xl text-indigo-400" />
              </div>

              {/* Title & Tactical Badge */}
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <h3 className="text-xl font-bold text-white tracking-tight">Limbic Friction Detected</h3>
              </div>
              <div className="mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  3-Minute Horizon Protocol
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 mb-5 leading-relaxed max-w-sm mx-auto font-normal">
                Your amygdala is resisting task initiation. We eliminate outcome pressure and shorten the horizon to 3 minutes of mechanical motion.
              </p>

              {limbicTimer !== null ? (
                /* Active Countdown Display */
                <div className="py-4 my-2">
                  <div className="relative w-44 h-44 mx-auto flex items-center justify-center mb-4">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                      <circle
                        cx="80"
                        cy="80"
                        r="66"
                        stroke="rgba(255, 255, 255, 0.06)"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="66"
                        className="stroke-indigo-400 transition-all duration-1000 ease-linear"
                        strokeWidth="10"
                        strokeDasharray={414.69}
                        strokeDashoffset={414.69 - (414.69 * (180 - limbicTimer)) / 180}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold text-white font-mono tabular-nums">
                        {Math.floor(limbicTimer / 60)}:{(limbicTimer % 60).toString().padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 mt-1">
                        {limbicTimer === 0 ? 'Momentum Unlocked' : 'Focus Horizon'}
                      </span>
                    </div>
                  </div>

                  {limbicTimer === 0 ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs font-bold text-emerald-300">
                        Initial friction broken! Continue with momentum.
                      </div>
                      <button
                        onClick={() => {
                          triggerHaptic('success');
                          setLimbicTimer(null);
                          setIsLimbicSheetOpen(false);
                        }}
                        className="w-full py-3.5 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer active:scale-95 shadow-lg shadow-emerald-600/20"
                      >
                        Complete Protocol
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          setLimbicTimer(180);
                        }}
                        className="min-h-[40px] px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl cursor-pointer active:scale-95 flex items-center gap-1.5"
                      >
                        <i className="ri-restart-line text-xs text-indigo-400" />
                        <span>Reset Timer</span>
                      </button>
                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          setLimbicTimer(null);
                        }}
                        className="min-h-[40px] px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-300 cursor-pointer transition-colors"
                      >
                        Instructions
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Tactical 3-Step Protocol Card */}
                  <div className="bg-[#080C16] rounded-2xl p-4 border border-white/5 mb-5 text-left">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Tactical Micro-Steps
                      </span>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div className="flex items-start gap-3">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono font-bold text-[10px] shrink-0 mt-0.5">
                          01
                        </span>
                        <div>
                          <p className="font-bold text-slate-200">Physiological Reset</p>
                          <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                            Take 3 slow exhalations to down-regulate heart rate and clear mental static.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono font-bold text-[10px] shrink-0 mt-0.5">
                          02
                        </span>
                        <div>
                          <p className="font-bold text-slate-200">Microscopic Target</p>
                          <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                            Touch the workspace. Open the first page or document. Only the first physical motion matters.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono font-bold text-[10px] shrink-0 mt-0.5">
                          03
                        </span>
                        <div>
                          <p className="font-bold text-slate-200">Zero Evaluation</p>
                          <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                            Do not judge speed, quality, or progress for 3 minutes. Move purely mechanically.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => {
                      triggerHaptic('success');
                      setLimbicTimer(180);
                    }}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer active:scale-95 shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                  >
                    <i className="ri-flashlight-line text-base" />
                    <span>Initiate 3-Minute Horizon</span>
                  </button>
                </>
              )}
            </div>

            {/* Modal Footer / Dismiss Button */}
            <button
              onClick={() => {
                setLimbicTimer(null);
                setIsLimbicSheetOpen(false);
              }}
              className="py-3.5 text-xs font-bold text-slate-400 hover:text-white border-t border-white/5 bg-white/[0.02] cursor-pointer transition-colors"
            >
              Dismiss Protocol
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
