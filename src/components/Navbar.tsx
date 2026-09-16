import React, { useState, useRef, useEffect } from 'react';
import { triggerHaptic } from '../services/native';

export type NavTab =
  | 'today'
  | 'goals'
  | 'weekly'
  | 'monthly'
  | 'milestones'
  | 'analysis'
  | 'theory'
  | 'settings';

interface NavbarProps {
  currentTab?: NavTab;
  activeTab?: NavTab;
  onSelectTab?: (tab: NavTab) => void;
  onTabChange?: (tab: NavTab) => void;
  selectedDate?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  activeTab,
  onSelectTab,
  onTabChange,
}) => {
  const current = currentTab || activeTab || 'today';
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const desktopMoreMenuRef = useRef<HTMLDivElement>(null);
  const mobileMorePopoverRef = useRef<HTMLDivElement>(null);
  const moreTriggerButtonRef = useRef<HTMLButtonElement>(null);

  const handleSelectTab = (tab: NavTab) => {
    triggerHaptic('light');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setIsMoreSheetOpen(false);
    if (onSelectTab) onSelectTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  // Close desktop dropdown or mobile popover if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const clickedInsideDesktop = desktopMoreMenuRef.current?.contains(target);
      const clickedInsideMobilePopover = mobileMorePopoverRef.current?.contains(target);
      const clickedInsideMobileTrigger = moreTriggerButtonRef.current?.contains(target);

      if (!clickedInsideDesktop && !clickedInsideMobilePopover && !clickedInsideMobileTrigger) {
        setIsMoreSheetOpen(false);
      }
    };
    if (isMoreSheetOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMoreSheetOpen]);

  // Register hardware back-button dismiss handler when More sheet/menu is open
  useEffect(() => {
    if (!isMoreSheetOpen) return;
    const handler = () => {
      setIsMoreSheetOpen(false);
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
  }, [isMoreSheetOpen]);

  // Check if active tab is one of the secondary items in More popover
  const isSecondaryActive = current === 'monthly' || current === 'analysis' || current === 'theory';

  const getSecondaryLabel = () => {
    if (current === 'monthly') return 'Monthly';
    if (current === 'analysis') return 'Analysis';
    if (current === 'theory') return 'Theory';
    return 'More';
  };

  const horizonYear = new Date().getFullYear() + 1;

  return (
    <>
      {/* Desktop & Mobile Main Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo & Brand Identity */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSelectTab('today')}
                aria-label="Go to Today"
                className="flex items-center gap-2 sm:gap-2.5 text-left group focus:outline-hidden cursor-pointer min-h-[44px]"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/30 border border-indigo-400/30">
                  <i className="ri-fire-fill text-lg sm:text-xl text-white" />
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base sm:text-xl tracking-tight text-white whitespace-nowrap">
                      REBUILD
                    </span>
                    <span className="px-1.5 py-0.5 text-[11px] font-bold bg-amber-500/15 text-amber-300 rounded-full border border-amber-500/30 backdrop-blur-md whitespace-nowrap">
                      {horizonYear}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-400 hidden sm:block whitespace-nowrap">
                    Goal Execution & Consistency Engine
                  </p>
                </div>
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner">
              <button
                id="nav-tab-today"
                onClick={() => handleSelectTab('today')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer min-h-[44px] ${
                  current === 'today'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <i className="ri-sword-line text-sm shrink-0" />
                Today
              </button>

              <button
                id="nav-tab-goals"
                onClick={() => handleSelectTab('goals')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer min-h-[44px] ${
                  current === 'goals'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <i className="ri-focus-3-line text-sm shrink-0" />
                Goals
              </button>

              <button
                id="nav-tab-weekly"
                onClick={() => handleSelectTab('weekly')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer min-h-[44px] ${
                  current === 'weekly'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <i className="ri-vip-diamond-line text-sm shrink-0" />
                Weekly
              </button>

            </nav>

            {/* Header Right Actions: Settings Button + More Menu Popover Trigger */}
            <div className="flex items-center gap-2">
              {/* Dedicated Settings Button Across ALL Screens on Mobile & Desktop */}
              <button
                id="header-settings-btn"
                onClick={() => {
                  triggerHaptic('light');
                  handleSelectTab('settings');
                }}
                aria-label="Settings"
                title="Settings"
                className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl border flex items-center justify-center active:scale-95 cursor-pointer transition-all ${
                  current === 'settings'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                    : 'bg-[#0C101D] border-white/[0.08] text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <i className="ri-settings-3-line text-lg" />
              </button>

              {/* Relative "More / Vault" Dropdown Trigger for Mobile & Desktop */}
              <div className="relative" ref={desktopMoreMenuRef}>
                <button
                  id="header-more-btn"
                  ref={moreTriggerButtonRef}
                  onClick={() => {
                    triggerHaptic('light');
                    setIsMoreSheetOpen((prev) => !prev);
                  }}
                  aria-label="More views"
                  title="More Views"
                  aria-expanded={isMoreSheetOpen}
                  className={`min-w-[44px] min-h-[44px] h-11 px-3 rounded-xl border flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer transition-all backdrop-blur-md ${
                    isSecondaryActive || isMoreSheetOpen
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm shadow-indigo-500/20'
                      : 'bg-[#0C101D] border-white/[0.08] text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <i className={`ri-apps-2-line text-lg shrink-0 ${isSecondaryActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span className="font-bold text-xs hidden sm:inline">{getSecondaryLabel()}</span>
                  <i className={`ri-arrow-down-s-line text-sm shrink-0 transition-transform duration-200 hidden sm:inline ${isMoreSheetOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Relative Popover Menu Anchored Directly Under Top Header */}
                {isMoreSheetOpen && (
                  <div
                    ref={mobileMorePopoverRef}
                    role="dialog"
                    aria-modal="true"
                    data-modal="true"
                    aria-label="More options"
                    className="absolute right-0 top-[calc(100%+0.5rem)] w-64 rounded-2xl bg-[#0C101D] backdrop-blur-3xl border border-white/[0.08] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.06] before:to-transparent before:pointer-events-none overflow-hidden"
                  >
                    <div className="px-3 py-1.5 pb-2 mb-1 border-b border-white/[0.08] relative z-10">
                      <span className="text-xs font-semibold text-slate-400">
                        Vault & Reviews
                      </span>
                    </div>

                    <button
                      id="popover-tab-monthly"
                      onClick={() => handleSelectTab('monthly')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer min-h-[44px] active:scale-[0.98] relative z-10 ${
                        current === 'monthly'
                          ? 'bg-indigo-500/10 border border-indigo-500/20 text-white'
                          : 'text-slate-300 hover:bg-white/[0.04] hover:text-white border border-transparent'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          current === 'monthly'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}
                      >
                        <i className="ri-calendar-event-line text-base shrink-0" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-white">Monthly Review</div>
                        <div className={`text-[11px] font-medium ${current === 'monthly' ? 'text-indigo-300' : 'text-slate-400'}`}>4-Week consistency &amp; reward</div>
                      </div>
                    </button>

                    <button
                      id="popover-tab-analysis"
                      onClick={() => handleSelectTab('analysis')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer min-h-[44px] active:scale-[0.98] mt-1 relative z-10 ${
                        current === 'analysis'
                          ? 'bg-indigo-500/10 border border-indigo-500/20 text-white'
                          : 'text-slate-300 hover:bg-white/[0.04] hover:text-white border border-transparent'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          current === 'analysis'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}
                      >
                        <i className="ri-bar-chart-2-line text-base shrink-0" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-white">Analysis</div>
                        <div className={`text-[11px] font-medium ${current === 'analysis' ? 'text-indigo-300' : 'text-slate-400'}`}>Stats, charts & performance</div>
                      </div>
                    </button>

                    <button
                      id="popover-tab-theory"
                      onClick={() => handleSelectTab('theory')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer min-h-[44px] active:scale-[0.98] mt-1 relative z-10 ${
                        current === 'theory'
                          ? 'bg-amber-500/10 border border-amber-500/20 text-white'
                          : 'text-slate-300 hover:bg-white/[0.04] hover:text-white border border-transparent'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          current === 'theory'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        <i className="ri-book-open-line text-base shrink-0" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-white">Theoretical Foundation</div>
                        <div className={`text-[11px] font-medium ${current === 'theory' ? 'text-amber-300' : 'text-slate-400'}`}>Neuroscience & laws</div>
                      </div>
                    </button>

                    <button
                      id="popover-tab-milestones"
                      onClick={() => handleSelectTab('milestones')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer min-h-[44px] active:scale-[0.98] mt-1 relative z-10 ${
                        current === 'milestones'
                          ? 'bg-amber-500/10 border border-amber-500/20 text-white'
                          : 'text-slate-300 hover:bg-white/[0.04] hover:text-white border border-transparent'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          current === 'milestones'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        <i className="ri-vip-crown-line text-base shrink-0" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-white">{horizonYear} Milestones</div>
                        <div className={`text-[11px] font-medium ${current === 'milestones' ? 'text-amber-300' : 'text-slate-400'}`}>Long-term vision</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Dedicated Mobile Bottom Navigation Bar (Strictly 4 Primary Touch Targets >=48px) */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/40 backdrop-blur-xl border-t border-white/10 px-2 pt-1 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-lg safe-bottom">
        <div className="flex items-center justify-center gap-[10px] mx-auto">
          {/* 1. Today */}
          <button
            id="mobile-tab-today"
            onClick={() => handleSelectTab('today')}
            aria-label="Today"
            className={`relative flex flex-col items-center justify-center w-[64px] min-h-[50px] transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
              current === 'today' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <div className={`w-full flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all`}>
              <i className="ri-sword-line text-lg mb-0.5 shrink-0" />
              <span className="text-[11px] uppercase tracking-wider font-semibold whitespace-nowrap leading-none">Today</span>
            </div>
            {current === 'today' && <div className="absolute -top-1.5 w-8 h-1 bg-indigo-500 rounded-b-md" />}
          </button>

          {/* 2. Goals */}
          <button
            id="mobile-tab-goals"
            onClick={() => handleSelectTab('goals')}
            aria-label="Goals"
            className={`relative flex flex-col items-center justify-center w-[64px] min-h-[50px] transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
              current === 'goals' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <div className={`w-full flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all`}>
              <i className="ri-focus-3-line text-lg mb-0.5 shrink-0" />
              <span className="text-[11px] uppercase tracking-wider font-semibold whitespace-nowrap leading-none">Goals</span>
            </div>
            {current === 'goals' && <div className="absolute -top-1.5 w-8 h-1 bg-indigo-500 rounded-b-md" />}
          </button>

          {/* 3. Weekly */}
          <button
            id="mobile-tab-weekly"
            onClick={() => handleSelectTab('weekly')}
            aria-label="Weekly Rewards"
            className={`relative flex flex-col items-center justify-center w-[64px] min-h-[50px] transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
              current === 'weekly' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <div className={`w-full flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all`}>
              <i className="ri-vip-diamond-line text-lg mb-0.5 shrink-0" />
              <span className="text-[11px] uppercase tracking-wider font-semibold whitespace-nowrap leading-none">Weekly</span>
            </div>
            {current === 'weekly' && <div className="absolute -top-1.5 w-8 h-1 bg-indigo-500 rounded-b-md" />}
          </button>

          {/* 4. Milestones */}
          <button
            id="mobile-tab-milestones"
            onClick={() => handleSelectTab('milestones')}
            aria-label="2027 Milestones"
            className={`relative flex flex-col items-center justify-center w-[64px] min-h-[50px] transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
              current === 'milestones' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <div className={`w-full flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all`}>
              <i className="ri-vip-crown-line text-lg mb-0.5 shrink-0" />
              <span className="text-[11px] uppercase tracking-wider font-semibold whitespace-nowrap leading-none">{horizonYear}</span>
            </div>
            {current === 'milestones' && <div className="absolute -top-1.5 w-8 h-1 bg-amber-500 rounded-b-md" />}
          </button>
        </div>
      </nav>

      {/* Tap-outside Backdrop for Top Header Popover */}
      {isMoreSheetOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsMoreSheetOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};



