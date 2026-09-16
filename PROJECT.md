# Project: REBUILD

## Architecture
REBUILD is a personal offline-first execution and accountability mobile application built with React 18, TypeScript, Tailwind CSS, Vite, and Capacitor for Android.
- **Client Tier**: 100% local Single Page Application (React 18 + TypeScript). Zero cloud, zero backend, zero authentication.
- **Persistence Tier**: Synchronous on-device persistence via `window.localStorage` with key namespace `rebuild_2027_*_v2`. Single-file JSON export with `@capacitor/share` and Web download fallback; full JSON import with entity validation and restoration.
- **Native Bridge**: Capacitor 7 native runtime bridging Android device capabilities (@capacitor/app, @capacitor/status-bar, @capacitor/splash-screen, @capacitor/haptics, @capacitor/share).
- **Styling & Assets**: 100% Satoshi font family (locally bundled WOFF2), 0 occurrences of italics, locally bundled Remixicon font icons, 4px/16px mobile grid scale, 44-48dp touch targets.
- **Intellectual Core**: Metacognitive Mirror and Huberman Execution Laws integrated directly from `NEUROSCIENCE_SYSTEM.md`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Offline Persistence | 100% on-device local storage across reboots/reloads | M1 | R1 |
| F2 | Single-File Backup & Restore | JSON export via @capacitor/share + Web fallback; full JSON import | M1 | R1 |
| F3 | Zero Cloud & Auth Removal | Prune dead config files, types, and unused cloud packages | M1 | R2 |
| F4 | Local Satoshi Typography | Bundle local Satoshi .woff2, remove CDN, ensure 0 italics | M1 | R8 |
| F5 | Offline Remixicon Bundling | Remove jsDelivr CDN link from index.html, ensure 100% bundled assets | M1 | R9 |
| F6 | Native Hardware & Back Button | Vibrate permission in manifest, modal-aware Android hardware back button | M2 | R10 |
| F7 | Mobile Ergonomics | 16px screen padding, 44-48dp touch targets across modals, headers, chips | M2 | R10 |
| F8 | 4+1 Mobile Navigation | 4 main tabs (Today, Goals, Weekly, Analysis) + icon-only More popover | M3 | R3 |
| F9 | Header Settings Access | Clean, accessible top-right Settings icon across all 7 views | M3 | R3 |
| F10 | Dynamic Greeting & Subtitle | Time-of-day greeting + "Build today. Don't fix your whole life today." | M4 | R4 |
| F11 | Animated Circular Progress Ring | SVG circular ring (0-100%) with status colors (>=90% green, 70-89% yellow, <70% red) | M4 | R4 |
| F12 | YES/NO Daily Execution & Recovery | 1-tap YES haptics, 15-reason failure sheet, Recovery Mode banner | M4 | R4 |
| F13 | Goal CRUD & Archiving | Full goal CRUD including pause/resume and new archiving feature | M4 | R5 |
| F14 | 4 Starter Blueprints | Cohesive 1-click blueprints (SSC CGL, English Fluency, Fitness, Self-Control) | M4 | R5 |
| F15 | Scoring Engine & Reward Rules | Daily scoring math, weekly unlock (>=90% & >=3d), monthly (>=90% & >=10d) | M5 | R6 |
| F16 | 2027 Milestones Vault | Manual confirmation dialog with real-world verification | M5 | R6 |
| F17 | Visual Analytics Dashboard | SVG Donut chart, Pareto failure breakdown + legend, horizontal goal rankings | M5 | R7 |
| F18 | Neuroscience Mirror & Huberman Laws | Metacognitive Mirror mapping + Huberman Execution Laws card | M5 | R7 |
| F19 | Capacitor Android Sync & Build | yarn build 0 errors, yarn cap sync android success with all 5 plugins | M6 | Acceptance |
| F20 | Forensic Integrity Verification | 100% E2E test pass across all tiers, 0 italics scan, auditor verification | M6 | Acceptance |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Clean-up, Typography & Offline Assets | Prune cloud files/packages/types, bundle local Satoshi font & remove CDNs, add Goal archive type | none | DONE |
| M2 | Mobile Ergonomics & Android Integration | Android Manifest vibration permission, modal-aware back button, 16px screen padding, 44-48dp touch targets | M1 | DONE |
| M3 | Navigation & 7-Screen Shell Refinement | Navbar 4+1 tabs (Analysis tab, icon-only More trigger), compact anchored popover, top-right Settings | M1 | DONE |
| M4 | Daily Execution Loop & Goals Management | Dynamic greeting/subtitle, SVG circular ring, Goal Archiving UI, 4 starter blueprints | M1, M2 | DONE |
| M5 | Visual Analysis & Neuroscience Mirror | SVG Donut chart, Pareto failure breakdown, goal rankings, Metacognitive Mirror & Huberman Laws | M1, M3 | DONE |
| M6 | Final Verification, E2E Pass & Capacitor Sync | Full build & test pass, yarn cap sync android, zero italics verification, forensic audit | M1, M2, M3, M4, M5 | IN_PROGRESS |

