# Comprehensive Survey & UI Execution Loop Audit Report

**Project**: REBUILD (Offline-First Capacitor Mobile App for Android & iOS)  
**Investigator**: UI & Execution Loop Explorer  
**Working Directory**: `d:\Thiyo\Rebuild\Rebuild-main\.agents\teamwork_preview_explorer_survey_ui`  
**Audit Target**: `d:\Thiyo\Rebuild\Rebuild-main`  
**Authoritative Specifications**: `d:\Thiyo\Rebuild\Rebuild-main\.agents\ORIGINAL_REQUEST.md`, `d:\Thiyo\Rebuild\NEUROSCIENCE_SYSTEM.md`, `d:\Thiyo\Rebuild\APP.md`  
**Date**: September 11, 2026  

---

## 1. Executive Summary

A comprehensive read-only code audit was conducted across the frontend UI architecture, navigation, daily execution loop, goal management, scoring calculations, and analytics dashboard of REBUILD.

### Overall Status Assessment
| Area | Requirement | Status | Key Finding |
|---|---|---|---|
| **R3** | 7-Screen Mobile Architecture | ⚠️ Partially Compliant | All 7 screens exist as components, but several lack core required visual elements. |
| **R3** | 4+1 Bottom Navigation & Popover | ⚠️ Partially Compliant | 5-tab bar exists; 5th "More" tab is NOT icon-only (`ri-stack-line` with text label instead of `ri-more-fill`/`ri-apps-2-line`); opens a full modal drawer instead of a compact relative popover; contains Settings in addition to Monthly/2027. |
| **R3** | Top-Right Header Settings Icon | ⚠️ Partially Compliant | Present on mobile (`md:hidden`), but on desktop it is hidden inside a "More" dropdown. |
| **R4** | Daily Loop Greeting & Subtitle | ❌ Non-Compliant | Dynamic greeting (morning/afternoon/evening) and the subtitle ("Build today. Don't fix your whole life today.") are completely MISSING. |
| **R4** | Circular Progress Ring | ❌ Non-Compliant | NO circular SVG progress ring. Currently uses a rounded square KPI card and a linear bar. |
| **R4** | 1-Tap YES & NO 15-Reason Sheet | ✅ Compliant | 1-tap YES with haptics; NO opens bottom sheet with all 15 predefined failure reasons. |
| **R4** | Recovery Mode Banner | ✅ Compliant | Triggers on 2+ consecutive sub-70% days with exact non-negotiable quote: *"Do not recover the lost days. Recover today."* |
| **R5** | Goal CRUD (Create, Edit, Pause, Resume, Archive, Delete) | ⚠️ Partially Compliant | Create, Edit, Pause, Resume, and Delete work; **Archive** is completely MISSING. |
| **R5** | Paused Goals Exclusion | ✅ Compliant | Paused goals (`active: false`) are 100% excluded from daily scoring and hidden from Today. |
| **R5** | Starter Blueprints | ⚠️ Partially Compliant | Individual goal templates exist, but bundled cohesive blueprints for SSC CGL, English Fluency, Fitness, and Self-Control are missing. |
| **R6** | Daily Scoring Engine | ✅ Compliant | `(Completed Active Goals / Total Active Goals) * 100` implemented accurately in `storage.ts`. |
| **R6** | Weekly & Monthly Rewards Unlocking | ⚠️ Partially Compliant | Formula thresholds (Weekly: ≥90% & ≥3 logged days; Monthly: ≥90% & ≥10 logged days) are strictly implemented. Pre-period config lockout is present in state but not enforced by UI. |
| **R6** | 2027 Milestones Vault | ✅ Compliant | Manual user confirmation with real-world verification dialog and haptics/confetti is fully functional. |
| **R7** | Visual Analysis Dashboard Charts | ⚠️ Partially Compliant | Donut chart and horizontal bar chart are missing; Pareto breakdown lacks cumulative curve and legend. Stats cards and time ranges (30d, 90d, all) are present. |
| **R7** | Neuroscience Metacognitive Mirror & Huberman Laws | ❌ Non-Compliant | Completely MISSING from `AnalysisView.tsx`. (Source content located in parent directory `d:\Thiyo\Rebuild\NEUROSCIENCE_SYSTEM.md`). |

