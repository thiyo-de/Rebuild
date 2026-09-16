import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import { Milestone2027, AppSettings } from '../types';
import { ConfirmationModal } from './ConfirmationModal';
import { INITIAL_MILESTONES_2027 } from '../data/starterData';
import { nativeHaptics } from '../services/native';

interface Milestones2027ViewProps {
  milestones: Milestone2027[];
  settings: AppSettings;
  onAddMilestone: (m: Milestone2027) => void;
  onUpdateMilestone: (m: Milestone2027) => void;
  onDeleteMilestone: (id: string) => void;
  onToggleAchieved: (id: string, achieved: boolean) => void;
}

export const Milestones2027View: React.FC<Milestones2027ViewProps> = ({
  milestones,
  settings,
  onAddMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
  onToggleAchieved,
}) => {
  const horizonYear = new Date().getFullYear() + 1;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone2027 | null>(null);
  const [confirmAchieveMilestone, setConfirmAchieveMilestone] = useState<Milestone2027 | null>(null);
  const [milestoneToDelete, setMilestoneToDelete] = useState<Milestone2027 | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Career');
  const [reward, setReward] = useState('');
  const [rewardCategory, setRewardCategory] = useState('Technology');
  const [budget, setBudget] = useState<number>(50000);

  const openAddModal = () => {
    nativeHaptics.selection();
    setEditingMilestone(null);
    setTitle('');
    setDescription('');
    setCategory('Career');
    setReward('');
    setRewardCategory('Technology');
    setBudget(50000);
    setIsAddModalOpen(true);
  };

  const openEditModal = (m: Milestone2027) => {
    nativeHaptics.selection();
    setEditingMilestone(m);
    setTitle(m.title);
    setDescription(m.description);
    setCategory(m.category);
    setReward(m.reward);
    setRewardCategory(m.rewardCategory);
    setBudget(m.budget || 0);
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !reward.trim()) return;

    nativeHaptics.success();
    if (editingMilestone) {
      onUpdateMilestone({
        ...editingMilestone,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        reward: reward.trim(),
        rewardCategory: rewardCategory.trim(),
        budget: Number(budget) || 0,
      });
    } else {
      const newM: Milestone2027 = {
        id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        reward: reward.trim(),
        rewardCategory: rewardCategory.trim(),
        budget: Number(budget) || 0,
        currency: settings.currency,
        achieved: false,
      };
      onAddMilestone(newM);
    }

    setIsAddModalOpen(false);
  };

  const handleManualConfirm = () => {
    if (!confirmAchieveMilestone) return;
    const willBeAchieved = !confirmAchieveMilestone.achieved;
    onToggleAchieved(confirmAchieveMilestone.id, willBeAchieved);
    setConfirmAchieveMilestone(null);

    if (willBeAchieved) {
      nativeHaptics.impactHeavy();
      confetti({
        particleCount: 180,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#3B82F6'],
      });
    } else {
      nativeHaptics.selection();
    }
  };

  const handleAddStarterMilestone = (starter: Milestone2027) => {
    nativeHaptics.selection();
    const newM: Milestone2027 = {
      ...starter,
      id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      achieved: false,
    };
    onAddMilestone(newM);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-950/20 backdrop-blur-xl rounded-3xl p-5 sm:p-8 border border-amber-500/30 shadow-2xl shadow-black/70 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.04] before:to-transparent before:pointer-events-none">
        {/* Top-Left & Bottom-Right Ambient Blurred Glow Circles */}
        <div className="absolute -top-1/4 -left-1/4 w-[60%] aspect-square rounded-full bg-amber-500/22 blur-[80px] sm:blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[60%] aspect-square rounded-full bg-orange-600/22 blur-[80px] sm:blur-[100px] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 text-xs font-bold bg-amber-500 text-black rounded-lg uppercase tracking-wider whitespace-nowrap shadow-md shadow-amber-500/20">
              {horizonYear} Vision
            </span>
            <span className="text-xs font-bold text-amber-300">
              Long-Term Life Targets & Major Trophies
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-white mt-2">
            {horizonYear} Master Milestones
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-lg">
            Major long-term milestone rewards are NOT unlocked by daily scores alone. They require real-world achievement and manual confirmation.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="relative z-10 inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] text-xs font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 rounded-2xl transition-all self-stretch sm:self-center cursor-pointer whitespace-nowrap"
        >
          <i className="ri-add-line text-sm shrink-0" /> <span className="whitespace-nowrap">Add {horizonYear} milestone</span>
        </button>
      </div>

      {/* Milestones Grid */}
      {milestones.length === 0 ? (
        <div className="p-10 text-center bg-[#0C101D] rounded-3xl border border-white/[0.08] shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/30 backdrop-blur-md">
            <i className="ri-flag-line text-2xl shrink-0" />
          </div>
          <h4 className="text-lg font-bold text-white">
            No {horizonYear} Milestones Configured
          </h4>
          <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
            Define your highest-stakes achievements for {horizonYear} (Dream Career, Target Physique, New Skill) paired with major physical rewards.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={openAddModal}
              className="px-5 py-3 min-h-[48px] text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 active:scale-[0.98] rounded-xl shadow-md shadow-amber-600/30 transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap"
            >
              <i className="ri-add-line text-sm shrink-0" /> <span className="whitespace-nowrap">Create First {horizonYear} Milestone</span>
            </button>
          </div>

          {/* Starter Ideas */}
          <div className="mt-8 pt-6 border-t border-white/[0.08]">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Or load pre-configured {horizonYear} milestone blueprints:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {INITIAL_MILESTONES_2027.map((m) => (
                <button
                  key={m.title}
                  onClick={() => handleAddStarterMilestone(m)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] text-xs font-semibold rounded-xl bg-[#080C16] hover:bg-amber-500/20 hover:text-amber-300 border border-white/[0.08] transition-colors cursor-pointer whitespace-nowrap text-slate-300 active:scale-[0.98]"
                >
                  <i className="ri-add-line text-xs text-amber-400 shrink-0" />
                  <span className="whitespace-nowrap">{m.title}</span>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">({m.reward})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {milestones.map((m) => {
            const isGamingPC = m.reward.toLowerCase().includes('pc');
            const isPhone =
              m.reward.toLowerCase().includes('phone') || m.reward.toLowerCase().includes('mobile');

            return (
              <div
                key={m.id}
                className={`relative overflow-hidden rounded-3xl p-6 sm:p-7 border border-white/5 transition-all flex flex-col justify-between backdrop-blur-2xl shadow-[inset_0_0_50px_rgba(0,0,0,0.7)] before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.06] before:to-transparent before:pointer-events-none ${
                  m.achieved
                    ? 'bg-gradient-to-br from-emerald-950/40 via-slate-950/90 to-slate-950/95 border-emerald-500/50 shadow-[0_0_40px_-5px_rgba(16,185,129,0.25)]'
                    : 'bg-gradient-to-br from-amber-950/25 via-[#0C101C]/90 to-slate-950/95 border-amber-500/30 hover:border-amber-400/50 shadow-[0_0_40px_-5px_rgba(245,158,11,0.18)]'
                }`}
              >
                {/* Top-Left & Bottom-Right Ambient Blurred Glow Circles */}
                <div
                  className={`absolute -top-1/4 -left-1/4 w-[60%] aspect-square rounded-full blur-[80px] sm:blur-[100px] pointer-events-none transition-all duration-500 ${
                    m.achieved ? 'bg-emerald-500/25' : 'bg-amber-500/20'
                  }`}
                />
                <div
                  className={`absolute -bottom-1/4 -right-1/4 w-[60%] aspect-square rounded-full blur-[80px] sm:blur-[100px] pointer-events-none transition-all duration-500 ${
                    m.achieved ? 'bg-teal-400/20' : 'bg-orange-500/15'
                  }`}
                />

                <div className="relative z-10">
                  {/* Category & Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    {/* Left: Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap flex-1 pr-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-800/80 text-slate-300 border border-slate-700 whitespace-nowrap backdrop-blur-md">
                        {m.category}
                      </span>
                      {m.isPredefined && (
                        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 whitespace-nowrap shadow-xs">
                          Predefined
                        </span>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-0.5 shrink-0 -mt-1 -mr-1">
                      <button
                        onClick={() => openEditModal(m)}
                        className="w-10 h-10 inline-flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all cursor-pointer shrink-0 active:scale-95"
                        title="Edit milestone"
                        aria-label="Edit milestone"
                      >
                        <i className="ri-edit-line text-base shrink-0" />
                      </button>
                      <button
                        onClick={() => {
                          nativeHaptics.impactLight();
                          setMilestoneToDelete(m);
                        }}
                        className="w-10 h-10 inline-flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer shrink-0 active:scale-95"
                        title="Delete milestone"
                        aria-label="Delete milestone"
                      >
                        <i className="ri-delete-bin-line text-base shrink-0" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base sm:text-lg font-bold text-white break-words">{m.title}</h3>
                    {m.achieved ? (
                      <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)] whitespace-nowrap mt-0.5 shrink-0">
                        <i className="ri-lock-unlock-line text-xs shrink-0" /> ACHIEVED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-bold bg-slate-900/90 text-slate-400 border border-slate-700 whitespace-nowrap shadow-inner mt-0.5 shrink-0">
                        <i className="ri-lock-line text-[11px] shrink-0 text-amber-500/70" /> LOCKED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {m.description}
                  </p>

                  {/* Reward Trophy Box */}
                  <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/[0.12] via-yellow-500/[0.04] to-amber-500/[0.08] border border-amber-500/30 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)] backdrop-blur-md flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-bold flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                        {isGamingPC ? (
                          <i className="ri-computer-line text-xl shrink-0" />
                        ) : isPhone ? (
                          <i className="ri-smartphone-line text-xl shrink-0" />
                        ) : (
                          <i className="ri-trophy-line text-xl shrink-0" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-wider whitespace-nowrap">
                          Trophy Reward
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-white break-words">{m.reward}</h4>
                      </div>
                    </div>

                    {m.budget && m.budget > 0 && (
                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-[11px] text-slate-400 block whitespace-nowrap">Est. Budget</span>
                        <span className="text-sm font-bold text-amber-300 whitespace-nowrap">
                          {settings.currency}
                          {m.budget.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Manual Confirmation Action */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
                  <span className="text-[11px] text-slate-400">
                    {m.achieved && m.achievedDate
                      ? `Achieved on ${m.achievedDate}`
                      : 'Requires manual confirmation'}
                  </span>

                  <button
                    onClick={() => {
                      nativeHaptics.selection();
                      setConfirmAchieveMilestone(m);
                    }}
                    className={`w-full sm:w-auto px-5 py-2.5 min-h-[44px] rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap text-center active:scale-95 flex items-center justify-center gap-1.5 ${
                      m.achieved
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        : 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm text-slate-950 shadow-lg'
                    }`}
                  >
                    {m.achieved ? 'Undo achievement' : 'Confirm achieved'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Achievement Confirmation Modal */}
      {confirmAchieveMilestone && (
        <ConfirmationModal
          isOpen={Boolean(confirmAchieveMilestone)}
          title={
            confirmAchieveMilestone.achieved
              ? 'Reset Milestone Status?'
              : 'Confirm Real-World Milestone Achievement'
          }
          message={
            confirmAchieveMilestone.achieved
              ? `Are you sure you want to mark "${confirmAchieveMilestone.title}" as unachieved?`
              : `Have you achieved "${confirmAchieveMilestone.title}" in reality? This will unlock the major milestone reward: "${confirmAchieveMilestone.reward}".`
          }
          confirmLabel={confirmAchieveMilestone.achieved ? 'Reset Status' : 'Yes, Milestone Achieved!'}
          cancelLabel="Cancel"
          isDestructive={false}
          onConfirm={handleManualConfirm}
          onCancel={() => {
            nativeHaptics.selection();
            setConfirmAchieveMilestone(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={Boolean(milestoneToDelete)}
        title="Delete Milestone?"
        message={`Are you sure you want to delete "${milestoneToDelete?.title}"?`}
        confirmLabel="Delete"
        cancelLabel="Keep"
        isDestructive={true}
        onConfirm={() => {
          if (milestoneToDelete) {
            nativeHaptics.impactLight();
            onDeleteMilestone(milestoneToDelete.id);
            setMilestoneToDelete(null);
          }
        }}
        onCancel={() => {
          nativeHaptics.selection();
          setMilestoneToDelete(null);
        }}
      />

      {/* Add / Edit Milestone Mobile Bottom Sheet */}
      {isAddModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingMilestone ? `Edit ${horizonYear} Milestone` : `Add ${horizonYear} Milestone`}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-[#0C101D] border-t border-white/10 shadow-2xl rounded-3xl flex flex-col max-h-[85vh] overflow-hidden text-white animate-in zoom-in-95 duration-150"
          >
            {/* Pinned Header */}
            <div className="shrink-0 p-5 sm:p-6 pb-3.5 border-b border-white/[0.08] relative z-10 bg-gradient-to-b from-white/[0.04] to-transparent">

              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-md">
                      Legendary Vision
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white break-words">
                    {editingMilestone ? `Edit ${horizonYear} Milestone` : `Add ${horizonYear} Milestone`}
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  aria-label="Close milestone dialog"
                  className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-white/10 active:scale-95 cursor-pointer shrink-0 transition-all"
                >
                  <i className="ri-close-line text-xl shrink-0" />
                </button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <form id="milestone-form" onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 relative z-10">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                  Milestone Goal Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master SSC CGL & Secure Govt Job"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoCapitalize="sentences"
                  className="w-full min-h-[48px] px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-[#080C16] border border-white/10 focus:border-indigo-500/50 outline-none bg-[#080C16] border border-white/10 focus:border-amber-500/50 outline-none text-white placeholder-slate-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                  Description & Criteria
                </label>
                <textarea
                  rows={2}
                  placeholder="Clear real-world criteria to declare achievement..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  autoCapitalize="sentences"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-[#080C16] border border-white/10 focus:border-indigo-500/50 outline-none bg-[#080C16] border border-white/10 focus:border-amber-500/50 outline-none text-white placeholder-slate-500 resize-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                    Major Trophy / Reward *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gaming PC, Flagship Phone"
                    value={reward}
                    onChange={(e) => setReward(e.target.value)}
                    autoCapitalize="sentences"
                    className="w-full min-h-[48px] px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-[#080C16] border border-white/10 focus:border-indigo-500/50 outline-none bg-[#080C16] border border-white/10 focus:border-amber-500/50 outline-none text-white placeholder-slate-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                    Estimated Budget ({settings.currency})
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1000"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full min-h-[48px] px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-[#080C16] border border-white/10 focus:border-indigo-500/50 outline-none bg-[#080C16] border border-white/10 focus:border-amber-500/50 outline-none text-white placeholder-slate-500 transition-all"
                  />
                </div>
              </div>
            </form>

            {/* Pinned Sticky Footer */}
            <div className="shrink-0 p-4 sm:p-5 pt-3 border-t border-white/[0.08] bg-slate-950/60 backdrop-blur-2xl pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] flex items-center gap-3 relative z-10">
              <button
                type="button"
                onClick={() => {
                  nativeHaptics.selection();
                  setIsAddModalOpen(false);
                }}
                className="flex-1 min-h-[48px] px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 rounded-xl cursor-pointer whitespace-nowrap transition-all active:scale-95 text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="milestone-form"
                className="flex-1 min-h-[48px] px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-amber-600 hover:bg-amber-500 text-white shadow-sm rounded-xl cursor-pointer whitespace-nowrap active:scale-95 text-center uppercase tracking-wider"
              >
                Save Milestone
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
