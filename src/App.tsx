import React, { useState, useEffect } from 'react';
import { ActiveTab } from './types';
import { getTodayDateString } from './utils/dateUtils';
import { Navbar } from './components/Navbar';
import { TodayView } from './components/TodayView';
import { GoalsView } from './components/GoalsView';
import { WeeklyRewardsView } from './components/WeeklyRewardsView';
import { MonthlyView } from './components/MonthlyView';
import { Milestones2027View } from './components/Milestones2027View';
import { AnalysisView } from './components/AnalysisView';
import { TheoreticalFoundationView } from './components/TheoreticalFoundationView';
import { SettingsView } from './components/SettingsView';
import { initNativeSystemUI, isNativePlatform } from './services/native';
import { syncNotificationSchedule } from './services/notifications';
import { App as CapApp } from '@capacitor/app';
import { AppProvider, useAppContext } from './context/AppContext';

const AppContent = () => {
  const {
    goals,
    dailyLogs,
    weeklyRewards,
    monthlyRewards,
    milestones,
    settings,
    isLoaded,
    addGoal,
    updateGoal,
    deleteGoal,
    recordExecution,
    clearExecution,
    updateSettings,
    saveWeeklyReward,
    saveMonthlyReward,
    saveMilestone,
    deleteMilestone,
    importState,
    resetAllData,
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [currentDate, setCurrentDate] = useState<string>(getTodayDateString());

  useEffect(() => {
    if (settings) {
      setCurrentDate(getTodayDateString(settings.dayRolloverHour || 0));
    }
  }, [settings?.dayRolloverHour]);

  // Scroll to top on active tab change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);

  // Global modal / back stack dismissal helper
  const dismissActiveModalOrSheet = (): boolean => {
    // 1. Programmatic back stack (Navbar More menu, ConfirmationModal, etc.)
    const win = window as any;
    if (win.__REBUILD_BACK_STACK__ && win.__REBUILD_BACK_STACK__.length > 0) {
      const handler = win.__REBUILD_BACK_STACK__.pop();
      if (handler && handler()) {
        return true;
      }
    }

    // 2. DOM-based modal / bottom sheet / popover detection
    // Modals and sheets are rendered with .fixed.inset-0.z-50, [role="dialog"], or [data-modal="true"].
    const modalOverlays = Array.from(
      document.querySelectorAll<HTMLElement>(
        '.fixed.inset-0.z-50, [role="dialog"], [data-modal="true"]'
      )
    ).filter((el) => {
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
    });

    if (modalOverlays.length > 0) {
      // Top-most modal in DOM hierarchy
      const topModal = modalOverlays[modalOverlays.length - 1];

      // Find close or cancel button inside the top modal
      const closeOrCancelBtn =
        topModal.querySelector<HTMLElement>(
          'button[aria-label*="close" i], button[aria-label*="cancel" i], button:has(.ri-close-line)'
        ) ||
        Array.from(topModal.querySelectorAll<HTMLButtonElement>('button')).find((btn) => {
          const text = btn.textContent?.trim().toLowerCase();
          const hasCloseIcon = btn.querySelector('.ri-close-line') !== null;
          return text === 'cancel' || text === 'close' || hasCloseIcon;
        });

      if (closeOrCancelBtn) {
        closeOrCancelBtn.click();
        return true;
      }

      // Fallback: backdrop click
      const backdrop = topModal.querySelector<HTMLElement>('[class*="inset-0"]') || topModal;
      if (backdrop && backdrop !== topModal) {
        backdrop.click();
        return true;
      }
      topModal.click();
      return true;
    }

    return false;
  };

  // Hardware back button action handler
  const handleHardwareBack = () => {
    // If a modal, bottom sheet, or popover is open, dismiss it first
    const modalDismissed = dismissActiveModalOrSheet();
    if (modalDismissed) {
      return;
    }

    // If no modal is open, return to 'today' tab, or exit if already on 'today'
    setActiveTab((prev) => {
      if (prev !== 'today') {
        return 'today';
      }
      CapApp.exitApp();
      return prev;
    });
  };

  // Native UI setup and Android Hardware Back Button listener
  useEffect(() => {
    initNativeSystemUI();

    // Expose handlers globally for testability and cross-component back stack awareness
    const win = window as any;
    win.__REBUILD_DISMISS_MODAL__ = dismissActiveModalOrSheet;
    win.__REBUILD_HARDWARE_BACK__ = handleHardwareBack;

    // Keyboard back / escape support for ergonomics & testing
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleHardwareBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    let removeNativeListener: (() => void) | undefined;
    if (isNativePlatform()) {
      const backListener = CapApp.addListener('backButton', handleHardwareBack);
      removeNativeListener = () => {
        backListener.then((sub) => sub.remove());
      };
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (removeNativeListener) {
        removeNativeListener();
      }
    };
  }, []);

  // Synchronize offline local notifications rolling schedule on changes and app resume
  useEffect(() => {
    if (!isLoaded || !settings) return;
    syncNotificationSchedule(goals, settings);

    if (isNativePlatform()) {
      const appStateSub = CapApp.addListener('appStateChange', (state) => {
        if (state.isActive) {
          syncNotificationSchedule(goals, settings);
        }
      });
      return () => {
        appStateSub.then((sub) => sub.remove());
      };
    }
  }, [goals, settings, isLoaded]);

  if (!isLoaded || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090D16] text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
            Loading REBUILD — {new Date().getFullYear() + 1} System...
          </span>
        </div>
      </div>
    );
  }

  // --- Handlers that wrap Context functions ---

  const handleToggleGoalActive = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      updateGoal({ ...goal, active: !goal.active });
    }
  };

  const handleClaimWeeklyReward = (rewardId: string, actualSpend: number) => {
    const w = weeklyRewards.find((r) => r.id === rewardId);
    if (w) {
      saveWeeklyReward({
        ...w,
        isClaimed: true,
        actualSpend,
        claimedAt: new Date().toISOString(),
      });
    }
  };

  const handleClaimMonthlyReward = (rewardId: string) => {
    const m = monthlyRewards.find((r) => r.id === rewardId);
    if (m) {
      saveMonthlyReward({
        ...m,
        isClaimed: true,
        claimedAt: new Date().toISOString(),
      });
    }
  };

  const handleDeleteMilestone = (id: string) => {
    deleteMilestone(id);
  };

  const handleToggleMilestoneAchieved = (id: string, achieved: boolean) => {
    const item = milestones.find((m) => m.id === id);
    if (item) {
      saveMilestone({
        ...item,
        achieved,
        achievedDate: achieved ? new Date().toISOString().split('T')[0] : undefined,
      });
    }
  };

  const fullExportState = {
    goals,
    dailyLogs,
    weeklyRewards,
    monthlyRewards,
    milestones,
    settings,
  };

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col font-sans relative selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Fixed Reactive Cyber Aurora & Micro-Dot Canvas Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Subtle Cyber Micro-Dot Matrix */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:28px_28px] opacity-70" />

        {/* Primary Indigo Accent Halo (Restrained Gamification) */}
        <div className="absolute -top-36 right-0 sm:right-10 w-[42rem] h-[42rem] bg-indigo-600/[0.08] rounded-full blur-[130px]" style={{ willChange: 'transform', transform: 'translateZ(0)' }} />

        {/* Soft Ambient Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#070A12]/40 via-transparent to-[#070A12]/80" />
      </div>

      {/* Top Navigation Header */}
      <Navbar
        currentTab={activeTab}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }}
        selectedDate={currentDate}
      />

      {/* Main Content Area - Mobile-First Focused Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-[max(4.75rem,calc(env(safe-area-inset-top)+4.75rem))] sm:pt-[max(6rem,calc(env(safe-area-inset-top)+5.75rem))] pb-[max(4.5rem,calc(env(safe-area-inset-bottom)+4.25rem))] md:pb-8 relative z-10">
        <div className={activeTab === 'today' ? 'block' : 'hidden'}>
          <TodayView
            currentDate={currentDate}
            goals={goals}
            dailyLogs={dailyLogs}
            settings={settings}
            onRecordExecution={recordExecution}
            onClearExecution={clearExecution}
            onChangeDate={setCurrentDate}
            onNavigateToGoals={() => setActiveTab('goals')}
            onAddGoal={addGoal}
          />
        </div>

        <div className={activeTab === 'goals' ? 'block' : 'hidden'}>
          <GoalsView
            goals={goals}
            settings={settings}
            onAddGoal={addGoal}
            onUpdateGoal={updateGoal}
            onDeleteGoal={deleteGoal}
            onToggleGoalActive={handleToggleGoalActive}
          />
        </div>

        <div className={activeTab === 'weekly' ? 'block' : 'hidden'}>
          <WeeklyRewardsView
            currentDate={currentDate}
            goals={goals}
            dailyLogs={dailyLogs}
            weeklyRewards={weeklyRewards}
            settings={settings}
            onSaveWeeklyReward={saveWeeklyReward}
            onClaimWeeklyReward={handleClaimWeeklyReward}
          />
        </div>

        <div className={activeTab === 'monthly' ? 'block' : 'hidden'}>
          <MonthlyView
            currentDate={currentDate}
            goals={goals}
            dailyLogs={dailyLogs}
            monthlyRewards={monthlyRewards}
            settings={settings}
            onSaveMonthlyReward={saveMonthlyReward}
            onClaimMonthlyReward={handleClaimMonthlyReward}
          />
        </div>

        <div className={activeTab === 'milestones' ? 'block' : 'hidden'}>
          <Milestones2027View
            milestones={milestones}
            settings={settings}
            onAddMilestone={saveMilestone}
            onUpdateMilestone={saveMilestone}
            onDeleteMilestone={handleDeleteMilestone}
            onToggleAchieved={handleToggleMilestoneAchieved}
          />
        </div>

        <div className={activeTab === 'analysis' ? 'block' : 'hidden'}>
          <AnalysisView
            currentDate={currentDate}
            goals={goals}
            dailyLogs={dailyLogs}
            settings={settings}
          />
        </div>

        <div className={activeTab === 'theory' ? 'block' : 'hidden'}>
          <TheoreticalFoundationView
            dailyLogs={dailyLogs}
          />
        </div>

        <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
          <SettingsView
            settings={settings}
            onUpdateSettings={updateSettings}
            onResetAllData={resetAllData}
            fullExportState={fullExportState}
            onImportState={importState}
          />
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