---

## 2. Requirement R3: 7-Screen Mobile Architecture & 4+1 Navigation

### 2.1 Screen Inventory & Integrity
All seven core screens specified in R3 exist in `src/components/` and are conditionally rendered within `src/App.tsx`:

| Screen Tab ID | Component File | Current Implementation Summary | Completeness Status |
|---|---|---|---|
| `today` | `src/components/TodayView.tsx` | Today's date navigator, score KPI box, linear progress bar, goal execution cards, failure reason bottom sheet, quick-add modal, recovery mode banner. | Incomplete (Missing dynamic greeting, subtitle, circular progress ring). |
| `goals` | `src/components/GoalsView.tsx` | Search, dynamic category pills, goal cards, add/edit modal, starter template picker, delete confirmation modal. | Incomplete (Missing Archive feature and bundled blueprints). |
| `weekly` | `src/components/WeeklyRewardsView.tsx` | Week navigator, weekly average score, unlock badge, reward configuration modal, claim spend modal, 7-day score matrix, monthly reward spend tracker. | Fully Functional. |
| `monthly` | `src/components/MonthlyView.tsx` | Month navigator, monthly average score, 4-week progression matrix, unlock badge, monthly reward modal, claim action. | Fully Functional. |
| `milestones` | `src/components/Milestones2027View.tsx` | 2027 vision banner, milestone cards with trophy icons and budgets, add/edit modal, real-world verification dialog, delete modal. | Fully Functional. |
| `analysis` | `src/components/AnalysisView.tsx` | Time filter pills (7, 30, 90, all), vitality stat cards (Rate, Streak, Perfect Days, Total Logged), segmented weekly flow, 8-day equalizer, 14-day density wave, failure reason list, category matrix, leaderboard. | Incomplete (Missing Donut chart, true Pareto chart, Metacognitive Mirror, and Huberman Laws card). |
| `settings` | `src/components/SettingsView.tsx` | Storage stats, JSON share/export & import, reset button, threshold inputs, currency selector, week start selector, category manager, failure reason manager. | Fully Functional. |

### 2.2 Navigation Architecture (`src/components/Navbar.tsx`)

#### Bottom Navigation Bar (`Navbar.tsx:253-335`)
- Target: Mobile touch targets (`md:hidden fixed bottom-0 left-0 right-0`).
- Touch targets: Grid of 5 items (`grid grid-cols-5`), each with `min-h-[50px]`, active scaling `active:scale-95`.
- Comparison against R3 specifications:
  1. **Tab 1**: Today — icon `ri-checkbox-line`, label "Today". *(Matches spec)*
  2. **Tab 2**: Goals — icon `ri-focus-3-line`, label "Goals". *(Matches spec)*
  3. **Tab 3**: Weekly — icon `ri-trophy-line`, label "Weekly". *(Matches spec)*
  4. **Tab 4**: Stats — icon `ri-bar-chart-2-line`, label "Stats". *(Spec designates "Analysis")*
  5. **Tab 5**: More trigger —
     - **Specification**: Icon-only `ri-more-fill` or `ri-apps-2-line`.
     - **Code (`Navbar.tsx:317-333`)**: Uses `ri-stack-line` and renders text label below: `{isSecondaryActive ? getSecondaryLabel() : 'More'}`.
     - **Violation**: Not icon-only, wrong icon class.

#### The "More" Trigger Popover vs. Drawer (`Navbar.tsx:338-431`)
- **Specification**: *"The 'More' trigger opens a compact relative popover anchored directly above the nav bar containing links to Monthly Review and 2027 Milestones."*
- **Code (`Navbar.tsx:338-347`)**:
  ```tsx
  {isMoreSheetOpen && (
    <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/80 backdrop-blur-md ...">
      <div className="flex-1 w-full" onClick={() => setIsMoreSheetOpen(false)} />
      <div className="w-full bg-slate-900/98 backdrop-blur-2xl rounded-t-3xl border-t border-slate-700/80 p-5 ...">
  ```
