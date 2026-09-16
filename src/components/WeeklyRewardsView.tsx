import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import { WeeklyReward, RewardType, Goal, DailyLogEntry, AppSettings } from '../types';
import { getWeekInfo, formatWeekRange, formatShortDate, getDayOfWeekName } from '../utils/dateUtils';
import { calculateWeekScore, calculateDayScore } from '../services/storage';
import { CustomSelect } from './CustomSelect';
import { triggerHaptic } from '../services/native';

interface WeeklyRewardsViewProps {
  currentDate: string;
  goals: Goal[];
  dailyLogs: DailyLogEntry[];
  weeklyRewards: WeeklyReward[];
  settings: AppSettings;
  onSaveWeeklyReward: (reward: WeeklyReward) => void;
  onClaimWeeklyReward: (rewardId: string, actualSpend: number) => void;
}

// Helper for reward type icons
const getRewardTypeIcon = (type?: RewardType): string => {
  switch (type) {
    case 'Food': return 'restaurant-2-line';
    case 'Movie': return 'movie-2-line';
    case 'Gaming': return 'gamepad-line';
    case 'Shopping': return 'shopping-bag-3-line';
    case 'Entertainment': return 'music-2-line';
    case 'Experience': return 'compass-3-line';
    case 'Technology': return 'macbook-line';
    case 'Personal': return 'user-star-line';
    default: return 'trophy-line';
  }
};

