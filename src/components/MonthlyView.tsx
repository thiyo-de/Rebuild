import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import { MonthlyReward, RewardType, Goal, DailyLogEntry, AppSettings } from '../types';
import { getMonthInfo, getWeekInfo, formatShortDate } from '../utils/dateUtils';
import { calculateMonthScore, calculateWeekScore } from '../services/storage';
import { CustomSelect } from './CustomSelect';
import { triggerHaptic } from '../services/native';

interface MonthlyViewProps {
  currentDate: string;
  goals: Goal[];
  dailyLogs: DailyLogEntry[];
  monthlyRewards: MonthlyReward[];
  settings: AppSettings;
  onSaveMonthlyReward: (reward: MonthlyReward) => void;
  onClaimMonthlyReward: (rewardId: string) => void;
}

// Helper for monthly reward type icons
const getRewardTypeIcon = (type?: RewardType): string => {
  switch (type) {
    case 'Experience': return 'compass-3-line';
    case 'Technology': return 'macbook-line';
    case 'Shopping': return 'shopping-bag-3-line';
    case 'Food': return 'restaurant-2-line';
    case 'Gaming': return 'gamepad-line';
    case 'Entertainment': return 'music-2-line';
    case 'Personal': return 'user-star-line';
    default: return 'trophy-line';
  }
};

