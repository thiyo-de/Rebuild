import React, { useState, useMemo } from 'react';
import { Goal, DailyLogEntry, AppSettings, DayRecord } from '../types';
import { calculateDayScore, calculateWeekScore } from '../services/storage';
import { getWeekInfo, formatShortDate } from '../utils/dateUtils';
import { getCategoryTheme, ALL_GOAL_CATEGORIES } from '../data/starterData';
import { nativeHaptics } from '../services/native';


interface AnalysisViewProps {
  currentDate: string;
  goals: Goal[];
  dailyLogs: DailyLogEntry[];
  settings: AppSettings;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  currentDate,
  goals,
  dailyLogs,
  settings,
}) => {
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90' | 'all'>('30');
  const [activeSegmentHover, setActiveSegmentHover] = useState<string | null>(null);

  const analytics = useMemo(() => {
    // --- Filtered Logs ---
    let filteredLogs = dailyLogs;
    if (timeRange !== 'all') {
      const daysLimit = timeRange === '7' ? 7 : timeRange === '30' ? 30 : 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysLimit);
      const cutoffStr = cutoffDate.toISOString().split('T')[0];
      filteredLogs = dailyLogs.filter((l) => l.date >= cutoffStr);
    }

    // --- 1. Overall Completion Rate ---
    const totalEntriesCount = filteredLogs.length;
    const totalCompletedCount = filteredLogs.filter((l) => l.completed).length;
    const totalMissedCount = filteredLogs.filter((l) => !l.completed).length;
    const overallRate = totalEntriesCount > 0 ? Math.round((totalCompletedCount / totalEntriesCount) * 100) : 0;

    // --- 2. Failure Reasons Breakdown ---
    const reasonCounts: Record<string, number> = {};
    filteredLogs.filter((l) => !l.completed && l.failureReason).forEach((l) => {
      const r = l.failureReason!;
      reasonCounts[r] = (reasonCounts[r] || 0) + 1;
    });
    const sortedReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count, percentage: totalMissedCount > 0 ? Math.round((count / totalMissedCount) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);
    let cumSum = 0;
    const paretoReasons = sortedReasons.map((item) => {
      cumSum += item.count;
      return { ...item, cumulativePercentage: totalMissedCount > 0 ? Math.round((cumSum / totalMissedCount) * 100) : 0 };
    });
    const dominantFailureReasons = sortedReasons.slice(0, 3);

    // --- 3. Goal Consistency Rankings ---
    const goalStats = goals.map((g) => {
      const logsForGoal = filteredLogs.filter((l) => l.goalId === g.id);
      const completed = logsForGoal.filter((l) => l.completed).length;
      const total = logsForGoal.length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { goal: g, total, completed, missed: total - completed, rate };
    });
    const rankedGoals = [...goalStats].filter((s) => s.total > 0).sort((a, b) => b.rate - a.rate);
    const strongestGoals = [...rankedGoals];

    // --- 4. Category Breakdown ---
    const categoryStats = ALL_GOAL_CATEGORIES.map((cat) => {
      const goalsInCat = goals.filter((g) => g.category === cat);
      const goalIds = new Set(goalsInCat.map((g) => g.id));
      const logsInCat = filteredLogs.filter((l) => goalIds.has(l.goalId));
      const total = logsInCat.length;
      const completed = logsInCat.filter((l) => l.completed).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { category: cat, goalCount: goalsInCat.length, totalLogs: total, completedLogs: completed, rate, theme: getCategoryTheme(cat) };
    }).filter((c) => c.goalCount > 0 || c.totalLogs > 0);

    // --- 5. Streak & Diagnostics with Single-Pass Cache ---
    const scoreCache = new Map<string, DayRecord>();
    const getCachedDayScore = (dateStr: string, logs: DailyLogEntry[]) => {
      const cached = scoreCache.get(dateStr);
      if (cached) return cached;
      const computed = calculateDayScore(dateStr, goals, logs);
      scoreCache.set(dateStr, computed);
      return computed;
    };

    const dateGroups: Record<string, DailyLogEntry[]> = {};
    filteredLogs.forEach((log) => {
      if (!dateGroups[log.date]) dateGroups[log.date] = [];
      dateGroups[log.date].push(log);
    });
    const loggedDates = Object.keys(dateGroups).sort().reverse();
    const totalDaysLogged = loggedDates.length;

    let perfectDaysCount = 0;
    loggedDates.forEach((dateStr) => {
      const dayScore = getCachedDayScore(dateStr, filteredLogs);
      if (dayScore.score === 100 && dayScore.totalGoals > 0) perfectDaysCount++;
    });

    // Current streak
    let currentStreak = 0;
    const todayDate = new Date();
    const daysLimit = timeRange === 'all' ? 365 : (timeRange === '7' ? 7 : timeRange === '30' ? 30 : 90);
    for (let i = 0; i < daysLimit; i++) {
      const d = new Date();
      d.setDate(todayDate.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const logsForDay = dateGroups[dateStr] || [];
      const completedForDay = logsForDay.filter((l) => l.completed).length;
      if (completedForDay > 0) { currentStreak++; } else if (i > 0) { break; }
    }

    // --- 6. Week breakdown ---
    const weekInfo = getWeekInfo(currentDate, settings.weekStartDay);
    const weekScoreData = calculateWeekScore(weekInfo.days, goals, dailyLogs);
    const weekAvg = weekScoreData.score;

    // --- 7. Equalizer (8-day) ---
    const equalizerDays: { dateStr: string; label: string; score: number; completedCount: number; totalCount: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(todayDate.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayRec = getCachedDayScore(dStr, dailyLogs);
      equalizerDays.push({ dateStr: dStr, label: i === 0 ? 'Today' : `D-${String(8 - i).padStart(2, '0')}`, score: dayRec.score, completedCount: dayRec.completedGoals, totalCount: dayRec.totalGoals });
    }

    // --- 8. Density bars (14-day) ---
    const densityBars: { dateStr: string; label: string; score: number; heightPercent: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(todayDate.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayRec = getCachedDayScore(dStr, dailyLogs);
      densityBars.push({ dateStr: dStr, label: String(d.getDate()).padStart(2, '0'), score: dayRec.score, heightPercent: dayRec.totalGoals > 0 ? Math.max(dayRec.score, 8) : 6 });
    }

    return {
      filteredLogs, totalEntriesCount, totalCompletedCount, totalMissedCount, overallRate,
      sortedReasons, paretoReasons, dominantFailureReasons,
      goalStats, rankedGoals, strongestGoals,
      categoryStats,
      dateGroups, loggedDates, totalDaysLogged, perfectDaysCount, currentStreak,
      weekInfo, weekAvg, weekDailyBreakdown: weekScoreData.dailyBreakdown,
      equalizerDays, densityBars,
    };
  }, [dailyLogs, goals, currentDate, settings.weekStartDay, timeRange]);

  const { filteredLogs, totalEntriesCount, totalCompletedCount, totalMissedCount, overallRate, sortedReasons, paretoReasons, dominantFailureReasons, goalStats, rankedGoals, strongestGoals, categoryStats, dateGroups, loggedDates, totalDaysLogged, perfectDaysCount, currentStreak, weekInfo, weekAvg, weekDailyBreakdown, equalizerDays, densityBars } = analytics;

  // Donut chart status colors and attributes
  const getDonutAttributes = (rate: number) => {
    if (rate >= 90) {
      return {
        text: 'text-emerald-400',
        stroke: '#10b981',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        label: 'Optimal Regulation (≥90%)',
      };
    }
    if (rate >= 70) {
      return {
        text: 'text-amber-400',
        stroke: '#f59e0b',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        label: 'Moderate Execution (70-89%)',
      };
    }
    return {
      text: 'text-rose-400',
      stroke: '#f43f5e',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      label: 'Limbic Friction Detected (<70%)',
    };
  };

  const donutAttr = getDonutAttributes(overallRate);
  const donutSize = 160;
  const donutStrokeWidth = 14;
  const donutRadius = (donutSize - donutStrokeWidth) / 2;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const donutOffset = donutCircumference - (overallRate / 100) * donutCircumference;
  const safeDonutOffset = isFinite(donutOffset) && !isNaN(donutOffset) ? donutOffset : donutCircumference;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Filter Controls */}
      <div className="bg-[#0C101D] rounded-3xl p-5 sm:p-7 border border-white/5 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl  flex items-center justify-center text-indigo-400 shrink-0">
              <i className="ri-bar-chart-grouped-line text-lg shrink-0" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Visual Analysis & Metacognitive Mirror
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium line-clamp-2">
            Biometric execution diagnostics, Pareto friction breakdown, and neuro-architectural error correction.
          </p>
        </div>

        {/* Time Range Selector: >=44x44px touch targets */}
        <div className="flex items-center gap-1.5 bg-[#080C16] p-1.5 rounded-2xl border border-white/5 self-stretch sm:self-auto shadow-inner">
          <button
            onClick={() => {
              nativeHaptics.selection();
              setTimeRange('7');
            }}
            className={`flex-1 sm:flex-initial px-4 py-2.5 min-h-[44px] min-w-[44px] rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 flex items-center justify-center ${
              timeRange === '7'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => {
              nativeHaptics.selection();
              setTimeRange('30');
            }}
            className={`flex-1 sm:flex-initial px-4 py-2.5 min-h-[44px] min-w-[44px] rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 flex items-center justify-center ${
              timeRange === '30'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => {
              nativeHaptics.selection();
              setTimeRange('90');
            }}
            className={`flex-1 sm:flex-initial px-4 py-2.5 min-h-[44px] min-w-[44px] rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 flex items-center justify-center ${
              timeRange === '90'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            90 Days
          </button>
          <button
            onClick={() => {
              nativeHaptics.selection();
              setTimeRange('all');
            }}
            className={`flex-1 sm:flex-initial px-4 py-2.5 min-h-[44px] min-w-[44px] rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 flex items-center justify-center ${
              timeRange === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Top Vitality Metric Strip (Stat Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Consistency Rate */}
        <div className="bg-[#0C101D] rounded-3xl p-4 sm:p-5 border border-white/5 hover:border-white/10 shadow-xl flex flex-col relative group transition-all">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 break-words leading-tight min-h-[32px] sm:min-h-[36px] flex-1">
              Consistency Rate
            </span>
            <div className="w-8 h-8 rounded-xl text-indigo-400 flex items-center justify-center shrink-0 bg-indigo-500/10 -mt-1 -mr-1">
              <i className="ri-arrow-right-up-line text-base" />
            </div>
          </div>
          
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl sm:text-3xl font-bold text-white">{overallRate}%</span>
          </div>
          
          <div className="mt-auto pt-4 flex flex-col items-start gap-1.5">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
              totalEntriesCount === 0
                ? 'bg-slate-800/80 text-slate-400 border border-slate-700/50'
                : overallRate >= 90
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : overallRate >= 70
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              {totalEntriesCount === 0 ? 'Baseline' : overallRate >= 90 ? 'Target Hit' : overallRate >= 70 ? 'Moderate' : 'Under 70%'}
            </span>
            <p className="text-[11px] text-slate-400 font-medium leading-tight">
              {totalEntriesCount === 0
                ? 'No actions logged yet'
                : `${totalCompletedCount} of ${totalEntriesCount} logged actions fulfilled`}
            </p>
          </div>
        </div>

        {/* Metric 2: Current Streak */}
        <div className="bg-[#0C101D] rounded-3xl p-4 sm:p-5 border border-white/5 hover:border-white/10 shadow-xl flex flex-col relative group transition-all">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 break-words leading-tight min-h-[32px] sm:min-h-[36px] flex-1">
              Unbroken Streak
            </span>
            <div className="w-8 h-8 rounded-xl text-amber-400 flex items-center justify-center shrink-0 bg-amber-500/10 -mt-1 -mr-1">
              <i className="ri-fire-line text-base" />
            </div>
          </div>
          
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl sm:text-3xl font-bold text-white">{currentStreak}</span>
            <span className="text-xs font-bold text-slate-400">Days</span>
          </div>
          
          <div className="mt-auto pt-4 flex flex-col items-start gap-1.5">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
              currentStreak > 0
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-800/80 text-slate-400 border border-slate-700/50'
            }`}>
              {currentStreak > 0 ? 'Active' : 'Start Today'}
            </span>
            <p className="text-[11px] text-slate-400 font-medium leading-tight">
              {currentStreak >= 7
                ? 'Compound momentum active'
                : currentStreak > 0
                ? 'Target: 7-day milestone'
                : 'Complete targets to ignite'}
            </p>
          </div>
        </div>

        {/* Metric 3: Perfect 100% Days */}
        <div className="bg-[#0C101D] rounded-3xl p-4 sm:p-5 border border-white/5 hover:border-white/10 shadow-xl flex flex-col relative group transition-all">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 break-words leading-tight min-h-[32px] sm:min-h-[36px] flex-1">
              Perfect 100% Days
            </span>
            <div className="w-8 h-8 rounded-xl text-emerald-400 flex items-center justify-center shrink-0 bg-emerald-500/10 -mt-1 -mr-1">
              <i className="ri-trophy-line text-base" />
            </div>
          </div>
          
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl sm:text-3xl font-bold text-white">{perfectDaysCount}</span>
            <span className="text-xs font-bold text-slate-400">Days</span>
          </div>
          
          <div className="mt-auto pt-4 flex flex-col items-start gap-1.5">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
              perfectDaysCount > 0
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-800/80 text-slate-400 border border-slate-700/50'
            }`}>
              {perfectDaysCount > 0 ? 'Flawless' : 'In Progress'}
            </span>
            <p className="text-[11px] text-slate-400 font-medium leading-tight">
              {perfectDaysCount > 0 ? 'Zero friction target execution' : 'Target: 100% daily score'}
            </p>
          </div>
        </div>

        {/* Metric 4: Logged History */}
        <div className="bg-[#0C101D] rounded-3xl p-4 sm:p-5 border border-white/5 hover:border-white/10 shadow-xl flex flex-col relative group transition-all">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 break-words leading-tight min-h-[32px] sm:min-h-[36px] flex-1">
              Logged History
            </span>
            <div className="w-8 h-8 rounded-xl text-purple-400 flex items-center justify-center shrink-0 bg-purple-500/10 -mt-1 -mr-1">
              <i className="ri-calendar-event-line text-base" />
            </div>
          </div>
          
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl sm:text-3xl font-bold text-white">{totalDaysLogged}</span>
            <span className="text-xs font-bold text-slate-400">Days</span>
          </div>
          
          <div className="mt-auto pt-4 flex flex-col items-start gap-1.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 whitespace-nowrap">
              Lifetime
            </span>
            <p className="text-[11px] text-slate-400 font-medium leading-tight">
              Total days recorded
            </p>
          </div>
        </div>
      </div>

      {/* SVG DONUT CHART & OVERALL COMPLETION SECTION */}
      <div className="bg-[#0C101D] rounded-3xl p-5 sm:p-7 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.04] before:to-transparent before:pointer-events-none transition-all">
        {/* Ambient Corner Glow Orbs */}

        <div className="flex-1 space-y-3 relative z-10">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${donutAttr.bg} ${donutAttr.border} border`} />
            <span className="text-[11px] font-bold text-slate-400">
              Executive Completion Donut
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Overall Execution Rate
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            Clean SVG circular arc measuring total active target compliance across the selected time horizon. Status bands calibrate dopamine anticipation: ≥90% (Emerald/Consolidation), 70-89% (Amber/Maintenance), &lt;70% (Rose/Friction).
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className={`px-3 py-1 rounded-xl text-xs font-bold border ${donutAttr.badge}`}>
              {donutAttr.label}
            </div>
            <div className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-900/80 text-slate-300 border border-slate-800">
              {totalCompletedCount} Completed / {totalMissedCount} Missed
            </div>
          </div>
        </div>

        {/* Clean SVG Donut */}
        <div className="relative flex items-center justify-center shrink-0 p-2">
          <svg
            width={donutSize}
            height={donutSize}
            viewBox={`0 0 ${donutSize} ${donutSize}`}
            className="transform -rotate-90 shrink-0"
          >
            {/* Background Track Circle */}
            <circle
              cx={donutSize / 2}
              cy={donutSize / 2}
              r={donutRadius}
              stroke="#1e293b"
              strokeWidth={donutStrokeWidth}
              fill="none"
            />
            {/* Value Track Circle */}
            <circle
              cx={donutSize / 2}
              cy={donutSize / 2}
              r={donutRadius}
              stroke={donutAttr.stroke}
              strokeWidth={donutStrokeWidth}
              strokeDasharray={donutCircumference}
              strokeDashoffset={safeDonutOffset}
              strokeLinecap="round"
              fill="none"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className={`text-3xl font-bold ${donutAttr.text} tracking-tight`}>
              {isNaN(overallRate) || !isFinite(overallRate) ? 0 : overallRate}%
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              Completed
            </span>
          </div>
        </div>
      </div>


      {/* PARETO FAILURE REASONS BREAKDOWN SECTION */}
      <div className="bg-[#0C101D] rounded-3xl p-5 sm:p-7 border border-white/5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-[11px] font-bold text-rose-400">
                Pareto Failure Diagnostics
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
              Missed Execution Root-Cause Breakdown
            </h3>
            <p className="text-xs text-slate-400">
              Sorted from most frequent to least frequent with cumulative impact progression. Fix the top 20% friction points to unlock 80% momentum.
            </p>
          </div>

          <div className="px-3.5 py-1.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold self-start sm:self-auto">
            {totalMissedCount} Total Misses Logged
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 py-2.5 px-4 bg-[#080C16] rounded-2xl border border-white/5 text-xs">
          <div className="inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 shrink-0" />
            <span className="font-semibold text-slate-200">Failure Frequency</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
            <span className="font-semibold text-slate-200">Cumulative Impact</span>
          </div>
        </div>

        {paretoReasons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {paretoReasons.map((item, idx) => (
              <div
                key={item.reason}
                className="p-4 bg-[#080C16] rounded-2xl border border-white/5 flex flex-col justify-between hover:border-white/[0.15] transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-lg bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center shrink-0 border border-rose-500/30">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-white truncate">{item.reason}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-slate-400">{item.count} occurrences</span>
                    <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {item.percentage}%
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Cumul. {item.cumulativePercentage}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-900 rounded-full mt-3 overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-600 to-amber-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-[#080C16] rounded-2xl border border-white/[0.06]">
            <i className="ri-trophy-line text-3xl text-emerald-400 mx-auto mb-2 block" />
            <h4 className="text-sm font-bold text-white">Zero Misses Recorded</h4>
            <p className="text-xs text-slate-400 mt-1">
              You have maintained 100% execution across all logged targets in this time window!
            </p>
          </div>
        )}
      </div>

      {/* HORIZONTAL GOAL RANKINGS BAR CHART & CATEGORY BREAKDOWN MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Horizontal Goal Rankings Bar Chart */}
        <div className="bg-[#0C101D] rounded-3xl p-5 sm:p-7 border border-white/5 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <i className="ri-bar-chart-horizontal-line text-emerald-400 text-lg shrink-0" />
              <h4 className="text-base font-bold text-white">
                Goal Consistency Rankings
              </h4>
            </div>
            <span className="px-2 py-1 bg-slate-800/60 border border-slate-700/50 rounded-lg text-[11px] font-bold text-slate-400 whitespace-nowrap">
              {rankedGoals.length} Ranked
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {rankedGoals.map((item, idx) => {
              let barColor = 'bg-rose-500';
              if (item.rate >= 90) {
                barColor = 'bg-emerald-400';
              } else if (item.rate >= 70) {
                barColor = 'bg-amber-400';
              }

              return (
                <div
                  key={item.goal.id}
                  className="p-3.5 bg-[#080C16] rounded-2xl border border-white/5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <p className="text-xs font-bold text-white truncate">{item.goal.name}</p>
                      <span className="text-[11px] text-slate-400 font-medium shrink-0">
                        ({item.completed}/{item.total})
                      </span>
                    </div>

                    <span className="text-xs font-bold text-white shrink-0">
                      {item.rate}%
                    </span>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full ${barColor} transition-all duration-500`}
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {rankedGoals.length === 0 && (
              <p className="text-xs text-slate-400 p-4 text-center">No recorded goal logs yet.</p>
            )}
          </div>
        </div>

        {/* Category Breakdown Matrix */}
        <div className="bg-[#0C101D] rounded-3xl p-5 sm:p-7 border border-white/5 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <i className="ri-stack-line text-indigo-400 text-lg shrink-0" />
              <h4 className="text-base font-bold text-white">
                Category Breakdown Matrix
              </h4>
            </div>
            <span className="px-2 py-1 bg-slate-800/60 border border-slate-700/50 rounded-lg text-[11px] font-bold text-slate-400 whitespace-nowrap">
              {categoryStats.length} Pillars
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {categoryStats.map((cat) => (
              <div
                key={cat.category}
                className="p-3.5 bg-[#080C16] rounded-2xl border border-white/5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${cat.theme.badge}`}>
                    {cat.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {cat.completedLogs}/{cat.totalLogs} done
                    </span>
                    <span className="text-xs font-bold text-white">{cat.rate}%</span>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full ${
                      cat.rate >= 90
                        ? 'bg-emerald-400'
                        : cat.rate >= 70
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                    style={{ width: `${Math.min(cat.rate, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>



      {/* ADDITIONAL HIGH-DENSITY CHARTS (Equalizer & 14-Day Momentum Wave) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Flow Matrix */}
        <div className="lg:col-span-6 bg-[#0C101D] rounded-3xl p-5 sm:p-7 border border-white/5 shadow-2xl flex flex-col relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-bold text-slate-400">
                  Weekly Flow Matrix
                </span>
              </div>
              <div className="flex flex-wrap items-baseline gap-2 mt-2">
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {weekAvg}%
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 whitespace-nowrap">
                  ↑ Target Hit
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium line-clamp-2">
                Daily segmented stages for current week ({formatShortDate(weekInfo.startDate)} – {formatShortDate(weekInfo.endDate)}).
              </p>
            </div>
            <div className="w-9 h-9 rounded-2xl  text-emerald-400 flex items-center justify-center shrink-0">
              <i className="ri-bar-chart-2-line text-lg" />
            </div>
          </div>

          <div className="mt-auto space-y-3 pt-6">
            {weekInfo.days.map((dayStr) => {
              const dayScore = weekDailyBreakdown[dayStr] || 0;
              const hasData = dailyLogs.some((l) => l.date === dayStr);
              const isToday = dayStr === currentDate;
              const [y, m, d] = dayStr.split('-').map(Number);
              const dateObj = new Date(y, m - 1, d);
              const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

              const totalSlots = 8;
              const activeSlots = hasData ? Math.round((dayScore / 100) * totalSlots) : 0;

              return (
                <div
                  key={dayStr}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl transition-all border ${
                    isToday
                      ? 'bg-slate-900/90 border-indigo-500/40 shadow-md shadow-indigo-950/20'
                      : 'bg-[#080C16] border-white/[0.06] hover:bg-[#0B0F1B]'
                  }`}
                >
                  <span className={`w-9 text-xs font-bold shrink-0 ${isToday ? 'text-indigo-400' : 'text-slate-400'}`}>
                    {dayLabel}
                  </span>

                  <div className="flex-1 grid grid-cols-8 gap-1.5 h-4 items-center">
                    {Array.from({ length: totalSlots }).map((_, slotIdx) => {
                      const isSlotFilled = slotIdx < activeSlots;
                      const isPerfect = dayScore === 100;

                      let pillClass = 'bg-slate-800/60 border border-slate-700/40';
                      if (isSlotFilled) {
                        if (isPerfect) {
                          pillClass =
                            'bg-gradient-to-r from-emerald-400 to-teal-300 border border-emerald-300';
                        } else if (dayScore >= 70) {
                          pillClass =
                            'bg-gradient-to-r from-emerald-500 to-emerald-400 border border-emerald-400/50';
                        } else {
                          pillClass =
                            'bg-gradient-to-r from-rose-500 to-amber-500 border border-rose-400/50';
                        }
                      }

                      return (
                        <div
                          key={slotIdx}
                          className={`h-full rounded-full transition-all duration-300 ${pillClass}`}
                        />
                      );
                    })}
                  </div>

                  <span className={`text-xs font-bold w-11 text-right shrink-0 ${hasData ? (dayScore >= 90 ? 'text-emerald-400' : dayScore >= 70 ? 'text-amber-400' : 'text-rose-400') : 'text-slate-600'}`}>
                    {hasData ? `${dayScore}%` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Neon Equalizer */}
        <div className="lg:col-span-6 bg-[#0C101D] rounded-3xl p-5 sm:p-7 border border-white/5 shadow-2xl flex flex-col relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span className="text-[11px] font-bold text-slate-400">
                  Consistency Intensity
                </span>
              </div>
              <div className="flex flex-wrap items-baseline gap-2 mt-2">
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  8
                </h3>
                <span className="text-xs font-bold text-slate-300">
                  Day Rhythm
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 whitespace-nowrap ml-1">
                  ↑ Equalizer
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium line-clamp-2">
                Vertical multi-stage execution equalizer with stacked glowing pill nodes.
              </p>
            </div>
            <div className="w-9 h-9 rounded-2xl  text-cyan-400 flex items-center justify-center shrink-0">
              <i className="ri-sound-module-line text-lg" />
            </div>
          </div>

          <div className="mt-auto pt-8 pb-2">
            <div className="grid grid-cols-8 gap-2 sm:gap-3 items-end h-56 sm:h-60 bg-[#080C16] rounded-3xl p-3 sm:p-4 border border-white/[0.06] shadow-inner">
              {equalizerDays.map((col) => {
                const totalPills = 6;
                const filledPills = col.score > 0 ? Math.max(1, Math.round((col.score / 100) * totalPills)) : 0;
                const isHovered = activeSegmentHover === col.dateStr;

                return (
                  <div
                    key={col.dateStr}
                    onMouseEnter={() => setActiveSegmentHover(col.dateStr)}
                    onMouseLeave={() => setActiveSegmentHover(null)}
                    className="flex flex-col items-center justify-end h-full gap-1.5 cursor-pointer group"
                  >
                    <div className="flex flex-col-reverse items-center justify-start gap-1.5 w-full max-w-[28px] h-44 sm:h-48 py-1">
                      {Array.from({ length: totalPills }).map((_, pillIdx) => {
                        const isLit = pillIdx < filledPills;
                        let glowStyle = 'bg-slate-900 border border-slate-800/80 opacity-40';

                        if (isLit) {
                          if (pillIdx >= 4) {
                            glowStyle =
                              'bg-emerald-400 border border-emerald-300';
                          } else if (pillIdx >= 2) {
                            glowStyle =
                              'bg-cyan-400 border border-cyan-300';
                          } else {
                            glowStyle =
                              'bg-pink-500 border border-pink-400';
                          }
                        }

                        return (
                          <div
                            key={pillIdx}
                            className={`w-full h-4 sm:h-4.5 rounded-full transition-all duration-300 ${glowStyle} ${
                              isHovered ? 'scale-105 brightness-125' : ''
                            }`}
                          />
                        );
                      })}
                    </div>

                    <span className={`text-[11px] font-bold mt-1 block whitespace-nowrap transition-colors ${
                      col.label === 'Today' ? 'text-cyan-400' : 'text-slate-400'
                    }`}>
                      {col.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 14-Day Momentum Wave */}
        <div className="lg:col-span-12 bg-[#0C101D] rounded-3xl p-5 sm:p-7 border border-white/5 shadow-2xl flex flex-col relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-bold text-slate-400">
                  14-Day Momentum Wave
                </span>
              </div>
              <div className="flex flex-wrap items-baseline gap-2 mt-2">
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {totalDaysLogged}
                </h3>
                <span className="text-xs font-bold text-slate-300">
                  Active Days
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 whitespace-nowrap ml-1">
                  ↑ Consistent
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium line-clamp-2">
                High-frequency pulse bars with ambient bottom glow reflections.
              </p>
            </div>
            <div className="w-9 h-9 rounded-2xl  text-emerald-400 flex items-center justify-center shrink-0">
              <i className="ri-pulse-line text-lg" />
            </div>
          </div>

          <div className="mt-auto pt-8 relative">
            <div className="grid grid-cols-14 gap-1 sm:gap-2 items-end h-52 sm:h-56 bg-[#080C16] rounded-3xl p-3 sm:p-4 border border-white/[0.06] shadow-inner">
              {densityBars.map((bar) => {
                let barGradient = 'bg-slate-800/60';
                if (bar.score >= 90) {
                  barGradient = 'bg-gradient-to-t from-emerald-600 via-emerald-400 to-teal-300';
                } else if (bar.score >= 70) {
                  barGradient = 'bg-gradient-to-t from-amber-600 via-amber-400 to-yellow-300';
                } else if (bar.score > 0) {
                  barGradient = 'bg-gradient-to-t from-rose-600 via-rose-400 to-pink-300';
                }

                return (
                  <div key={bar.dateStr} className="flex flex-col items-center justify-end h-full gap-1 group">
                    <div className="w-full rounded-full bg-slate-900/80 p-0.5 h-36 sm:h-40 flex items-end border border-slate-800/80">
                      <div
                        className={`w-full rounded-full transition-all duration-500 ${barGradient} group-hover:brightness-125`}
                        style={{ height: `${Math.max(0, Math.min(100, isNaN(bar.heightPercent) ? 6 : bar.heightPercent))}%` }}
                      />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 group-hover:text-slate-200 transition-colors">
                      {bar.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
