# Milestone 4: Code Changes Report

## Overview
Milestone 4 implements the Core Daily Execution Loop (R4) and Goals Management & Starter Blueprints (R5) in REBUILD.
All modifications adhere strictly to:
- Offline-first principles with local state persistence
- Satoshi typography with 0 occurrences of italics
- Bundled Remixicon icons (`<i className="ri-..." />`) with strictly self-closing tags
- 44px minimum touch targets on all interactive controls
- Hardware back-stack registration (`window.__REBUILD_BACK_STACK__`) for all modals and bottom sheets

---

## 1. `src/data/starterData.ts`
**Role & Purpose**: Defines the 4 curated Starter Blueprints and goal templates for quick onboarding.

### Changes:
- **Defined `StarterBlueprint` Interface**:
  - `id`: string identifier (`cgl`, `english`, `fitness`, `self_control`)
  - `title`: Blueprint display title
  - `description`: Philosophy and daily habit expectation
  - `category`: Blueprint category (`'SSC' | 'English' | 'Fitness' | 'Discipline'`)
  - `icon`: Remixicon class name (`ri-book-open-line`, `ri-chat-voice-line`, `ri-heart-pulse-line`, `ri-shield-flash-line`)
  - `targets`: Exactly 4 concrete, actionable daily targets per blueprint with target text, category, and minimum 44px tap ergonomics.
- **Exported `STARTER_BLUEPRINTS` array**:
  1. **SSC CGL Exam Prep**:
     - Quantitative Aptitude practice (25 problems)
     - Reasoning & general intelligence (25 questions)
     - General awareness & current affairs revision (30 min)
     - English comprehension & vocabulary (20 words + 2 passages)
  2. **English Fluency**:
     - Shadowing / spoken monologue practice (15 min)
     - Active listening to authentic podcast/audio (20 min)
     - Vocabulary journaling & sentence construction (5 collocations)
     - Read editorial / high-grade non-fiction (15 min)
  3. **Fitness / Recomposition**:
     - Resistance training or compound bodyweight circuit
     - Daily protein target fulfillment (1.6g - 2.2g / kg bodyweight)
     - Daily step count (8,000 - 10,000 steps)
     - Water intake threshold (3.0+ liters)
  4. **Self-Control**:
     - Zero doomscrolling / morning phone delay (first 60 min of day)
     - Single-task deep work block (90 uninterrupted minutes)
     - Evening digital sundown & sleep hygiene adherence
     - Daily reflection & honest audit log (2 min)
- **Extended `STARTER_GOAL_TEMPLATES`**:
  - Maintained backward-compatibility for individual template pickers while adding all new targets with appropriate categorization.

---

## 2. `src/components/TodayView.tsx`
**Role & Purpose**: The core daily execution screen where users check in on daily targets and view execution health.

### Changes:
- **Daily Tracking Budget Indicator**:
  - Added header badge with stopwatch icon and copy: `"Daily tracking budget: 30 seconds to 2 minutes"`.
- **Dynamic Greeting & Philosophy Subtitle**:
  - Implemented `getGreeting()` based on device local time (`"Good morning"` before 12:00, `"Good afternoon"` between 12:00 and 17:00, `"Good evening"` at or after 17:00).
  - Added subtitle: `"Build today. Don't fix your whole life today."`
- **Large Animated Circular SVG Progress Ring**:
  - Replaced square box container and linear progress bar with a circular SVG progress ring (`viewBox="0 0 160 160"` with radius 66, stroke width 12, circumference ~414.69px).
  - Animated `strokeDashoffset` transition matching `percentage = Math.round((completedCount / totalActiveTargets) * 100)`.
  - Dynamic stroke color coding:
    - `>= 90%`: Emerald (`#10b981` / `stroke-emerald-500`)
    - `70% - 89%`: Amber (`#f59e0b` / `stroke-amber-500`)
    - `< 70%`: Rose (`#f43f5e` / `stroke-rose-500`)
  - Center readout displays prominent percentage (`text-3xl font-black`) and completed target tally (`X / Y targets completed`).
- **Recovery Mode Banner**:
  - Evaluates previous 2 days execution score. If both were `< 70%`, triggers the Recovery Mode banner.
  - Prominent banner text: `"Do not recover the lost days. Recover today."`
  - Secondary badge / guideline: `"Rule: Never miss twice."`
- **Goal Archiving Exclusion**:
  - Excluded archived goals (`goal.archived === true`) from Today target rendering and daily score denominator calculations.
- **Hardware Back-Stack Integration**:
  - Registered failure bottom sheet and quick-add modal with `window.__REBUILD_BACK_STACK__` so back button presses cleanly dismiss modals in LIFO order.
- **Failure Bottom Sheet Ergonomics**:
  - Maintained 15 failure reason buttons with minimum 44px touch height and drag handle (`w-12 h-1.5 rounded-full bg-slate-700 mx-auto mb-4`).

---

## 3. `src/components/GoalsView.tsx`
**Role & Purpose**: Complete goals management and starter blueprint integration.

### Changes:
- **Full Goal Lifecycle & Archiving UI**:
  - Added `activeTab` state (`'active' | 'archived'`).
  - Active vs. Archived tab switcher with dynamic badge counts (`goals.filter(g => !g.archived).length` vs `goals.filter(g => g.archived).length`).
  - Active goals view: added quick `"Archive"` action button with >=44px touch targets.
  - Archived goals view: displays archived goals with visual badge (`"Archived"`) and `"Restore"` button (`onUpdateGoal({ ...goal, archived: false })`).
  - Edit Goal modal: added `"Archived (Hide from daily tracking)"` checkbox toggle.
- **Starter Blueprints Modal & 1-Click Loader**:
  - Added `Starter Blueprints` button with `ri-sparkling-fill` icon opening a comprehensive bottom sheet.
  - Sub-tabs within sheet: `"Full Blueprints"` and `"Individual Goal Templates"`.
  - In `"Full Blueprints"`, renders cards for SSC CGL Exam Prep, English Fluency, Fitness / Recomposition, and Self-Control with icons, description, target checklist preview, and a prominent 1-click `"+ Load Blueprint"` button.
  - Clicking `"+ Load Blueprint"` creates all 4 blueprint targets with unique timestamps and immediately switches to the active goals list.
- **Hardware Back-Stack Integration**:
  - Registered `isAddModalOpen` and `isStarterModalOpen` handlers in `window.__REBUILD_BACK_STACK__` for Android hardware back button compatibility.
- **Remixicon Conformance**:
  - Explicit literal `ri-` class name tags for all icons, self-closing `<i className="ri-..." />` syntax, zero unclosed tags, zero italics.
- **Ergonomics**:
  - All interactive buttons and touch targets meet or exceed 44x44px.