## Interface Contracts

### Data Layer ↔ UI Views (`src/types.ts` & `src/services/storage.ts`)
```typescript
export interface Goal {
  id: string;
  title: string;
  category: GoalCategory;
  active: boolean; // paused when false; paused goals excluded from daily scoring and Today
  archived?: boolean; // archived goals hidden from active list
  targetValue?: number;
  unit?: string;
  frequency: 'daily' | 'weekly';
  createdAt: string;
}

export interface DayRecord {
  date: string;
  score: number; // Math.round((completedActive / totalActive) * 100)
  completedGoalsCount: number;
  totalGoalsCount: number;
  failureReasons: FailureLog[];
}

export interface StarterBlueprint {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  goals: Omit<Goal, 'id' | 'createdAt'>[];
}
```

### Navigation Contract (`src/components/Navbar.tsx`)
```typescript
export type TabType = 'today' | 'goals' | 'weekly' | 'analysis' | 'monthly' | 'milestones' | 'settings';
// Bottom bar: 4 tabs ('today', 'goals', 'weekly', 'analysis') + 'more' popover trigger ('monthly', 'milestones').
// Settings icon permanently accessible in header.
```

### Neuroscience Mirror Contract (`src/components/AnalysisView.tsx`)
```typescript
export interface BiologicalRootCause {
  reason: FailureReason;
  biologicalPattern: string;
  neuroscienceProtocol: string;
  sourceLaw: 'The Rhythm' | 'The Off Switch' | 'The Arc' | 'The Fighter';
}
```

## Code Layout
- `src/types.ts`: Core domain models and schema definitions.
- `src/services/storage.ts`: Local storage engine, scoring calculations, recovery check, import/export helpers.
- `src/services/native.ts`: Capacitor native plugin wrappers (Haptics, Share, App, StatusBar, SplashScreen).
- `src/data/starterData.ts`: 15 failure reasons, 4 starter blueprints, default milestones.
- `src/components/`:
  - `TodayView.tsx`: Daily execution ring, 1-tap YES, 15-reason NO bottom sheet, Recovery Mode banner.
  - `GoalsView.tsx`: Goal CRUD, Pause/Resume, Archive, Blueprint loader.
  - `WeeklyRewardsView.tsx`: Weekly reward tracking (>=90% & >=3d).
  - `MonthlyView.tsx`: Monthly review (>=90% & >=10d).
  - `Milestones2027View.tsx`: 2027 Milestones Vault with manual verification dialog.
  - `AnalysisView.tsx`: Donut chart, Pareto breakdown, goal rankings, Metacognitive Mirror, Huberman Laws.
  - `SettingsView.tsx`: JSON backup/restore, offline info, danger zone reset.
  - `Navbar.tsx`: 4+1 navigation bar, More popover, header with Settings icon.
- `android/`: Native Android project container and Gradle build configuration.
