import React, { useState, useEffect } from 'react';
import { AppSettings, Goal, DailyLogEntry, WeeklyReward, MonthlyReward, Milestone2027 } from '../types';
import { ConfirmationModal } from './ConfirmationModal';
import { CustomSelect } from './CustomSelect';
import { TimePicker12Hour } from './TimePicker12Hour';
import { exportBackupNative, triggerHaptic } from '../services/native';
import { checkNotificationPermission, requestNotificationPermission } from '../services/notifications';
import { formatTime12Hour } from '../utils/dateUtils';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetAllData: () => void;
  fullExportState: {
    goals: Goal[];
    dailyLogs: DailyLogEntry[];
    weeklyRewards: WeeklyReward[];
    monthlyRewards: MonthlyReward[];
    milestones: Milestone2027[];
    settings: AppSettings;
  };
  onImportState: (state: any) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetAllData,
  fullExportState,
  onImportState,
}) => {
  const [weeklyThreshold, setWeeklyThreshold] = useState(settings.weeklyRewardThreshold);
  const [monthlyThreshold, setMonthlyThreshold] = useState(settings.monthlyRewardThreshold);
  const [currency, setCurrency] = useState(settings.currency);
  const [weekStartDay, setWeekStartDay] = useState<0 | 1>(settings.weekStartDay);
  const [dayRolloverHour, setDayRolloverHour] = useState<number>(settings.dayRolloverHour || 0);

  // Section 16: Local Notification State
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled ?? true);
  const [eveningReminderEnabled, setEveningReminderEnabled] = useState(settings.eveningReminderEnabled ?? true);
  const [eveningReminderTime, setEveningReminderTime] = useState(settings.eveningReminderTime || '22:00');
  const [weeklyNudgeEnabled, setWeeklyNudgeEnabled] = useState(settings.weeklyNudgeEnabled ?? true);
  const [weeklyNudgeDay, setWeeklyNudgeDay] = useState<number>(settings.weeklyNudgeDay ?? 0);
  const [weeklyNudgeTime, setWeeklyNudgeTime] = useState(settings.weeklyNudgeTime || '20:00');
  const [dailyCheckpointsEnabled, setDailyCheckpointsEnabled] = useState(settings.dailyCheckpointsEnabled ?? true);
  const [morningBriefingTime, setMorningBriefingTime] = useState(settings.morningBriefingTime || '04:00');
  const [middayAuditTime, setMiddayAuditTime] = useState(settings.middayAuditTime || '12:00');
  const [eveningDefenseTime, setEveningDefenseTime] = useState(settings.eveningDefenseTime || '20:00');
  const [permStatus, setPermStatus] = useState<'granted' | 'denied' | 'prompt'>('granted');

  useEffect(() => {
    checkNotificationPermission().then(setPermStatus);
  }, []);

  const handleRequestPerm = async () => {
    triggerHaptic('light');
    const granted = await requestNotificationPermission();
    setPermStatus(granted ? 'granted' : 'denied');
  };

  const [categories, setCategories] = useState<string[]>(settings?.categories || ['SSC', 'Fitness', 'Fluency', 'Discipline']);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  const [failureReasons, setFailureReasons] = useState<string[]>(settings?.failureReasons || []);
  const [newReasonInput, setNewReasonInput] = useState('');

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('success');
    const updated: AppSettings = {
      ...settings,
      weeklyRewardThreshold: Math.min(100, Math.max(0, Number(weeklyThreshold) || 90)),
      monthlyRewardThreshold: Math.min(100, Math.max(0, Number(monthlyThreshold) || 90)),
      currency: currency.trim() || '₹',
      weekStartDay,
      dayRolloverHour,
      categories,
      failureReasons,
      notificationsEnabled,
      eveningReminderEnabled,
      eveningReminderTime,
      weeklyNudgeEnabled,
      weeklyNudgeDay,
      weeklyNudgeTime,
      dailyCheckpointsEnabled,
      morningBriefingTime,
      middayAuditTime,
      eveningDefenseTime,
    };
    onUpdateSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryInput.trim() || categories.includes(newCategoryInput.trim())) return;
    triggerHaptic('light');
    const updated = [...categories, newCategoryInput.trim()];
    setCategories(updated);
    onUpdateSettings({ ...settings, categories: updated });
    setNewCategoryInput('');
  };

  const handleDeleteCategory = (cat: string) => {
    triggerHaptic('light');
    const updated = categories.filter((c) => c !== cat);
    setCategories(updated);
    onUpdateSettings({ ...settings, categories: updated });
  };

  const handleAddReason = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReasonInput.trim() || failureReasons.includes(newReasonInput.trim())) return;
    triggerHaptic('light');
    const updated = [...failureReasons, newReasonInput.trim()];
    setFailureReasons(updated);
    onUpdateSettings({ ...settings, failureReasons: updated });
    setNewReasonInput('');
  };

  const handleDeleteReason = (reason: string) => {
    triggerHaptic('light');
    const updated = failureReasons.filter((r) => r !== reason);
    setFailureReasons(updated);
    onUpdateSettings({ ...settings, failureReasons: updated });
  };

  const handleExportJSON = async () => {
    triggerHaptic('success');
    const jsonStr = JSON.stringify(fullExportState, null, 2);
    const filename = `rebuild_2027_backup_${new Date().toISOString().split('T')[0]}.json`;
    await exportBackupNative(jsonStr, filename);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.goals && parsed.settings) {
            triggerHaptic('success');
            onImportState(parsed);
            alert('Backup successfully restored!');
          } else {
            triggerHaptic('error');
            alert('Invalid backup file format.');
          }
        } catch (err) {
          triggerHaptic('error');
          alert('Failed to parse JSON file.');
        }
      };
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#0C101D] rounded-3xl p-5 sm:p-8 border border-white/[0.08] shadow-2xl gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block">
            System Preferences
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight break-words">
            Settings & Customization
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Configure reward thresholds, currency symbol, custom categories, and offline backups.
          </p>
        </div>

        {saveSuccess && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 whitespace-nowrap self-start sm:self-auto backdrop-blur-md shrink-0">
            <i className="ri-checkbox-circle-line text-sm shrink-0" /> Settings Saved
          </span>
        )}
      </div>

      {/* Offline Storage Status & Backup Hub */}
      <div className="bg-[#0C101D] rounded-3xl p-5 sm:p-8 border border-white/[0.08] shadow-2xl space-y-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 backdrop-blur-md">
            <i className="ri-database-2-line text-lg text-indigo-400 shrink-0" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-white break-words">
              100% Offline Storage & Backup
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              All data is stored directly in your browser with zero cloud lag. Export anytime to save a portable JSON backup.
            </p>
          </div>
        </div>

        {/* Storage Health Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 bg-[#080C16] rounded-2xl border border-white/[0.06]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Goals</span>
            <p className="text-lg font-bold text-indigo-400 mt-0.5">{fullExportState.goals.filter(g => g.active).length} / {fullExportState.goals.length}</p>
          </div>
          <div className="p-3.5 bg-[#080C16] rounded-2xl border border-white/[0.06]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Daily Logs</span>
            <p className="text-lg font-bold text-emerald-400 mt-0.5">{fullExportState.dailyLogs.length}</p>
          </div>
          <div className="p-3.5 bg-[#080C16] rounded-2xl border border-white/[0.06]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Weekly Rewards</span>
            <p className="text-lg font-bold text-amber-400 mt-0.5">{fullExportState.weeklyRewards.length}</p>
          </div>
          <div className="p-3.5 bg-[#080C16] rounded-2xl border border-white/[0.06]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">2027 Milestones</span>
            <p className="text-lg font-bold text-purple-400 mt-0.5">{fullExportState.milestones.length}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <button
            onClick={handleExportJSON}
            className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold text-slate-200 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 rounded-2xl transition-all whitespace-nowrap cursor-pointer shadow-xs backdrop-blur-md active:scale-95"
          >
            <i className="ri-share-forward-line text-base text-indigo-400 shrink-0" />
            <span className="whitespace-nowrap">Share / Export JSON Backup</span>
          </button>

          <label className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold text-slate-200 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 rounded-2xl transition-all whitespace-nowrap cursor-pointer shadow-xs backdrop-blur-md active:scale-95">
            <i className="ri-upload-2-line text-base text-emerald-400 shrink-0" />
            <span className="whitespace-nowrap">Import Backup File</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={() => {
              triggerHaptic('warning');
              setIsResetModalOpen(true);
            }}
            className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded-2xl transition-all sm:ml-auto whitespace-nowrap cursor-pointer backdrop-blur-md active:scale-95"
          >
            <i className="ri-restart-line text-base shrink-0" />
            <span className="whitespace-nowrap">Reset to Defaults</span>
          </button>
        </div>
      </div>

      {/* General Settings Form */}
      <form
        onSubmit={handleSaveGeneral}
        className="bg-[#0C101D] border-t border-white/10 shadow-2xl rounded-3xl p-5 sm:p-8 space-y-6"
      >
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
          <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-md shrink-0">
            Threshold Engine
          </span>
          <h3 className="text-base font-bold text-white min-w-0 break-words">
            Core Parameters & Thresholds
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5 whitespace-nowrap">
              Weekly Reward Threshold (%)
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min="50"
                max="100"
                value={weeklyThreshold}
                onChange={(e) => setWeeklyThreshold(Number(e.target.value))}
                className="w-full min-h-[48px] px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-[#080C16] border border-white/10 focus:border-indigo-500/50 outline-none text-white"
              />
              <i className="ri-percent-line text-sm text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block whitespace-nowrap">Default: 90% (Green Threshold)</span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5 whitespace-nowrap">
              Monthly Reward Threshold (%)
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min="50"
                max="100"
                value={monthlyThreshold}
                onChange={(e) => setMonthlyThreshold(Number(e.target.value))}
                className="w-full min-h-[48px] px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-[#080C16] border border-white/10 focus:border-indigo-500/50 outline-none text-white"
              />
              <i className="ri-percent-line text-sm text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block whitespace-nowrap">Default: 90% (Monthly Unlocks)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5 whitespace-nowrap">
              Preferred Currency Symbol
            </label>
            <CustomSelect
              value={currency}
              onChange={(val) => setCurrency(String(val))}
              options={[
                { value: '₹', label: '₹ (INR - Indian Rupee)' },
                { value: '$', label: '$ (USD - US Dollar)' },
                { value: '€', label: '€ (EUR - Euro)' },
                { value: '£', label: '£ (GBP - British Pound)' },
                { value: '¥', label: '¥ (JPY - Japanese Yen)' },
              ]}
              ariaLabel="Preferred Currency"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5 whitespace-nowrap">
              Week Starts On
            </label>
            <CustomSelect
              value={weekStartDay}
              onChange={(val) => setWeekStartDay(Number(val) as 0 | 1)}
              options={[
                { value: 1, label: 'Monday' },
                { value: 0, label: 'Sunday' },
              ]}
              ariaLabel="Week Starts On"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5 whitespace-nowrap">
              Day Rollover Time
            </label>
            <CustomSelect
              value={dayRolloverHour}
              onChange={(val) => setDayRolloverHour(Number(val))}
              options={[
                { value: 0, label: '12:00 AM (Midnight)' },
                { value: 1, label: '1:00 AM' },
                { value: 2, label: '2:00 AM' },
                { value: 3, label: '3:00 AM' },
                { value: 4, label: '4:00 AM' },
                { value: 5, label: '5:00 AM' },
              ]}
              ariaLabel="Day Rollover Time"
            />
            <p className="mt-1.5 text-[11px] text-slate-400">If you work late, delay the streak reset.</p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="min-h-[48px] px-8 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm rounded-2xl transition-all whitespace-nowrap cursor-pointer active:scale-95"
          >
            Save parameters
          </button>
        </div>
      </form>

      {/* Offline Local Notifications Center (Section 16) */}
      <div className="bg-[#0C101D] rounded-3xl p-5 sm:p-8 border border-white/[0.08] shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 backdrop-blur-md">
              <i className="ri-notification-3-line text-lg shrink-0" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-white break-words">
                Offline Execution & Check-in Reminders
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                100% device-native alarms. Reminders trigger reliably even when REBUILD is closed.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {permStatus === 'granted' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 whitespace-nowrap">
                <i className="ri-shield-check-line text-sm shrink-0" /> System Active
              </span>
            ) : (
              <button
                type="button"
                onClick={handleRequestPerm}
                className="min-h-[40px] px-3.5 py-1.5 text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-xl cursor-pointer transition-all active:scale-95 whitespace-nowrap"
              >
                Enable Notifications
              </button>
            )}
          </div>
        </div>

        {/* Master Notification Toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#080C16] border border-white/[0.06]">
          <div>
            <h4 className="text-sm font-bold text-white">Enable All Scheduled Reminders</h4>
            <p className="text-xs text-slate-400">Master switch for goal reminders, evening logging, and weekly nudges.</p>
          </div>
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => {
              triggerHaptic('light');
              setNotificationsEnabled(e.target.checked);
              onUpdateSettings({ ...settings, notificationsEnabled: e.target.checked });
            }}
            className="w-5 h-5 rounded-md border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer shrink-0 ml-3"
          />
        </div>

        {notificationsEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 3-Checkpoint Daily Protocol */}
            <div className="p-4 rounded-2xl bg-[#080C16] border border-white/[0.06] space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">3-Checkpoint Daily Protocol</h4>
                  <p className="text-xs text-slate-400">
                    Goals-first neuroscience checkpoints with 7-day quote rotation and audible alert chime.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={dailyCheckpointsEnabled}
                  onChange={(e) => {
                    triggerHaptic('light');
                    setDailyCheckpointsEnabled(e.target.checked);
                    onUpdateSettings({ ...settings, dailyCheckpointsEnabled: e.target.checked });
                  }}
                  className="w-5 h-5 rounded-md border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer shrink-0 ml-3"
                />
              </div>

              {dailyCheckpointsEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 whitespace-nowrap">
                      Dawn Briefing
                    </label>
                    <TimePicker12Hour
                      value={morningBriefingTime}
                      onChange={(val) => {
                        setMorningBriefingTime(val);
                        onUpdateSettings({ ...settings, morningBriefingTime: val });
                      }}
                      allowNone={false}
                      ariaLabel="Dawn Briefing Time"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">Default: 4:00 AM (Cortisol Focus)</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 whitespace-nowrap">
                      Midday Vector Audit
                    </label>
                    <TimePicker12Hour
                      value={middayAuditTime}
                      onChange={(val) => {
                        setMiddayAuditTime(val);
                        onUpdateSettings({ ...settings, middayAuditTime: val });
                      }}
                      allowNone={false}
                      ariaLabel="Midday Audit Time"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">Default: 12:00 PM (Dopamine Reset)</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 whitespace-nowrap">
                      Evening Streak Defense
                    </label>
                    <TimePicker12Hour
                      value={eveningDefenseTime}
                      onChange={(val) => {
                        setEveningDefenseTime(val);
                        onUpdateSettings({ ...settings, eveningDefenseTime: val });
                      }}
                      allowNone={false}
                      ariaLabel="Evening Defense Time"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">Default: 8:00 PM (Loss Aversion)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Daily Evening Logging Reminder */}
            <div className="p-4 rounded-2xl bg-[#080C16] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Daily Evening Check-in</h4>
                  <p className="text-xs text-slate-400">Non-shame reminder to log daily YES/NO results.</p>
                </div>
                <input
                  type="checkbox"
                  checked={eveningReminderEnabled}
                  onChange={(e) => {
                    triggerHaptic('light');
                    setEveningReminderEnabled(e.target.checked);
                    onUpdateSettings({ ...settings, eveningReminderEnabled: e.target.checked });
                  }}
                  className="w-5 h-5 rounded-md border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer shrink-0 ml-3"
                />
              </div>

              {eveningReminderEnabled && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 whitespace-nowrap">
                    Evening Reminder Time
                  </label>
                  <TimePicker12Hour
                    value={eveningReminderTime}
                    onChange={(val) => {
                      setEveningReminderTime(val);
                      onUpdateSettings({ ...settings, eveningReminderTime: val });
                    }}
                    allowNone={false}
                    ariaLabel="Evening Reminder Time"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">Default: 10:00 PM</span>
                </div>
              )}
            </div>

            {/* Weekly Review Nudge */}
            <div className="p-4 rounded-2xl bg-[#080C16] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Weekly Review Nudge</h4>
                  <p className="text-xs text-slate-400">Prompts you to review consistency and unlock rewards.</p>
                </div>
                <input
                  type="checkbox"
                  checked={weeklyNudgeEnabled}
                  onChange={(e) => {
                    triggerHaptic('light');
                    setWeeklyNudgeEnabled(e.target.checked);
                    onUpdateSettings({ ...settings, weeklyNudgeEnabled: e.target.checked });
                  }}
                  className="w-5 h-5 rounded-md border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer shrink-0 ml-3"
                />
              </div>

              {weeklyNudgeEnabled && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 whitespace-nowrap">
                      Day
                    </label>
                    <CustomSelect
                      value={weeklyNudgeDay}
                      onChange={(val) => {
                        const numVal = Number(val);
                        setWeeklyNudgeDay(numVal);
                        onUpdateSettings({ ...settings, weeklyNudgeDay: numVal });
                      }}
                      options={[
                        { value: 0, label: 'Sunday' },
                        { value: 6, label: 'Saturday' },
                        { value: 1, label: 'Monday' },
                      ]}
                      ariaLabel="Weekly Nudge Day"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 whitespace-nowrap">
                      Time
                    </label>
                    <TimePicker12Hour
                      value={weeklyNudgeTime}
                      onChange={(val) => {
                        setWeeklyNudgeTime(val);
                        onUpdateSettings({ ...settings, weeklyNudgeTime: val });
                      }}
                      allowNone={false}
                      ariaLabel="Weekly Nudge Time"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Battery Optimization Guidance */}
        <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-slate-300 flex items-start gap-2.5">
          <i className="ri-battery-charge-line text-base text-indigo-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Android Battery Tip:</strong> For guaranteed delivery on Android phones (Xiaomi, Samsung, Oppo), ensure REBUILD is set to Unrestricted Battery in App Info settings.
          </p>
        </div>
      </div>

      {/* Goal Categories Manager */}
      <div className="bg-[#0C101D] rounded-3xl p-5 sm:p-8 border border-white/[0.08] shadow-2xl space-y-4">
        <h3 className="text-base font-bold text-white break-words">
          Goal Categories Manager
        </h3>
        <p className="text-xs text-slate-400">
          Categories organize your goals across SSC, English, Fitness, Self-Control, Career, and Custom pillars.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-2">
          {categories.map((cat) => (
            <div
              key={cat}
              className="flex items-center justify-between min-h-[48px] px-3.5 py-2.5 rounded-2xl bg-[#080C16] border border-white/[0.08] text-xs sm:text-sm font-bold text-slate-200 overflow-hidden"
            >
              <span className="truncate pr-1.5">{cat}</span>
              {categories.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(cat)}
                  aria-label={`Delete ${cat} category`}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer active:scale-90 shrink-0"
                >
                  <i className="ri-delete-bin-line text-sm shrink-0" />
                </button>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-2 pt-2">
          <input
            type="text"
            placeholder="Add new category..."
            value={newCategoryInput}
            autoCapitalize="sentences"
            spellCheck={false}
            onChange={(e) => setNewCategoryInput(e.target.value)}
            className="flex-1 min-h-[48px] px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-950/80 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-500"
          />
          <button
            type="submit"
            className="min-h-[48px] px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/50 rounded-2xl whitespace-nowrap cursor-pointer transition-all shadow-sm active:scale-95 flex items-center justify-center"
          >
            + Add Category
          </button>
        </form>
      </div>

      {/* Predefined Failure Reasons Manager */}
      <div className="bg-[#0C101D] rounded-3xl p-5 sm:p-8 border border-white/[0.08] shadow-2xl space-y-4">
        <h3 className="text-base font-bold text-white break-words">
          Predefined Failure Reasons
        </h3>
        <p className="text-xs text-slate-400">
          When you click NO on any goal, these quick reasons let you record friction points in under 2 seconds.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
          {failureReasons.map((reason) => (
            <div
              key={reason}
              className="flex items-center justify-between min-h-[48px] px-3.5 py-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs sm:text-sm font-bold text-rose-300 backdrop-blur-md overflow-hidden"
            >
              <span className="truncate pr-1.5">{reason}</span>
              {failureReasons.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteReason(reason)}
                  aria-label={`Delete reason: ${reason}`}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer active:scale-90 shrink-0"
                >
                  <i className="ri-delete-bin-line text-sm shrink-0" />
                </button>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleAddReason} className="flex flex-col sm:flex-row gap-2 pt-2">
          <input
            type="text"
            placeholder="Add new failure reason..."
            value={newReasonInput}
            autoCapitalize="sentences"
            spellCheck={false}
            onChange={(e) => setNewReasonInput(e.target.value)}
            className="flex-1 min-h-[48px] px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-950/80 border border-slate-700 text-white focus:ring-2 focus:ring-rose-500 focus:outline-none placeholder-slate-500"
          />
          <button
            type="submit"
            className="min-h-[48px] px-6 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-2xl whitespace-nowrap cursor-pointer transition-all shadow-sm shadow-rose-600/30 active:scale-95 flex items-center justify-center"
          >
            + Add Reason
          </button>
        </form>
      </div>

      {/* Reset Confirmation */}
      <ConfirmationModal
        isOpen={isResetModalOpen}
        title="Reset to Starter Defaults?"
        message="This will reset all goals, logs, and rewards to fresh starter presets. Make sure to export a JSON backup first if needed."
        confirmLabel="Reset System"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          onResetAllData();
          setIsResetModalOpen(false);
        }}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  );
};


