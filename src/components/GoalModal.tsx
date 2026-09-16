import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Goal, GoalFrequency } from '../types';
import { CustomSelect } from './CustomSelect';
import { TimePicker12Hour } from './TimePicker12Hour';
import { triggerHaptic } from '../services/native';
import { requestNotificationPermission } from '../services/notifications';
import { formatTime12Hour } from '../utils/dateUtils';

export interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGoal: (goal: Goal) => void;
  editingGoal?: Goal | null;
  categories?: string[];
  currentDate?: string;
  badgeTitle?: string;
  submitButtonText?: string;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSaveGoal,
  editingGoal = null,
  categories = ['General', 'Study', 'Fitness'],
  currentDate = new Date().toISOString().split('T')[0],
  badgeTitle,
  submitButtonText,
}) => {
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formTarget, setFormTarget] = useState('');
  const [formFrequency, setFormFrequency] = useState<GoalFrequency>('Daily');
  const [formReminderTime, setFormReminderTime] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formIsBaselineProtector, setFormIsBaselineProtector] = useState(false);
  const [formArchived, setFormArchived] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (editingGoal) {
      setFormName(editingGoal.name || '');
      setFormCategory(editingGoal.category || categories[0] || 'General');
      setFormTarget(editingGoal.target || '');
      setFormFrequency(editingGoal.frequency || 'Daily');
      setFormReminderTime(editingGoal.reminderTime || '');
      setFormNotes(editingGoal.notes || '');
      setFormIsBaselineProtector(editingGoal.isBaselineProtector || false);
      setFormArchived(editingGoal.archived || false);
    } else {
      setFormName('');
      setFormCategory(categories[0] || 'General');
      setFormTarget('');
      setFormFrequency('Daily');
      setFormReminderTime('');
      setFormNotes('');
      setFormIsBaselineProtector(false);
      setFormArchived(false);
    }
    setFormError('');
  }, [editingGoal, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Goal Name cannot be empty.');
      triggerHaptic('error');
      return;
    }
    if (!formTarget.trim()) {
      setFormError('Daily Target cannot be empty.');
      triggerHaptic('error');
      return;
    }

    setFormError('');
    triggerHaptic('success');

    const updatedGoal: Goal = {
      ...(editingGoal || {}),
      id: editingGoal ? editingGoal.id : `g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: formName.trim(),
      category: formCategory,
      target: formTarget.trim(),
      frequency: formFrequency,
      reminderTime: formReminderTime.trim() ? formReminderTime.trim() : undefined,
      durationMinutes: editingGoal?.durationMinutes || 60,
      startDate: editingGoal?.startDate || currentDate,
      active: formArchived ? false : (editingGoal ? editingGoal.active : true),
      archived: formArchived,
      notes: formNotes.trim(),
      isBaselineProtector: formIsBaselineProtector,
    };

    if (formReminderTime.trim()) {
      requestNotificationPermission().catch(() => {});
    }

    onSaveGoal(updatedGoal);
    onClose();
  };

  const currentBadge = badgeTitle || (editingGoal ? 'Target Calibration' : 'Skill Blueprint');
  const currentSubmitText = submitButtonText || (editingGoal ? 'Update goal' : 'Deploy goal');

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editingGoal ? 'Edit Goal Target' : 'Create New Goal'}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => {
        setFormError('');
        onClose();
      }}
    >
      {/* Modal Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#0C101D] border border-white/5 shadow-2xl rounded-3xl max-h-[85vh] flex flex-col text-white animate-in zoom-in-95 duration-150 overflow-hidden"
      >
        
        {/* Pinned Modal Header */}
        <div className="p-5 pb-2 shrink-0 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-md">
                  {currentBadge}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white break-words">
                {editingGoal ? 'Edit Goal Target' : 'Create New Goal'}
              </h3>
              {/* Ambient Header Glow */}
              <div className="absolute -top-1/2 -left-1/2 w-full aspect-square rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none -z-10" />
            </div>
            <button
              onClick={() => {
                setFormError('');
                onClose();
              }}
              aria-label="Close goal editor"
              className="w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-white/10 active:scale-95 cursor-pointer shrink-0 transition-all"
            >
              <i className="ri-close-line text-xl shrink-0" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form id="goal-editor-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 relative z-10 pb-10 sm:pb-14">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
              Goal Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Maths Practice, Gym Workout, Deep Work..."
              value={formName}
              autoCapitalize="sentences"
              spellCheck={false}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 text-xs rounded-2xl bg-[#090D16] border border-white/5 shadow-inner focus:border-indigo-500/50 outline-none text-white placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Category
              </label>
              <CustomSelect
                value={formCategory}
                onChange={(val) => setFormCategory(String(val))}
                options={categories}
                ariaLabel="Goal Category"
                relativePopup={true}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Daily Target *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 1 hour, 50 pages, 1 test"
                value={formTarget}
                autoCapitalize="sentences"
                spellCheck={false}
                onChange={(e) => setFormTarget(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-xs rounded-2xl bg-[#090D16] border border-white/5 shadow-inner focus:border-indigo-500/50 outline-none text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Frequency
              </label>
              <CustomSelect
                value={formFrequency}
                onChange={(val) => setFormFrequency(val as GoalFrequency)}
                options={['Daily', 'Weekly', 'Mon-Fri', 'Weekends']}
                ariaLabel="Goal Frequency"
                relativePopup={true}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Reminder
              </label>
              <TimePicker12Hour
                value={formReminderTime}
                onChange={setFormReminderTime}
                allowNone={true}
                ariaLabel="Goal Reminder Time"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
              Strategy / Focus Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Key focus areas, mindset trigger, or execution rules..."
              value={formNotes}
              autoCapitalize="sentences"
              spellCheck={false}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-[#090D16] border border-white/5 shadow-inner focus:border-indigo-500/50 outline-none text-white placeholder-slate-500 resize-none"
            />
          </div>

          {/* Baseline Protector Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
            <div className="pr-3">
              <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <i className="ri-shield-flash-line text-sm" />
                Dopamine Baseline Protector
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                Enable for "negative" goals (e.g. No scrolling, No junk food). Failing this triggers a biological reset warning.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formIsBaselineProtector}
                onChange={(e) => {
                  triggerHaptic('light');
                  setFormIsBaselineProtector(e.target.checked);
                }}
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 peer-checked:after:bg-white after:border-slate-400 peer-checked:after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500" />
            </label>
          </div>

          {/* Archive option in edit mode */}
          {editingGoal && (
            <div className="flex items-center gap-2.5 pt-1">
              <input
                type="checkbox"
                id="archive-checkbox"
                checked={formArchived}
                onChange={(e) => setFormArchived(e.target.checked)}
                className="w-5 h-5 rounded-md border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950/80 cursor-pointer"
              />
              <label htmlFor="archive-checkbox" className="text-xs font-bold text-slate-300 cursor-pointer">
                Archive this goal (hidden from Today and daily scoring)
              </label>
            </div>
          )}
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

        {/* Pinned Sticky Action Footer with Safe Area */}
        <div className="p-4 bg-transparent flex items-center gap-3 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))] relative z-10">
          <button
            type="button"
            onClick={() => {
              setFormError('');
              onClose();
            }}
            className="flex-1 min-h-[48px] px-4 py-2.5 text-sm font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl cursor-pointer whitespace-nowrap transition-all active:scale-95 flex items-center justify-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="goal-editor-form"
            className="flex-1 min-h-[48px] px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.3)] rounded-2xl cursor-pointer whitespace-nowrap active:scale-95 flex items-center justify-center"
          >
            {currentSubmitText}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