- **Discrepancy**: Instead of a compact popover anchored right above the bottom nav bar tab, it renders a full-screen dimmed backdrop with a full-width bottom sheet drawer.
- **Content Discrepancy**: Contains links to Monthly Review (`ri-calendar-line`), 2027 Milestones (`ri-sparkling-fill`), **AND Settings & Data Backup** (`ri-settings-3-line`). R3 specifies links to Monthly Review and 2027 Milestones.

#### Header Settings Icon (`Navbar.tsx:235-248` & `Navbar.tsx:152-233`)
- **Specification**: *"Settings icon positioned in the top-right header corner across all screens."*
- **Mobile (`md:hidden`)**: Implemented at `Navbar.tsx:236-247`:
  ```tsx
  <div className="md:hidden flex items-center">
    <button onClick={() => { triggerHaptic('light'); handleSelectTab('settings'); }}
      aria-label="Settings" className="w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-800 ...">
      <i className="ri-settings-3-line text-lg" />
    </button>
  </div>
  ```
  Since `Navbar` is mounted persistently at the top of `App.tsx` (line 288), the Settings icon is present in the top-right header on mobile across all 7 screens.
- **Desktop (`md:flex` / `md:block`)**: In desktop mode, there is NO dedicated direct Settings icon in the header. Instead, a dropdown button labeled "More" (or active secondary label) with `ri-stack-line` is displayed, which drops down to show Monthly, 2027 Milestones, and Settings.

---

## 3. Requirement R4: Core Daily Execution Loop (Today Screen)

### 3.1 Daily Tracking Budget, Greeting, and Subtitle
- **Specification**:
  - Daily tracking time budget of 30 seconds to 2 minutes.
  - Dynamic greeting based on device time (e.g., morning, afternoon, evening).
  - Subtitle: *"Build today. Don't fix your whole life today."*
- **Observed Code (`src/components/TodayView.tsx:156-162`)**:
  ```tsx
  <div className="text-center min-w-0 flex-1 px-1">
    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-indigo-400 block truncate">
      REBUILD — DAILY EXECUTION
    </span>
    <h2 className="text-sm sm:text-lg md:text-xl font-extrabold text-white truncate">
      {formatDateDisplay(currentDate)}
    </h2>
  </div>
  ```
- **Gaps**:
  1. The dynamic time-based greeting (e.g. "Good morning / afternoon / evening") is completely absent.
  2. The required subtitle *"Build today. Don't fix your whole life today."* is nowhere in `TodayView.tsx`.
  3. The daily budget indicator is omitted.

### 3.2 Circular Progress Ring vs. Current Implementation
- **Specification**:
  - *"Large animated circular progress ring (0-100%) with status colors (Green ≥90%, Yellow 70-89%, Red <70%) showing completed vs active targets."*
