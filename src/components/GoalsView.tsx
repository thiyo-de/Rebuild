import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Goal, GoalFrequency, AppSettings } from '../types';
import {
  STARTER_GOAL_TEMPLATES,
  STARTER_BLUEPRINTS,
  StarterBlueprint,
  getCategoryTheme,
} from '../data/starterData';
import { ConfirmationModal } from './ConfirmationModal';
import { CustomSelect } from './CustomSelect';
import { GoalModal } from './GoalModal';
import { triggerHaptic } from '../services/native';
import { formatTime12Hour } from '../utils/dateUtils';

interface GoalsViewProps {
  goals: Goal[];
  settings: AppSettings;
  onAddGoal: (goal: Goal) => void;
  onUpdateGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  onToggleGoalActive: (goalId: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  settings,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onToggleGoalActive,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewTab, setViewTab] = useState<'active' | 'archived'>('active');
  const [starterTab, setStarterTab] = useState<'blueprints' | 'templates'>('blueprints');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStarterModalOpen, setIsStarterModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Back stack registration for Add/Edit Goal modal
  useEffect(() => {
    if (!isAddModalOpen) return;
    const handler = () => {
      setIsAddModalOpen(false);
      setEditingGoal(null);
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
  }, [isAddModalOpen]);

  // Back stack registration for Starter Blueprints modal
  useEffect(() => {
    if (!isStarterModalOpen) return;
    const handler = () => {
      setIsStarterModalOpen(false);
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
  }, [isStarterModalOpen]);

  const openAddModal = () => {
    triggerHaptic('light');
    setEditingGoal(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    triggerHaptic('light');
    setEditingGoal(goal);
    setIsAddModalOpen(true);
  };

  const handleSaveGoal = (goal: Goal) => {
    if (editingGoal) {
      onUpdateGoal(goal);
    } else {
      onAddGoal(goal);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    setIsAddModalOpen(false);
    setEditingGoal(null);
  };

  const handleArchiveGoal = (goal: Goal) => {
    triggerHaptic('medium');
    onUpdateGoal({
      ...goal,
      archived: true,
      active: false,
    });
  };

  const handleUnarchiveGoal = (goal: Goal) => {
    triggerHaptic('success');
    onUpdateGoal({
      ...goal,
      archived: false,
      active: true,
    });
  };

  const handleAddStarterGoal = (template: Omit<Goal, 'id' | 'startDate'>) => {
    triggerHaptic('success');
    const newGoal: Goal = {
      ...template,
      id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      startDate: new Date().toISOString().split('T')[0],
      active: true,
      archived: false,
    };
    onAddGoal(newGoal);
  };

  const handleLoadBlueprint = (blueprint: StarterBlueprint) => {
    triggerHaptic('success');
    const today = new Date().toISOString().split('T')[0];
    blueprint.goals.forEach((tmpl, idx) => {
      const isAlreadyAdded = goals.some(
        (g) => g.name.toLowerCase() === tmpl.name.toLowerCase() && !g.archived
      );
      if (!isAlreadyAdded) {
        const newGoal: Goal = {
          ...tmpl,
          id: `g_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          startDate: today,
          active: true,
          archived: false,
        };
        onAddGoal(newGoal);
      }
    });
  };

  const activeGoalsCount = goals.filter((g) => !g.archived).length;
  const archivedGoalsCount = goals.filter((g) => g.archived).length;

  // Filter list by active vs archived tab
  const currentTabGoals = goals.filter((g) => {
    if (viewTab === 'archived') {
      return g.archived === true;
    }
    return !g.archived;
  });

  // Dynamic categories strictly from current tab's goals
  const activeCategories = Array.from(new Set(currentTabGoals.map((g) => g.category).filter(Boolean)));

  const filteredGoals = currentTabGoals.filter((g) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      !activeCategories.includes(selectedCategory) ||
      g.category === selectedCategory;
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.notes && g.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {saveSuccess && (
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[100] flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-slate-950 rounded-2xl shadow-xl text-xs sm:text-sm font-bold animate-in slide-in-from-right-4 duration-200">
          <i className="ri-checkbox-circle-line text-lg" />
          <span>Saved successfully</span>
        </div>
      )}
      {/* Header Banner */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-br from-slate-900/95 via-[#0A0F1E]/95 to-slate-950/95 backdrop-blur-2xl rounded-3xl p-5 sm:p-8 border border-indigo-500/30 hover:border-indigo-400/50 shadow-[0_0_40px_-5px_rgba(99,102,241,0.22)] shadow-[inset_0_0_50px_rgba(0,0,0,0.7)] before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.06] before:to-transparent before:pointer-events-none transition-all">
        {/* Ambient Corner Orbs */}
        <div className="absolute -top-1/4 -left-1/4 w-[65%] aspect-square rounded-full bg-indigo-500/25 blur-[80px] sm:blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[65%] aspect-square rounded-full bg-cyan-500/20 blur-[80px] sm:blur-[100px] pointer-events-none" />

        <div className="min-w-0 relative z-10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block">
            Goal Directory & Architecture
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white break-words">
            Customizable Goal System
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            Equal weighting by default (1 goal = 1 point). No forced presets. Add study, fitness, career, or habit targets.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full sm:w-auto shrink-0 relative z-10">
          <button
            onClick={() => setIsStarterModalOpen(true)}
            className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/25 rounded-2xl transition-all border border-indigo-500/30 cursor-pointer whitespace-nowrap backdrop-blur-md active:scale-95 text-center"
          >
            <i className="ri-lightbulb-line text-sm text-indigo-400 shrink-0" />
            <span className="whitespace-nowrap">Starter Blueprints</span>
          </button>
          <button
            onClick={openAddModal}
            className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm rounded-2xl shadow-md transition-all cursor-pointer whitespace-nowrap active:scale-95 text-center"
          >
            <i className="ri-add-line text-sm shrink-0" />
            <span className="whitespace-nowrap">Create Goal</span>
          </button>
        </div>
      </div>

      {/* Active vs. Archived Tab Switcher (100% Width Centered) */}
      <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-950/80 backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-lg w-full">
        <button
          onClick={() => {
            triggerHaptic('light');
            setViewTab('active');
            setSelectedCategory('All');
          }}
          className={`min-h-[44px] w-full px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center justify-center gap-2 ${
            viewTab === 'active'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <i className="ri-focus-3-line text-sm shrink-0" />
          <span>Active Targets ({activeGoalsCount})</span>
        </button>
        <button
          onClick={() => {
            triggerHaptic('light');
            setViewTab('archived');
            setSelectedCategory('All');
          }}
          className={`min-h-[44px] w-full px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center justify-center gap-2 ${
            viewTab === 'archived'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <i className="ri-archive-line text-sm shrink-0" />
          <span>Archived ({archivedGoalsCount})</span>
        </button>
      </div>

      {/* Filters & Search - Streamlined Single-Layer Cyber Input */}
      <div className="space-y-2.5">
        <div className="relative w-full">
          <i className="ri-search-2-line text-base absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search goals by name or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 text-xs rounded-2xl bg-[#090D16] border border-white/5 shadow-inner focus:border-indigo-500/50 outline-none text-white placeholder-slate-400 min-h-[44px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              aria-label="Clear search"
            >
              <i className="ri-close-line text-base" />
            </button>
          )}
        </div>

        {/* Dynamic Category Pill filter (Only shown if current tab has multiple categories) */}
        {activeCategories.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-0.5 no-scrollbar py-1 scroll-smooth">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 backdrop-blur-md active:scale-95 flex items-center ${
                selectedCategory === 'All'
                  ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 bg-slate-950/40 border border-white/5'
              }`}
            >
              All ({currentTabGoals.length})
            </button>
            {activeCategories.map((cat) => {
              const count = currentTabGoals.filter((g) => g.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 backdrop-blur-md active:scale-95 flex items-center ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60 bg-slate-950/40 border border-white/5'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Goals Table / Card List */}
      <div className="grid gap-3">
        {filteredGoals.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-[#0C101D] rounded-3xl border border-white/[0.08] shadow-xl">
            <i className={viewTab === 'archived' ? 'ri-archive-line text-4xl text-slate-500 mx-auto mb-3 block' : 'ri-focus-3-line text-4xl text-slate-500 mx-auto mb-3 block'} />
            <h4 className="text-base font-bold text-white break-words">
              {viewTab === 'archived'
                ? 'No archived goals'
                : goals.length === 0
                ? 'No goals created yet'
                : 'No active goals matched'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {viewTab === 'archived'
                ? 'Goals you archive will be stored here safely without affecting daily tracking.'
                : goals.length === 0
                ? 'Create your first daily target or choose from starter blueprints to begin tracking.'
                : 'Try adjusting your search query or reset filters.'}
            </p>
            {viewTab === 'active' && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={openAddModal}
                  className="min-h-[44px] px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl cursor-pointer whitespace-nowrap shadow-md shadow-indigo-600/30 active:scale-95"
                >
                  + Create Goal
                </button>
                <button
                  onClick={() => setIsStarterModalOpen(true)}
                  className="min-h-[44px] px-4 py-2 text-xs font-bold text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 rounded-xl cursor-pointer whitespace-nowrap active:scale-95"
                >
                  Load Starter Blueprint
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const theme = getCategoryTheme(goal.category);

            return (
              <div
                key={goal.id}
                id={`goal-card-${goal.id}`}
                className={`group rounded-2xl p-4 sm:p-5 border transition-all shadow-xl flex flex-col gap-3.5 relative overflow-hidden ${
                  goal.archived
                    ? 'bg-[#0C101D]/70 border-white/[0.06] opacity-75'
                    : goal.active
                    ? 'bg-[#0C101D] border-white/[0.08] hover:border-indigo-500/30'
                    : 'bg-[#0C101D]/60 border-white/[0.06] opacity-65'
                }`}
              >
                {/* Top Row: Category Badge + Full Width Title + Status Badges */}
                <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                  <span
                    className={`px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-bold shrink-0 whitespace-nowrap ${theme.badge}`}
                  >
                    {goal.category}
                  </span>

                  <h4 className="text-sm sm:text-base font-semibold text-white break-words flex-1 min-w-[140px]">
                    {goal.name}
                  </h4>

                  {goal.archived && (
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-500/15 text-amber-300 rounded-md border border-amber-500/30 whitespace-nowrap shrink-0">
                      Archived
                    </span>
                  )}
                  {!goal.archived && !goal.active && (
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-slate-800 text-slate-400 rounded-md border border-slate-700 whitespace-nowrap shrink-0">
                      Paused
                    </span>
                  )}
                </div>

                {/* Middle Row: Telemetry Metric Chips */}
                <div className="flex items-center gap-2 text-xs text-slate-300 flex-wrap">
                  <div className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/5 flex items-center gap-1.5 font-medium text-slate-300">
                    <span className="text-slate-400 font-normal">Target:</span>
                    <span className="text-white font-bold">{goal.target}</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/5 flex items-center gap-1.5 font-medium text-slate-300">
                    <span className="text-slate-400 font-normal">Freq:</span>
                    <span className="text-white font-bold">{goal.frequency}</span>
                  </div>
                  {goal.reminderTime && (
                    <div className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/5 flex items-center gap-1.5 font-medium text-slate-300">
                      <i className="ri-time-line text-xs shrink-0 text-slate-400" />
                      <span className="text-slate-200">{formatTime12Hour(goal.reminderTime)}</span>
                    </div>
                  )}
                </div>

                {/* Inset Strategy Socket (if notes exist) */}
                {goal.notes && (
                  <div className="pt-2 pb-2 px-3 rounded-xl bg-[#080C16] border border-white/[0.06] flex items-start gap-2.5">
                    <i className="ri-lightbulb-line text-amber-400/90 text-xs mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-300 font-normal break-words leading-relaxed">{goal.notes}</p>
                  </div>
                )}

                {/* Bottom Action Footer Bar */}
                <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${goal.active ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-500'}`} />
                    <span className="truncate">{goal.archived ? 'Archived Goal' : goal.active ? 'Active Routine' : 'Paused Routine'}</span>
                  </div>

                  {/* Action Buttons Toolbar */}
                  <div className="flex items-center gap-1 shrink-0">
                    {goal.archived ? (
                      <>
                        <button
                          onClick={() => handleUnarchiveGoal(goal)}
                          className="min-h-[40px] px-3 py-1.5 text-xs font-bold text-indigo-300 hover:text-white bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                          title="Restore goal to active list"
                        >
                          <i className="ri-inbox-unarchive-line text-sm shrink-0" />
                          <span className="whitespace-nowrap">Restore</span>
                        </button>
                        <button
                          onClick={() => openEditModal(goal)}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/15 rounded-xl transition-colors cursor-pointer active:scale-95 border border-transparent hover:border-indigo-500/20"
                          title="Edit goal"
                          aria-label="Edit goal"
                        >
                          <i className="ri-edit-line text-base shrink-0" />
                        </button>
                        <button
                          onClick={() => setGoalToDelete(goal)}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-xl transition-colors cursor-pointer active:scale-95 border border-transparent hover:border-rose-500/20"
                          title="Delete goal"
                          aria-label="Delete goal"
                        >
                          <i className="ri-delete-bin-line text-base shrink-0" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => onToggleGoalActive(goal.id)}
                          className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl transition-colors cursor-pointer active:scale-95 border border-transparent ${
                            goal.active
                              ? 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/15 hover:border-amber-500/20'
                              : 'text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500/20'
                          }`}
                          title={goal.active ? 'Pause goal' : 'Activate goal'}
                          aria-label={goal.active ? 'Pause goal' : 'Activate goal'}
                        >
                          {goal.active ? (
                            <i className="ri-pause-circle-line text-base shrink-0" />
                          ) : (
                            <i className="ri-play-circle-line text-base shrink-0" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditModal(goal)}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/15 rounded-xl transition-colors cursor-pointer active:scale-95 border border-transparent hover:border-indigo-500/20"
                          title="Edit goal"
                          aria-label="Edit goal"
                        >
                          <i className="ri-edit-line text-base shrink-0" />
                        </button>
                        <button
                          onClick={() => handleArchiveGoal(goal)}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-amber-500/15 rounded-xl transition-colors cursor-pointer active:scale-95 border border-transparent hover:border-amber-500/20"
                          title="Archive goal"
                          aria-label="Archive goal"
                        >
                          <i className="ri-archive-line text-base shrink-0" />
                        </button>
                        <button
                          onClick={() => setGoalToDelete(goal)}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-xl transition-colors cursor-pointer active:scale-95 border border-transparent hover:border-rose-500/20"
                          title="Delete goal"
                          aria-label="Delete goal"
                        >
                          <i className="ri-delete-bin-line text-base shrink-0" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Goal Modal */}
      <GoalModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingGoal(null);
        }}
        onSaveGoal={handleSaveGoal}
        editingGoal={editingGoal}
        categories={settings?.categories || ['General', 'Study', 'Fitness']}
      />

      {/* Starter Blueprints & Templates Bottom Sheet */}
      {isStarterModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Starter Blueprints & Ideas"
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsStarterModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-[#0C101D] border border-white/5 shadow-2xl rounded-3xl p-5 sm:p-8 overflow-hidden max-h-[85vh] flex flex-col text-white animate-in zoom-in-95 duration-150"
          >

            <div className="flex items-center justify-between pb-3.5 border-b border-white/5 relative z-10">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-md">
                    Instant Mastery
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white break-words">
                  Starter Blueprints & Ideas
                </h3>
              </div>
              <button
                onClick={() => setIsStarterModalOpen(false)}
                aria-label="Done"
                className="min-h-[44px] px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm rounded-xl cursor-pointer whitespace-nowrap active:scale-95"
              >
                Done
              </button>
            </div>

            {/* Sub-tabs: 4 Starter Blueprints vs Individual Goal Templates */}
            <div className="flex items-center gap-2 mt-3 mb-3 p-1 bg-slate-950/60 rounded-2xl border border-slate-800/80">
              <button
                onClick={() => setStarterTab('blueprints')}
                className={`flex-1 min-h-[44px] px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center justify-center gap-2 ${
                  starterTab === 'blueprints'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <i className="ri-layout-grid-line text-sm shrink-0" />
                <span>4 Starter Blueprints</span>
              </button>
              <button
                onClick={() => setStarterTab('templates')}
                className={`flex-1 min-h-[44px] px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center justify-center gap-2 ${
                  starterTab === 'templates'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <i className="ri-list-check-3 text-sm shrink-0" />
                <span>Individual Goals</span>
              </button>
            </div>

            {starterTab === 'blueprints' ? (
              <div className="overflow-y-auto space-y-3.5 pr-1 flex-1">
                <p className="text-xs text-slate-400 leading-relaxed">
                  1-click load pre-configured, battle-tested routines into your system. All goals remain 100% editable.
                </p>

                {STARTER_BLUEPRINTS.map((bp) => {
                  const theme = getCategoryTheme(bp.category);
                  const existingCount = bp.goals.filter((g) =>
                    goals.some((existing) => existing.name.toLowerCase() === g.name.toLowerCase() && !existing.archived)
                  ).length;
                  const isAllAdded = existingCount === bp.goals.length;

                  return (
                    <div
                      key={bp.id}
                      className="p-4 bg-[#0C101D] rounded-2xl border border-white/[0.08] shadow-md space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-2 rounded-xl text-lg shrink-0 ${theme.bg} ${theme.text}`}>
                            {bp.category === 'SSC' ? (
                              <i className="ri-book-open-line shrink-0" />
                            ) : bp.category === 'English' ? (
                              <i className="ri-translate-2 shrink-0" />
                            ) : bp.category === 'Fitness' ? (
                              <i className="ri-heart-pulse-line shrink-0" />
                            ) : (
                              <i className="ri-shield-check-line shrink-0" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white truncate">
                                {bp.title}
                              </h4>
                              <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${theme.badge}`}>
                                {bp.category}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                              {bp.description}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleLoadBlueprint(bp)}
                          disabled={isAllAdded}
                          className={`min-h-[44px] px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap active:scale-95 shrink-0 flex items-center justify-center gap-1.5 ${
                            isAllAdded
                              ? 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/60'
                              : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 cursor-pointer'
                          }`}
                        >
                          <i className={isAllAdded ? 'ri-check-line text-sm shrink-0' : 'ri-download-cloud-line text-sm shrink-0'} />
                          <span>{isAllAdded ? 'Blueprint Active' : `+ Load Blueprint (${bp.goals.length} Targets)`}</span>
                        </button>
                      </div>

                      {/* 4 Targets Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
                        {bp.goals.map((goalTmpl, gIdx) => {
                          const isGoalAdded = goals.some(
                            (g) => g.name.toLowerCase() === goalTmpl.name.toLowerCase() && !g.archived
                          );
                          return (
                            <div
                              key={gIdx}
                              className="p-2.5 rounded-xl bg-[#080C16] border border-white/[0.06] flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold text-white block truncate">
                                  {goalTmpl.name}
                                </span>
                                <span className="text-[11px] text-slate-400 block truncate">
                                  Target: {goalTmpl.target} • {goalTmpl.frequency}
                                </span>
                              </div>
                              <button
                                onClick={() => handleAddStarterGoal(goalTmpl)}
                                disabled={isGoalAdded}
                                className={`min-h-[44px] min-w-[44px] p-2 text-xs font-bold rounded-lg transition-all active:scale-95 flex items-center justify-center shrink-0 ${
                                  isGoalAdded
                                    ? 'text-emerald-400 cursor-not-allowed'
                                    : 'text-indigo-400 hover:text-white hover:bg-indigo-600/30 cursor-pointer'
                                }`}
                                title={isGoalAdded ? 'Already active' : 'Add target'}
                              >
                                {isGoalAdded ? (
                                  <i className="ri-check-line text-base shrink-0 font-bold" />
                                ) : (
                                  <i className="ri-add-line text-base shrink-0 font-bold" />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-y-auto space-y-2 pr-1 flex-1">
                <p className="text-xs text-slate-400 my-1">
                  Tap <strong>+ Add</strong> to activate any individual starter goal. You can customize targets and times later.
                </p>

                {STARTER_GOAL_TEMPLATES.map((tmpl, idx) => {
                  const isAlreadyAdded = goals.some((g) => g.name.toLowerCase() === tmpl.name.toLowerCase() && !g.archived);
                  const theme = getCategoryTheme(tmpl.category);

                  return (
                    <div
                      key={idx}
                      className="p-3 sm:p-3.5 bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 whitespace-nowrap ${theme.badge}`}>
                          {tmpl.category}
                        </span>
                        <div className="min-w-0">
                          <h5 className="text-xs sm:text-sm font-semibold text-white truncate">
                            {tmpl.name}
                          </h5>
                          <span className="text-[11px] text-slate-400 block truncate">Target: {tmpl.target}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddStarterGoal(tmpl)}
                        disabled={isAlreadyAdded}
                        className={`min-h-[44px] px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap active:scale-95 ${
                          isAlreadyAdded
                            ? 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/60'
                            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 cursor-pointer'
                        }`}
                      >
                        {isAlreadyAdded ? 'Added' : '+ Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Modal for Goal Deletion */}
      <ConfirmationModal
        isOpen={Boolean(goalToDelete)}
        title="Delete Goal?"
        message={`Are you sure you want to delete "${goalToDelete?.name}"? Its previous logs will be preserved in analytics.`}
        confirmLabel="Delete Goal"
        cancelLabel="Keep Goal"
        isDestructive={true}
        onConfirm={() => {
          if (goalToDelete) {
            onDeleteGoal(goalToDelete.id);
            setGoalToDelete(null);
          }
        }}
        onCancel={() => setGoalToDelete(null)}
      />
    </div>
  );
};