export const WeeklyRewardsView: React.FC<WeeklyRewardsViewProps> = ({
  currentDate,
  goals,
  dailyLogs,
  weeklyRewards,
  settings,
  onSaveWeeklyReward,
  onClaimWeeklyReward,
}) => {
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [claimSpendInput, setClaimSpendInput] = useState<number>(0);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  // Compute targeted week based on offset
  const [y, m, d] = currentDate.split('-').map(Number);
  const offsetDateObj = new Date(y, m - 1, d + selectedWeekOffset * 7);
  const offsetDateStr = `${offsetDateObj.getFullYear()}-${String(offsetDateObj.getMonth() + 1).padStart(2, '0')}-${String(offsetDateObj.getDate()).padStart(2, '0')}`;
  const weekInfo = getWeekInfo(offsetDateStr, settings.weekStartDay);

  // Calculate week performance
  const weekScoreData = calculateWeekScore(weekInfo.days, goals, dailyLogs);
  const weekScore = weekScoreData.score;

  // Find or create current week's reward
  const existingReward = weeklyRewards.find((w) => w.weekId === weekInfo.weekId);

  // Reward Form state
  const [rewardName, setRewardName] = useState(existingReward?.rewardName || '');
  const [rewardType, setRewardType] = useState<RewardType>(existingReward?.rewardType || 'Food');
  const [budget, setBudget] = useState<number>(existingReward?.budget || 500);

  const [formError, setFormError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const requiredThreshold = existingReward?.requiredScore || settings.weeklyRewardThreshold;
  const isUnlocked = weekScore >= requiredThreshold && weekScoreData.recordedDaysCount >= 3;
  const isClaimed = existingReward?.isClaimed || false;

  // Compute Total monthly reward spending
  const currentMonthId = `${weekInfo.year}-${String(offsetDateObj.getMonth() + 1).padStart(2, '0')}`;
  const totalMonthlySpend = weeklyRewards
    .filter((w) => w.isClaimed && w.startDate.startsWith(currentMonthId))
    .reduce((acc, curr) => acc + (curr.actualSpend || 0), 0);

  const handleOpenRewardModal = () => {
    triggerHaptic('light');
    setFormError('');
    setRewardName(existingReward?.rewardName || '');
    setRewardType(existingReward?.rewardType || 'Food');
    setBudget(existingReward?.budget || 500);
    setIsRewardModalOpen(true);
  };

  const handleSaveReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardName.trim()) {
      setFormError('Name is required.');
      triggerHaptic('error');
      return;
    }
    setFormError('');
    triggerHaptic('success');

    const newReward: WeeklyReward = {
      id: existingReward?.id || `w_reward_${weekInfo.weekId}`,
      weekId: weekInfo.weekId,
      weekNumber: weekInfo.weekNumber,
      year: weekInfo.year,
      startDate: weekInfo.startDate,
      endDate: weekInfo.endDate,
      rewardName: rewardName.trim(),
      rewardType,
      budget: Number(budget) || 0,
      actualSpend: existingReward?.actualSpend || 0,
      currency: settings.currency,
      requiredScore: settings.weeklyRewardThreshold,
      isConfigLocked: true,
      isClaimed: existingReward?.isClaimed || false,
      claimedAt: existingReward?.claimedAt,
    };

    onSaveWeeklyReward(newReward);
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    
    setIsRewardModalOpen(false);
  };

  const handleClaim = () => {
    if (!existingReward) return;
    triggerHaptic('success');
    onClaimWeeklyReward(existingReward.id, Number(claimSpendInput) || existingReward.budget);
    setIsClaimModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {saveSuccess && (
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[100] flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-slate-950 rounded-2xl shadow-xl text-xs sm:text-sm font-bold animate-in slide-in-from-right-4 duration-200">
          <i className="ri-checkbox-circle-line text-lg" />
          <span>Saved successfully</span>
        </div>
      )}
      {/* Week Navigator */}
      <div className="flex items-center justify-between bg-[#0C101D] p-3 rounded-2xl border border-white/[0.08] shadow-xl">
        <button
          onClick={() => {
            triggerHaptic('light');
            setSelectedWeekOffset((prev) => prev - 1);
          }}
          className="flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          <i className="ri-arrow-left-s-line text-base shrink-0" />
          <span className="hidden sm:inline whitespace-nowrap">Previous Week</span>
          <span className="sm:hidden whitespace-nowrap">Prev</span>
        </button>

        <div className="text-center min-w-0 px-2">
          <div className="flex items-center justify-center gap-1.5">
            <span className="font-bold text-sm sm:text-base text-white truncate">
              <span className="whitespace-nowrap">Week {weekInfo.weekNumber}</span>
              <span className="text-xs sm:text-sm font-medium text-slate-400 whitespace-nowrap"> ({weekInfo.year})</span>
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            {formatWeekRange(weekInfo.startDate, weekInfo.endDate)}
            {selectedWeekOffset !== 0 && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedWeekOffset(0);
                }}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline mt-0.5 cursor-pointer inline-block whitespace-nowrap"
              >
                (Return to Current Week)
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            triggerHaptic('light');
            setSelectedWeekOffset((prev) => prev + 1);
          }}
          className="flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          <span className="hidden sm:inline whitespace-nowrap">Next Week</span>
          <span className="sm:hidden whitespace-nowrap">Next</span>
          <i className="ri-arrow-right-s-line text-base shrink-0" />
        </button>
      </div>

      {/* Week Performance & Vault Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Week Summary Stat Card */}
        <div className="bg-[#0C101D] rounded-3xl p-5 sm:p-6 border border-white/[0.08] shadow-2xl flex flex-col justify-between relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 block">
              7-Day Consistency Rate
            </span>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="text-4xl font-bold text-white tracking-tight whitespace-nowrap">
                {weekScore}%
              </span>
              <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
                target: ≥ {settings.weeklyRewardThreshold}%
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed line-clamp-2">
              {weekScoreData.recordedDaysCount} of 7 days logged
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-300">Threshold Status:</span>
            <span
              className={`px-3 py-1 rounded-full whitespace-nowrap backdrop-blur-md font-bold ${
                isUnlocked
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800/80 text-slate-400 border border-slate-700/80'
              }`}
            >
              {isUnlocked ? 'Unlocked' : `Need ≥ ${settings.weeklyRewardThreshold}%`}
            </span>
          </div>
        </div>

        {/* Reward Vault Highlight */}
        <div className="md:col-span-2 rounded-3xl p-5 sm:p-6 border shadow-2xl relative flex flex-col justify-between backdrop-blur-2xl transition-all duration-300 bg-[#0C101D] border-white/5">
          <div className="relative z-10">
            {/* Header: Badges & Status */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-xl shadow-xs">
                  <i className="ri-trophy-line text-amber-400 text-sm shrink-0" />
                  <span>Weekly Vault</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/5">
                  <i className="ri-shield-star-line text-xs text-amber-400 shrink-0" />
                  <span>Dopamine Stakes</span>
                </span>
              </div>

              {/* Status Pill */}
              <div>
                {isClaimed ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                    <i className="ri-checkbox-circle-line text-sm shrink-0" /> Claimed
                  </span>
                ) : isUnlocked ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold animate-pulse">
                    <i className="ri-lock-unlock-line text-sm shrink-0" /> Unlocked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-400 text-xs font-bold">
                    <i className="ri-lock-line text-sm shrink-0 text-amber-400/80" /> Locked
                  </span>
                )}
              </div>
            </div>

            {/* Reward Card Body: Defined vs Empty State */}
            {existingReward ? (
              <div className="flex items-start sm:items-center gap-4 p-4 rounded-2xl bg-[#080C16] border border-white/[0.08] shadow-inner mt-4">
                <div className="w-12 h-12 rounded-2xl bg-transparent text-amber-400 flex items-center justify-center shrink-0 shadow-md">
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
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-300">
                      Budget: {settings.currency}{existingReward.budget}
                    </span>
                    {existingReward.actualSpend > 0 && (
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                        Spent: {settings.currency}{existingReward.actualSpend}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4.5 rounded-2xl bg-[#080C16] border border-white/[0.08] shadow-inner mt-4">
                <div className="w-12 h-12 rounded-2xl bg-transparent text-amber-400 flex items-center justify-center shrink-0 shadow-md">
                  <i className="ri-trophy-line text-2xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    No Weekly Reward Defined
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                    Attach a tangible dopamine prize to unlock upon hitting your ≥{requiredThreshold}% weekly consistency target.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer & Action Buttons */}
          <div className="mt-5 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
            <p className="text-xs text-slate-400 line-clamp-2">
              {isUnlocked && !isClaimed
                ? 'Congratulations! You achieved the consistency threshold. Enjoy your reward guilt-free.'
                : !existingReward
                ? 'Lock in your reward at the start of the week for maximum motivation.'
                : 'Maintain consistency to unlock this reward by the end of the week.'}
            </p>

            <div className="flex items-center gap-3 self-stretch sm:self-auto shrink-0">
              {isUnlocked && !isClaimed && (
                <button
                  onClick={() => {
                    setClaimSpendInput(existingReward?.budget || 0);
                    setIsClaimModalOpen(true);
                  }}
                  className="flex-1 sm:flex-initial min-h-[44px] px-5 py-2.5 text-xs font-bold text-slate-950 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm rounded-xl shadow-lg transition-all cursor-pointer whitespace-nowrap text-center active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <i className="ri-gift-line text-sm" /> Claim reward
                </button>
              )}

              <button
                onClick={handleOpenRewardModal}
                className={`flex-1 sm:flex-initial min-h-[44px] px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap text-center active:scale-95 flex items-center justify-center gap-1.5 ${
                  !existingReward
                    ? 'text-slate-950 bg-amber-600 hover:bg-amber-500 text-white shadow-sm shadow-md'
                    : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/10'
                }`}
              >
                {existingReward ? (
                  <>
                    <i className="ri-edit-line text-xs shrink-0" /> Edit reward
                  </>
                ) : (
                  <>
                    <i className="ri-add-line text-sm shrink-0" /> Define week reward
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Matrix */}
      <div className="bg-[#0C101D] rounded-3xl p-6 border border-white/[0.08] shadow-2xl">
        <h3 className="text-sm font-bold text-slate-400 mb-4">
          Daily Score Breakdown (Week {weekInfo.weekNumber})
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {weekInfo.days.map((dateStr) => {
            const hasLogs = dailyLogs.some((l) => l.date === dateStr);
            const dayRec = calculateDayScore(dateStr, goals, dailyLogs);
            const dayName = getDayOfWeekName(dateStr);
            const isToday = dateStr === currentDate;

            return (
              <div
                key={dateStr}
                className={`p-4 rounded-2xl border text-center transition-all backdrop-blur-md ${
                  isToday
                    ? 'border-indigo-500/50 bg-indigo-500/15 shadow-lg shadow-indigo-950/30'
                    : 'border-white/[0.08] bg-[#080C16]'
                }`}
              >
                <span className="text-[11px] font-bold uppercase text-slate-400 block whitespace-nowrap">
                  {dayName}
                </span>
                <span className="text-xs font-semibold text-slate-300 block mb-2 whitespace-nowrap">
                  {formatShortDate(dateStr)}
                </span>

                {hasLogs ? (
                  <div>
                    <span
                      className={`text-xl font-bold block whitespace-nowrap ${
                        dayRec.score >= 90
                          ? 'text-emerald-400'
                          : dayRec.score >= 70
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {dayRec.score}%
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                      {dayRec.completedGoals}/{dayRec.totalGoals} goals
                    </span>
                  </div>
                ) : (
                  <div className="py-1 text-slate-500 text-xs font-medium whitespace-nowrap">
                    No data
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Reward Budget Tracker */}
      <div className="p-5 bg-[#0C101D] border border-white/[0.08] rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-transparent text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
            <i className="ri-copper-coin-line text-2xl" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block">
              Reward Budget Control
            </span>
            <h4 className="text-base font-bold text-white break-words">
              Monthly Reward Spending: {settings.currency}{totalMonthlySpend}
            </h4>
            <p className="text-xs text-slate-400 line-clamp-2">
              Budget limits keep reward enjoyment financially disciplined and intentional.
            </p>
          </div>
        </div>
      </div>

      {/* Reward Form Bottom Sheet */}
      {isRewardModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Define Week ${weekInfo.weekNumber} Reward`}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => {
            setFormError('');
            setIsRewardModalOpen(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-[#0C101D] border border-white/10 shadow-2xl rounded-3xl flex flex-col max-h-[85vh] overflow-hidden text-white animate-in zoom-in-95 duration-150"
          >
            {/* Pinned Header */}
            <div className="shrink-0 p-5 sm:p-6 pb-3.5 border-b border-white/[0.08] relative z-10 bg-gradient-to-b from-white/[0.04] to-transparent">

              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-md">
                      Dopamine Vault
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white break-words">
                    Define Week {weekInfo.weekNumber} Reward
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setFormError('');
                    setIsRewardModalOpen(false);
                  }}
                  aria-label="Close reward config"
                  className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-white/10 active:scale-95 cursor-pointer shrink-0 transition-all"
                >
                  <i className="ri-close-line text-xl shrink-0" />
                </button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <form id="weekly-reward-form" onSubmit={handleSaveReward} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 relative z-10 pb-12 sm:pb-16">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                  Reward Name / Experience *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Favorite Restaurant Meal, Movie Ticket"
                  value={rewardName}
                  autoCapitalize="sentences"
                  spellCheck={false}
                  onChange={(e) => setRewardName(e.target.value)}
                  className="w-full min-h-[48px] px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-[#080C16] border border-white/10 focus:border-amber-500/50 outline-none text-white placeholder-slate-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                    Reward Type
                  </label>
                  <CustomSelect
                    value={rewardType}
                    onChange={(val) => setRewardType(val as RewardType)}
                    options={['Food', 'Movie', 'Gaming', 'Shopping', 'Entertainment', 'Experience', 'Technology', 'Personal', 'Other']}
                    accentColor="amber"
                    ariaLabel="Reward Type"
                    relativePopup={true}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                    Budget Limit ({settings.currency})
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="0"
                    step="50"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full min-h-[48px] px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-[#080C16] border border-white/10 focus:border-indigo-500/50 outline-none bg-[#080C16] border border-white/10 focus:border-amber-500/50 outline-none text-white placeholder-slate-500 transition-all"
                  />
                </div>
              </div>
            </form>

            {/* Form Error */}
            {formError && (
              <div className="px-5 pt-2">
                <div className="px-3 py-2 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                  <i className="ri-error-warning-line mr-1.5" />
                  {formError}
                </div>
              </div>
            )}

            {/* Pinned Sticky Footer */}
            <div className="shrink-0 p-4 sm:p-5 pt-3 border-t border-white/[0.08] bg-slate-950/60 backdrop-blur-2xl pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] flex items-center gap-3 relative z-10">
              <button
                type="button"
                onClick={() => {
                  setFormError('');
                  setIsRewardModalOpen(false);
                }}
                className="flex-1 min-h-[48px] px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 rounded-xl cursor-pointer whitespace-nowrap transition-all active:scale-95 text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="weekly-reward-form"
                className="flex-1 min-h-[48px] px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-amber-600 hover:bg-amber-500 text-white shadow-sm rounded-xl cursor-pointer whitespace-nowrap active:scale-95 text-center"
              >
                Lock reward
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Claim Reward Spend Bottom Sheet */}
      {isClaimModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Claim Weekly Reward"
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsClaimModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm bg-[#0C101D] border-t border-white/10 shadow-2xl rounded-3xl flex flex-col max-h-[85vh] overflow-hidden text-white animate-in zoom-in-95 duration-150"
          >
            {/* Pinned Header */}
            <div className="shrink-0 p-5 sm:p-6 pb-3.5 border-b border-white/[0.08] relative z-10 bg-gradient-to-b from-white/[0.04] to-transparent">

              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-md">
                      Loot Unlocked
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white break-words">
                    Claim Weekly Reward
                  </h3>
                </div>
                <button
                  onClick={() => setIsClaimModalOpen(false)}
                  aria-label="Close claim dialog"
                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-white/10 active:scale-95 cursor-pointer shrink-0 transition-all"
                >
                  <i className="ri-close-line text-xl shrink-0" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 relative z-10">
              <p className="text-xs text-slate-300 leading-relaxed">
                Log your actual spend amount to maintain financial discipline against your monthly budget.
              </p>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Actual Spend Amount ({settings.currency})
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="0"
                  value={claimSpendInput}
                  onChange={(e) => setClaimSpendInput(Number(e.target.value))}
                  className="w-full min-h-[48px] px-4 py-2.5 text-xs sm:text-sm font-bold rounded-2xl bg-[#080C16] border border-white/10 focus:border-indigo-500/50 outline-none bg-[#080C16] border border-white/10 focus:border-indigo-500/50 outline-none-emerald text-white"
                />
              </div>
            </div>

            {/* Pinned Sticky Footer */}
            <div className="shrink-0 p-4 sm:p-5 pt-3 border-t border-white/[0.08] bg-slate-950/60 backdrop-blur-2xl pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] flex items-center gap-3 relative z-10">
              <button
                type="button"
                onClick={() => setIsClaimModalOpen(false)}
                className="flex-1 min-h-[48px] px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 rounded-xl cursor-pointer whitespace-nowrap transition-all active:scale-95 text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClaim}
                className="flex-1 min-h-[48px] px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm rounded-xl cursor-pointer whitespace-nowrap active:scale-95 text-center"
              >
                Claim loot
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