export const MonthlyView: React.FC<MonthlyViewProps> = ({
  currentDate,
  goals,
  dailyLogs,
  monthlyRewards,
  settings,
  onSaveMonthlyReward,
  onClaimMonthlyReward,
}) => {
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);

  // Compute targeted month
  const [y, m] = currentDate.split('-').map(Number);
  const offsetDateObj = new Date(y, m - 1 + selectedMonthOffset, 1);
  const monthInfo = getMonthInfo(
    `${offsetDateObj.getFullYear()}-${String(offsetDateObj.getMonth() + 1).padStart(2, '0')}-01`
  );

  // Calculate monthly performance across all days in month
  const monthScoreData = calculateMonthScore(monthInfo.days, goals, dailyLogs);
  const monthlyScore = monthScoreData.score;

  // Breakdown 4-week progression — build weeks from month days using weekStartDay
  const seenWeekIds = new Set<string>();
  const weekBreakdowns: { weekIndex: number; label: string; score: number; recordedDays: number }[] = [];
  monthInfo.days.forEach((dayStr) => {
    const wInfo = getWeekInfo(dayStr, settings.weekStartDay);
    if (!seenWeekIds.has(wInfo.weekId)) {
      seenWeekIds.add(wInfo.weekId);
      const wsData = calculateWeekScore(wInfo.days, goals, dailyLogs);
      weekBreakdowns.push({
        weekIndex: weekBreakdowns.length,
        label: `Week ${weekBreakdowns.length + 1}`,
        score: wsData.score,
        recordedDays: wsData.recordedDaysCount,
      });
    }
  });

  // Find or create current month's reward
  const existingReward = monthlyRewards.find((mr) => mr.monthId === monthInfo.monthId);

  // Form state
  const [rewardName, setRewardName] = useState(existingReward?.rewardName || '');
  const [rewardType, setRewardType] = useState<RewardType>(existingReward?.rewardType || 'Experience');
  const [budget, setBudget] = useState<number>(existingReward?.budget || 2000);

  const requiredThreshold = existingReward?.requiredScore || settings.monthlyRewardThreshold;
  const isUnlocked = monthlyScore >= requiredThreshold && monthScoreData.recordedDaysCount >= 10;
  const isClaimed = existingReward?.isClaimed || false;

  const handleOpenRewardModal = () => {
    triggerHaptic('light');
    setRewardName(existingReward?.rewardName || '');
    setRewardType(existingReward?.rewardType || 'Experience');
    setBudget(existingReward?.budget || 2000);
    setIsRewardModalOpen(true);
  };

  const handleSaveReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardName.trim()) return;
    triggerHaptic('success');

    const newReward: MonthlyReward = {
      id: existingReward?.id || `m_reward_${monthInfo.monthId}`,
      monthId: monthInfo.monthId,
      monthName: monthInfo.monthName,
      year: monthInfo.year,
      rewardName: rewardName.trim(),
      rewardType,
      budget: Number(budget) || 0,
      actualSpend: existingReward?.actualSpend || 0,
      currency: settings.currency,
      requiredScore: settings.monthlyRewardThreshold,
      isClaimed: existingReward?.isClaimed || false,
      claimedAt: existingReward?.claimedAt,
    };

    onSaveMonthlyReward(newReward);
    setIsRewardModalOpen(false);
  };

  const handleClaim = () => {
    if (!existingReward) return;
    triggerHaptic('success');
    onClaimMonthlyReward(existingReward.id);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Month Selector Bar */}
      <div className="flex items-center justify-between bg-[#0C101D] p-3 sm:p-5 rounded-3xl border border-white/[0.08] shadow-xl">
        <button
          onClick={() => {
            triggerHaptic('light');
            setSelectedMonthOffset((prev) => prev - 1);
          }}
          className="flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          title="Previous Month"
        >
          <i className="ri-arrow-left-s-line text-base shrink-0" />
          <span className="hidden sm:inline whitespace-nowrap">Previous Month</span>
          <span className="sm:hidden whitespace-nowrap">Prev</span>
        </button>

        <div className="text-center min-w-0 px-2 flex-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block truncate">
            Monthly Review & Milestones
          </span>
          <h2 className="text-base sm:text-lg font-bold text-white truncate">
            {monthInfo.monthName} {monthInfo.year}
          </h2>
          <div className="text-[11px] text-slate-400 font-medium">
            {monthInfo.days.length} Days Total
            {selectedMonthOffset !== 0 && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedMonthOffset(0);
                }}
                className="text-[11px] font-bold text-indigo-400 hover:underline mt-0.5 cursor-pointer inline-block whitespace-nowrap ml-1.5"
              >
                (Return to Current Month)
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            triggerHaptic('light');
            setSelectedMonthOffset((prev) => prev + 1);
          }}
          className="flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          title="Next Month"
        >
          <span className="hidden sm:inline whitespace-nowrap">Next Month</span>
          <span className="sm:hidden whitespace-nowrap">Next</span>
          <i className="ri-arrow-right-s-line text-base shrink-0" />
        </button>
      </div>

      {/* Month Performance & Trophy Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Month Summary Stat Card */}
        <div className="bg-[#0C101D] rounded-3xl p-5 sm:p-6 border border-white/[0.08] shadow-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 block">
              30-Day Consistency Rate
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-bold text-white tracking-tight whitespace-nowrap">
                {monthlyScore}%
              </span>
              <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
                target: ≥ {settings.monthlyRewardThreshold}%
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {monthScoreData.recordedDaysCount} of {monthInfo.days.length} days logged
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-300">Status:</span>
            <span
              className={`px-3 py-1 rounded-full whitespace-nowrap font-bold ${
                isUnlocked
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800/80 text-slate-400 border border-slate-700/80'
              }`}
            >
              {isUnlocked ? 'Unlocked' : `Need ≥ ${settings.monthlyRewardThreshold}% (10+ days)`}
            </span>
          </div>
        </div>

        {/* Monthly Reward Banner */}
        <div
          className={`md:col-span-2 rounded-3xl p-5 sm:p-6 border shadow-2xl relative overflow-hidden flex flex-col justify-between backdrop-blur-2xl transition-all duration-300 ${
            isClaimed
              ? 'bg-[#0C101D] border-emerald-500/30 shadow-[0_0_35px_-5px_rgba(16,185,129,0.15)]'
              : isUnlocked
              ? 'bg-[#0C101D] border-indigo-500/40 shadow-[0_0_40px_-5px_rgba(99,102,241,0.25)]'
              : 'bg-[#0C101D] border-indigo-500/25 shadow-[0_0_30px_-5px_rgba(99,102,241,0.1)]'
          }`}
        >
          {/* Ambient Blurred Glows */}
          <div
            className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-[90px] pointer-events-none transition-all duration-500 ${
              isClaimed ? 'bg-emerald-500/15' : isUnlocked ? 'bg-indigo-500/20' : 'bg-indigo-500/10'
            }`}
          />
          <div
            className={`absolute -bottom-24 -left-24 w-60 h-60 rounded-full blur-[90px] pointer-events-none transition-all duration-500 ${
              isClaimed ? 'bg-teal-500/15' : isUnlocked ? 'bg-purple-600/20' : 'bg-purple-600/10'
            }`}
          />

          <div className="relative z-10">
            {/* Header: Badges & Status */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 rounded-xl shadow-xs">
                  <i className="ri-calendar-line text-indigo-400 text-sm shrink-0" />
                  <span>Monthly Vault</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/5">
                  <i className="ri-medal-line text-xs text-indigo-400 shrink-0" />
                  <span>Major Milestone</span>
                </span>
              </div>

              {/* Status Pill */}
              <div>
                {isClaimed ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                    <i className="ri-checkbox-circle-line text-sm shrink-0" /> Claimed
                  </span>
                ) : isUnlocked ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-bold animate-pulse">
                    <i className="ri-lock-unlock-line text-sm shrink-0" /> Unlocked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-400 text-xs font-bold">
                    <i className="ri-lock-line text-sm shrink-0 text-indigo-400/80" /> Locked
                  </span>
                )}
              </div>
            </div>

            {/* Reward Card Body: Defined vs Empty State */}
            {existingReward ? (
              <div className="flex items-start sm:items-center gap-4 p-4 rounded-2xl bg-[#080C16] border border-white/[0.08] shadow-inner mt-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-md">
                  <i className={`ri-${getRewardTypeIcon(existingReward.rewardType)} text-2xl`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-xl font-bold text-white break-words">
                    {existingReward.rewardName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-white/[0.04] border border-white/5 text-slate-300">
                      {existingReward.rewardType}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                      Budget: {settings.currency}{existingReward.budget}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4.5 rounded-2xl bg-[#080C16] border border-white/[0.08] shadow-inner mt-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-md">
                  <i className="ri-trophy-line text-2xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    No Monthly Reward Defined
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Set a major monthly trophy (gadget, trip, gear) to reward yourself for 30 days of consistent discipline.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer & Action Buttons */}
          <div className="mt-5 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
            <p className="text-xs text-slate-400">
              {existingReward && isUnlocked && !isClaimed
                ? 'Monthly standard achieved! Claim your major monthly reward.'
                : !existingReward
                ? 'Define your monthly trophy at the start of the month.'
                : 'A month of 90%+ consistency builds permanent habits.'}
            </p>

            <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
              {existingReward && isUnlocked && !isClaimed && (
                <button
                  onClick={handleClaim}
                  className="flex-1 sm:flex-initial min-h-[44px] px-5 py-2.5 text-xs font-bold text-slate-950 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm rounded-xl shadow-lg transition-all cursor-pointer whitespace-nowrap text-center active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <i className="ri-gift-line text-sm" /> Claim monthly reward
                </button>
              )}

              <button
                onClick={handleOpenRewardModal}
                className={`flex-1 sm:flex-initial min-h-[44px] px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap text-center active:scale-95 flex items-center justify-center gap-1.5 ${
                  !existingReward
                    ? 'text-white bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-md'
                    : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/10'
                }`}
              >
                {existingReward ? (
                  <>
                    <i className="ri-edit-line text-xs shrink-0" /> Edit reward
                  </>
                ) : (
                  <>
                    <i className="ri-add-line text-sm shrink-0" /> Define monthly reward
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Week Matrix */}
      <div className="bg-[#0C101D] rounded-3xl p-6 border border-white/[0.08] shadow-2xl">
        <h3 className="text-sm font-bold text-slate-400 mb-4">
          4-Week Progression Matrix ({monthInfo.monthName})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {weekBreakdowns.map((wb) => (
            <div
              key={wb.weekIndex}
              className="p-5 rounded-2xl border border-white/[0.08] bg-[#080C16] text-center"
            >
              <span className="text-xs font-bold text-slate-400 uppercase block mb-1 whitespace-nowrap">
                {wb.label}
              </span>
              <div
                className={`text-3xl font-bold whitespace-nowrap ${
                  wb.score >= 90
                    ? 'text-emerald-400'
                    : wb.score >= 70
                    ? 'text-amber-400'
                    : wb.score > 0
                    ? 'text-rose-400'
                    : 'text-slate-500'
                }`}
              >
                {wb.score > 0 ? `${wb.score}%` : '—'}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block whitespace-nowrap">
                {wb.recordedDays > 0 ? `${wb.recordedDays} days logged` : 'No logs recorded'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Reward Bottom Sheet */}
      {isRewardModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Define ${monthInfo.monthName} Monthly Reward`}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsRewardModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-[#0C101D] border-t border-white/10 shadow-2xl rounded-3xl flex flex-col max-h-[85vh] overflow-hidden text-white animate-in zoom-in-95 duration-150"
          >
            {/* Pinned Header */}
            <div className="shrink-0 p-5 sm:p-6 pb-3.5 border-b border-white/[0.08] relative z-10 bg-gradient-to-b from-white/[0.04] to-transparent">

              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-md">
                      Citadel Trophy
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white break-words">
                    Define {monthInfo.monthName} Monthly Reward
                  </h3>
                </div>
                <button
                  onClick={() => setIsRewardModalOpen(false)}
                  aria-label="Close monthly reward dialog"
                  className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-white/10 active:scale-95 cursor-pointer shrink-0 transition-all"
                >
                  <i className="ri-close-line text-xl shrink-0" />
                </button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <form id="monthly-reward-form" onSubmit={handleSaveReward} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 relative z-10 pb-12 sm:pb-16">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                  Monthly Reward / Milestone Prize *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekend Getaway, Noise Cancelling Headphones"
                  value={rewardName}
                  autoCapitalize="sentences"
                  spellCheck={false}
                  onChange={(e) => setRewardName(e.target.value)}
                  className="w-full min-h-[48px] px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-[#080C16] border border-white/10 focus:border-indigo-500/50 outline-none text-white placeholder-slate-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                    Type
                  </label>
                  <CustomSelect
                    value={rewardType}
                    onChange={(val) => setRewardType(val as RewardType)}
                    options={['Experience', 'Technology', 'Shopping', 'Food', 'Gaming', 'Entertainment', 'Personal', 'Other']}
                    ariaLabel="Monthly Reward Type"
                    relativePopup={true}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                    Budget ({settings.currency})
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="0"
                    step="100"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full min-h-[48px] px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-[#080C16] border border-white/10 focus:border-indigo-500/50 outline-none text-white placeholder-slate-500 transition-all"
                  />
                </div>
              </div>
            </form>

            {/* Pinned Sticky Footer */}
            <div className="shrink-0 p-4 sm:p-5 pt-3 border-t border-white/[0.08] bg-slate-950/60 backdrop-blur-2xl pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] flex items-center gap-3 relative z-10">
              <button
                type="button"
                onClick={() => setIsRewardModalOpen(false)}
                className="flex-1 min-h-[48px] px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 rounded-xl cursor-pointer whitespace-nowrap transition-all active:scale-95 text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="monthly-reward-form"
                className="flex-1 min-h-[48px] px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm rounded-xl cursor-pointer whitespace-nowrap active:scale-95 text-center"
              >
                Lock reward
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