- **Observed Code (`src/components/TodayView.tsx:204-262`)**:
  - Lines 204–213 render a rounded rectangular container:
    ```tsx
    <div className="relative flex items-center justify-center w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-slate-950/80 border border-slate-800 shrink-0 backdrop-blur-md shadow-inner">
      <div className="text-center">
        <span className="text-2xl sm:text-4xl font-black text-white tracking-tight whitespace-nowrap">
          {activeGoals.length === 0 ? '0%' : `${dayRecord.score}%`}
        </span>
        <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
          Daily Score
        </span>
      </div>
    </div>
    ```
  - Lines 248–262 render a horizontal linear bar:
    ```tsx
    <div className="w-full h-3 rounded-full bg-slate-950/80 border border-slate-800 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${
        dayRecord.score >= 90
          ? 'bg-emerald-500 shadow-md shadow-emerald-500/50'
          : dayRecord.score >= 70
          ? 'bg-amber-500 shadow-md shadow-amber-500/50'
          : 'bg-rose-500 shadow-md shadow-rose-500/50'
      }`} style={{ width: `${dayRecord.score}%` }} />
    </div>
    ```
- **Violation**: There is **no SVG circular progress ring**. The screen uses a square box and a standard linear progress bar.

### 3.3 1-Tap YES with Tactile Haptics & NO Failure Reason Sheet
- **YES Button (`TodayView.tsx:65-79`, `446-453`)**:
  - 1-tap call to `handleYes(goal)`.
  - Triggers `triggerHaptic('medium')` immediately.
  - When the day reaches 100% completion, triggers `triggerHaptic('success')` and fires canvas confetti.
- **NO Button (`TodayView.tsx:81-85`, `455-462`)**:
  - Calls `handleNoClick(goal)` which triggers `triggerHaptic('light')` and opens `activeReasonGoal` bottom sheet.
- **The 15 Predefined Failure Reasons (`src/types.ts:20-35`, `src/data/starterData.ts:3-19`)**:
  All 15 reasons are defined and verified:
  1. **Procrastination**
  2. **Phone / social media**
  3. **Mental fog**
  4. **Too tired**
  5. **Lazy / low energy**
  6. **Porn / distraction**
  7. **Work**
  8. **Unexpected situation**
  9. **Poor planning**
  10. **Forgot**
  11. **Goal was too difficult**
  12. **Goal was unrealistic**
  13. **Illness**
  14. **No specific reason**
  15. **Other**
- In `TodayView.tsx:512-521`, each reason renders as a minimum 48px touch target chip (`min-h-[48px]`), saving the reason and closing the sheet upon tap. A custom text input fallback is also present.

### 3.4 Recovery Mode Banner
- **Specification**: Auto-appearing banner after 2+ consecutive sub-70% days with: *"Do not recover the lost days. Recover today."*
- **Logic (`src/services/storage.ts:218-252`)**:
  `checkRecoveryModeNeeded` examines the preceding 3 days (`day - i`). For each logged day, if `dayScore < 70`, increments `lowCount`; breaks on the first non-low day. Returns `isRecoveryMode: lowCount >= 2`.
- **UI Implementation (`TodayView.tsx:175-197`)**:
  ```tsx
  {recoveryInfo.isRecoveryMode && (
    <div className="p-4 sm:p-5 bg-amber-500/10 backdrop-blur-xl border-2 border-amber-500/40 rounded-3xl flex items-start gap-3.5 shadow-xl">
      <div className="p-2 sm:p-2.5 rounded-2xl bg-amber-500 text-slate-950 shrink-0 shadow-md">
        <i className="ri-shield-keyhole-line text-xl shrink-0" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 text-xs font-extrabold bg-amber-500 text-slate-950 rounded-md tracking-wider whitespace-nowrap">
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
  ```
- **Status**: 100% compliant with exact required phrasing and 2+ sub-70% trigger logic.

---

## 4. Requirement R5: Goals Management & Starter Blueprints

### 4.1 Goal CRUD Audit
| Operation | Implementation in `GoalsView.tsx` | Line Numbers | Status |
|---|---|---|---|
| **Create** | `openAddModal` -> form submit -> `onAddGoal` creates new goal object with unique ID. | `GoalsView.tsx:40-51`, `83-96` | ✅ Working |
| **Edit** | `openEditModal` populates form -> `onUpdateGoal` persists changes. | `GoalsView.tsx:53-64`, `71-82` | ✅ Working |
| **Pause** | `onToggleGoalActive(goal.id)` flips `active` to `false`. Displays "Paused" badge and 60% card opacity. | `GoalsView.tsx:289-299`, `App.tsx:121-125` | ✅ Working |
| **Resume** | Same toggle button flips `active` to `true`. | `GoalsView.tsx:289-299` | ✅ Working |
| **Archive** | **MISSING**. Neither `Goal` interface (`types.ts`) nor `GoalsView.tsx` has archive state, action, or filter. | `types.ts:3-18`, `GoalsView.tsx` | ❌ Missing |
| **Delete** | `setGoalToDelete` opens `ConfirmationModal` -> `onDeleteGoal` removes goal. | `GoalsView.tsx:311-317`, `562-576` | ✅ Working |

### 4.2 Paused Goals Exclusion from Scoring and Today Screen
- **Daily Scoring (`src/services/storage.ts:123-152`)**:
  ```ts
  const activeGoals = goals.filter((g) => g.active);
  ...
  const score = Math.round((completedCount / activeGoals.length) * 100);
  ```
  Paused goals (`active: false`) are strictly omitted from `activeGoals`. They do not contribute to total active goals or completed goals.
- **Today Screen (`src/components/TodayView.tsx:45, 340`)**:
  ```ts
  const activeGoals = goals.filter((g) => g.active);
  ```
  Render loop iterates only over `activeGoals.map(...)`. Paused goals are completely hidden from the Today screen.
- **Status**: 100% compliant.

### 4.3 Starter Blueprints Analysis
- **Specification**: Pre-configured editable blueprints for:
  1. SSC CGL Exam Prep
  2. English Fluency
  3. Fitness / Recomposition
  4. Self-Control
- **Current Implementation (`src/data/starterData.ts:114-269`, `GoalsView.tsx:485-559`)**:
  - `STARTER_GOAL_TEMPLATES` contains individual goals across categories (e.g. "SSC Maths", "English Study", "Workout", "Cardio", "No Porn").
  - `GoalsView.tsx` has a "Starter Ideas" modal button (`setIsStarterModalOpen(true)`).
  - This modal displays an unbundled flat list of 15 individual goals with an `+ Add` button for each.
- **Discrepancy**: They are **not presented as selectable/editable starter blueprints/packages**. The user cannot select an "SSC CGL Exam Prep Blueprint" or "Fitness/Recomposition Blueprint" to import the whole bundle at once.

---

## 5. Requirement R6: Scoring Engine & Predefined Rewards

### 5.1 Scoring Formula
- **Specification**: `Daily Score = (Completed Active Goals / Total Active Goals) * 100`.
- **Implementation (`storage.ts:118-160`)**:
  - Filters `goals.filter(g => g.active)`.
  - Calculates `completedCount`.
  - Computes `Math.round((completedCount / activeGoals.length) * 100)`.
  - Handles 0 active goals by returning `score: 0, totalGoals: 0, completedGoals: 0`.
- **Status**: Fully compliant.

### 5.2 Weekly Reward Unlocking Criteria
- **Specification**: Unlocks at ≥90% average AND ≥3 logged days. Rewards must be defined before period starts.
- **Implementation (`WeeklyRewardsView.tsx:50-51`)**:
  ```ts
  const requiredThreshold = existingReward?.requiredScore || settings.weeklyRewardThreshold;
  const isUnlocked = weekScore >= requiredThreshold && weekScoreData.recordedDaysCount >= 3;
  ```
- **"Defined before period starts" Check**:
  - When a reward is saved, it sets `isConfigLocked: true` (`WeeklyRewardsView.tsx:86`).
  - However, in `WeeklyRewardsView.tsx:276-281`, the `Edit Reward` button remains enabled and allows modifying the reward even after days have been recorded in the week. The lock is informational in the UI copy rather than an enforced lockout.

### 5.3 Monthly Reward Unlocking Criteria
- **Specification**: Unlocks at ≥90% average AND ≥10 logged days.
- **Implementation (`MonthlyView.tsx:60-61`)**:
  ```ts
  const requiredThreshold = existingReward?.requiredScore || settings.monthlyRewardThreshold;
  const isUnlocked = monthlyScore >= requiredThreshold && monthScoreData.recordedDaysCount >= 10;
  ```
- **Status**: Fully compliant with exact formula and threshold.

### 5.4 2027 Milestones Vault & Manual Verification Dialog
- **Specification**: Unlocked exclusively via manual user confirmation with real-world verification dialog.
- **Implementation (`Milestones2027View.tsx:95-112, 323-346`)**:
  - Tapping "Confirm Achieved ✓" triggers `ConfirmationModal`:
    - `title: "Confirm Real-World Milestone Achievement"`
    - `message: "Have you achieved \"[title]\" in reality? This will unlock the major milestone reward: \"[reward]\"."`
    - `confirmLabel: "Yes, Milestone Achieved! 🎉"`
  - Upon confirmation: triggers `nativeHaptics.impactHeavy()` and 180-particle confetti.
  - Milestones cannot be unlocked by daily scores; unlocking is 100% manual.
- **Status**: Fully compliant.

---

## 6. Requirement R7: Visual Analysis Dashboard & Neuroscience Metacognitive Mirror

### 6.1 Chart Inventory in `src/components/AnalysisView.tsx`

| Visual Element Required by R7 | Current Implementation in `AnalysisView.tsx` | Status | Exact Line References |
|---|---|---|---|
| **Overall completion rate donut chart** | None. Only a text KPI card: `<span className="text-2xl sm:text-3xl font-black text-white">{overallRate}%</span>`. | ❌ Missing | `AnalysisView.tsx:243-264` |
| **Pareto failure reasons breakdown chart with legend** | Renders a grid of cards with reason title, occurrence count, percentage badge, and simple horizontal bar. Lacks cumulative line/curve and Pareto 80/20 legend. | ⚠️ Incomplete | `AnalysisView.tsx:668-731` |
| **Goal rankings horizontal bar chart** | "Top Consistency Leaderboard" renders a text ranking list with `#{idx+1}` and a rate percentage badge. No horizontal bar chart rendered. | ❌ Missing | `AnalysisView.tsx:778-814` |
| **Category breakdown matrix** | "Category Pillar Matrix" renders category badges, ratio `completed/total`, and percentage bar. | ✅ Implemented | `AnalysisView.tsx:735-775` |
| **Streak, perfect days, and total days logged stat cards** | Top KPI strip renders Unbroken Streak, Perfect 100% Days, and Logged History cards with badges. | ✅ Implemented | `AnalysisView.tsx:267-336` |
| **Time range selector** | Selector buttons for `7`, `30`, `90`, and `all` days. (R7 specifies Last 30 days, Last 90 days, All time; 7 days is extra). | ✅ Implemented | `AnalysisView.tsx:185-236` |
| **Dynamic Metacognitive Mirror** | None. | ❌ Missing | Not found in `AnalysisView.tsx` |
| **Huberman Execution Laws quick-reference card** | None. | ❌ Missing | Not found in `AnalysisView.tsx` |
| **Strict "Pattern observed" non-clinical phrasing** | None. | ❌ Missing | Not found in `AnalysisView.tsx` |

### 6.2 The Neuroscience System Discovery & Mapping

During the audit, a major reference document was located at:
`d:\Thiyo\Rebuild\NEUROSCIENCE_SYSTEM.md` (22,448 bytes).

This authoritative file contains the complete system architecture required by R7:

#### 1. Failure Reasons to Biological Root Causes & Protocols (`NEUROSCIENCE_SYSTEM.md:404-416`):
```markdown
| Pattern | Biological Cause | Intervention Protocol |
|---|---|---|
| Procrastination dominant | Amygdala threat response to task difficulty | 5-minute rule: commit only to the first 5 minutes. Brain shifts once started. |
| Phone dominant | Variable-reward dopamine loops hijacking PFC control | Physical separation of phone before study begins — not willpower, location. |
| Mental fog dominant | Adenosine buildup, cortisol flatness, or sleep debt | Fix morning cortisol anchor; check caffeine timing; check sleep duration. |
| Too tired dominant | Sleep debt accumulation; over-extension without recovery | Add meso break weekly; protect 11 PM sleep boundary. |
| Work dominant | External load exceeding capacity | Reduce goal count temporarily rather than forcing a failing system. |
```

#### 2. Huberman's Four Execution Laws (`NEUROSCIENCE_SYSTEM.md:51-161`):
1. **Law 1: The Rhythm (Cortisol Control)**:
   - Morning sunlight in eyes within 1 hour (5-10 min) -> 50% cortisol spike sets day's energy and suppresses evening cortisol.
   - Delay caffeine 90 min after waking.
   - Caffeine curfew: zero after 2 PM.
   - Dim lights aggressively after 9 PM; physiological sigh before bed.
2. **Law 2: The Off Switch (Deliberate Deceleration)**:
   - Unresolved anxiety impairs REM sleep, destroying maths/vocabulary/motor pattern consolidation.
   - 3 Tools: NSDR / Yoga Nidra (10-20 min), The Eye Trick (lateral movement + long exhale), Two-Column Control exercise.
3. **Law 3: The Arc (Phase Strategy)**:
   - Years 0-3: Gas Pedal (go all in, find your edge).
   - Years 4-6: Regulate.
   - Years 7+: Refine & Play.
   - Rule: "The unit of time is one day. Build today. Don't fix your whole life today."
4. **Law 4: The Fighter (Action Over Identity)**:
   - "Winner is a verb, not a personality."
   - 3 Tools: 10 breaths before phone out of bed, shorten the horizon to next study session, recall one hard survival memory.

#### 3. Strict Non-Clinical Phrasing:
The protocol requires phrasing such as:
- `"Pattern observed: [Reason] dominant in past [X] days"`
- `"Biological mechanism: [Mechanism]"`
- `"Protocol: [Actionable protocol]"`
- Never use clinical/diagnostic terms like "You are suffering from", "Disorder", or "Pathology".

---

## 7. Discrepancy & Gap Matrix

| Requirement | Specification in `ORIGINAL_REQUEST.md` | Actual Codebase State | Affected Files | Severity |
|---|---|---|---|---|
| **R3: 5th Nav Tab Icon** | `ri-more-fill` or `ri-apps-2-line`, icon-only | Uses `ri-stack-line` with text label | `src/components/Navbar.tsx:317-333` | Medium |
| **R3: "More" Popover** | Compact relative popover anchored directly above nav bar | Full-screen modal backdrop with sliding bottom drawer | `src/components/Navbar.tsx:338-347` | Medium |
| **R3: "More" Menu Links** | Links to Monthly Review and 2027 Milestones | Contains Monthly, 2027 Milestones, **and Settings** | `src/components/Navbar.tsx:371-429` | Low |
| **R3: Desktop Settings** | Settings icon in top-right header across all screens | Hidden in "More" dropdown on desktop | `src/components/Navbar.tsx:152-233` | Medium |
| **R4: Dynamic Greeting** | Dynamic time-based greeting (morning/afternoon/evening) | Static text: "REBUILD — DAILY EXECUTION" | `src/components/TodayView.tsx:156` | Medium |
| **R4: Subtitle** | "Build today. Don't fix your whole life today." | Omitted entirely | `src/components/TodayView.tsx:156-162` | High |
| **R4: Progress Ring** | Large animated circular progress ring (0-100%) with Green/Yellow/Red | Rounded square box + linear progress bar | `src/components/TodayView.tsx:204-262` | High |
| **R5: Goal Archive** | Full CRUD including Archive | Archive missing from types and UI | `src/types.ts:3-18`, `src/components/GoalsView.tsx` | High |
| **R5: Starter Blueprints** | Pre-configured editable blueprints for SSC CGL, English Fluency, Fitness, Self-Control | Flat list of 15 individual goal templates | `src/data/starterData.ts:114-269`, `src/components/GoalsView.tsx:485-559` | High |
| **R6: Weekly Lockout** | Rewards must be defined before period starts | `isConfigLocked` stored but UI allows editing | `src/components/WeeklyRewardsView.tsx:276-281` | Medium |
| **R7: Donut Chart** | Overall completion rate donut chart | Text percentage KPI box | `src/components/AnalysisView.tsx:243-264` | High |
| **R7: Pareto Failure Chart** | Pareto failure reasons breakdown chart with legend | Card list with individual progress bars | `src/components/AnalysisView.tsx:668-731` | High |
| **R7: Goal Rankings Chart** | Goal rankings horizontal bar chart | Text leaderboard list with badges | `src/components/AnalysisView.tsx:778-814` | High |
| **R7: Metacognitive Mirror** | Dynamic Metacognitive Mirror mapping failure reasons to root causes | Missing from UI (content in `NEUROSCIENCE_SYSTEM.md`) | `src/components/AnalysisView.tsx` | Critical |
| **R7: Huberman Laws Card** | Static quick-reference card (The Rhythm, The Off Switch, The Arc, The Fighter) | Missing from UI (content in `NEUROSCIENCE_SYSTEM.md`) | `src/components/AnalysisView.tsx` | Critical |

---

## 8. Actionable Recommendations for Implementation Phase

1. **Implement SVG Circular Progress Ring on TodayView (`TodayView.tsx`)**:
   - Replace the rounded square box with an SVG circular ring (`viewBox="0 0 100 100"`), using `strokeDasharray` and `strokeDashoffset` animated with transition timing.
   - Apply status stroke colors: Green (`#10B981`, ≥90%), Yellow (`#F59E0B`, 70-89%), Red (`#F43F5E`, <70%).
   - Add dynamic greeting helper function: `getDynamicGreeting(hour)` -> "Good morning" (5-11), "Good afternoon" (12-16), "Good evening" (17-21), "Good night" (22-4).
   - Add subtitle: *"Build today. Don't fix your whole life today."* directly beneath the greeting.

2. **Fix 4+1 Bottom Navigation & Header Settings (`Navbar.tsx`)**:
   - Update 5th tab on mobile to be icon-only using `ri-apps-2-line` or `ri-more-fill` with `aria-label="More"`.
   - Update tab 4 label from "Stats" to "Analysis".
   - Convert the full-screen drawer on mobile into a compact popover container anchored directly above the nav bar tab with a relative bottom position (`bottom-[calc(env(safe-area-inset-bottom)+3.5rem)]`).
   - Add dedicated Settings button (`ri-settings-3-line`) in the top-right header for desktop view as well as mobile.

3. **Enhance Goals Management & Starter Blueprints (`GoalsView.tsx`, `types.ts`, `starterData.ts`)**:
   - Add `archived?: boolean` to `Goal` interface in `src/types.ts`.
   - Add "Archive / Unarchive" action to goal cards and an "Archived Goals" filter tab.
   - Bundle starter templates into 4 named blueprints:
     - **SSC CGL Exam Prep Blueprint**: SSC Maths, English Study, Reasoning, GK, PYQ Practice, Mock Test.
     - **English Fluency Blueprint**: Grammar Practice, Vocabulary Building, Reading / Speaking.
     - **Fitness & Recomposition Blueprint**: Workout, Cardio, Stretching.
     - **Self-Control Blueprint**: No Porn, Social Media Control, Sleep Target.
   - Provide a 1-tap "Load Blueprint" action that populates the whole bundle into the user's goals.

4. **Upgrade Analysis Dashboard (`AnalysisView.tsx`)**:
   - **Donut Chart**: Add an SVG circular/donut chart for overall completion rate with completed vs missed slices and central percentage display.
   - **Pareto Chart with Legend**: Group failure reasons in descending frequency with a cumulative percentage line overlay and an 80/20 threshold guide with clear legend.
   - **Horizontal Bar Chart for Goal Rankings**: Display all active/historical goals with horizontal proportional bars colored by completion tier.
   - **Dynamic Metacognitive Mirror Card**: When failure reasons exist in the selected time range, identify the dominant reason (top 1-2) and display:
     - Header: *"Metacognitive Mirror"*
     - *"Pattern observed: [Reason] accounts for [X]% of misses"*
     - *"Biological mechanism: [Mechanism from NEUROSCIENCE_SYSTEM.md]"*
     - *"Actionable protocol: [Protocol from NEUROSCIENCE_SYSTEM.md]"*
   - **Static Huberman Execution Laws Card**: Render a clean multi-card reference section with tabs or accordions for:
     1. The Rhythm (Cortisol curve, morning light, caffeine curfew)
     2. The Off Switch (NSDR, eye trick, two-column exercise)
     3. The Arc (Phase 0-3 Gas Pedal, daily unit of time)
     4. The Fighter (10 breaths, shorten horizon, hard memory)
   - Ensure all language adheres strictly to non-clinical observation framing.
