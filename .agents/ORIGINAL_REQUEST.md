# Original User Request

## Initial Request — 2026-09-11T12:03:19+05:30

REBUILD is a personal offline-first execution and accountability Capacitor mobile application for Android and iOS, purpose-built for one user with zero backend and zero auth.

Working directory: d:
Thiyo\Rebuild\Rebuild-main
Integrity mode: development

## Requirements

### R1. Offline Local Data Persistence & Zero Auth
- All app data (Goals, Daily Completions, Failure Reasons, Weekly/Monthly Rewards, 2027 Milestones, Settings) must persist 100% locally on-device across app restarts, backgrounding, device reboots, and webview reloads.
- No user login, no user accounts, no backend server, and no cloud auth.
- Full backup and restore via single-file JSON export (using @capacitor/share with file download fallback) and JSON import with complete entity restoration.

### R2. Complete Removal of Google & External Cloud Dependencies
- Zero Google OAuth, zero Google Sheets sync, zero Google Drive creation, zero Google Calendar event creation, and zero "Sync" modals.
- Completely prune all dead imports and files related to remote sync (googleSheets.ts, googleCalendar.ts, auth.ts, GoogleSyncModal.tsx).

### R3. 7-Screen Mobile Architecture & 4+1 Navigation
- Seven core screens: Today, Goals, Weekly, Monthly, Milestones, Analysis, Settings.
- Bottom Navigation: 4 main items (1. Today, 2. Goals, 3. Weekly, 4. Analysis) + 5th "More" trigger (icon-only ri-more-fill / ri-apps-2-line).
- The "More" trigger opens a compact relative popover anchored directly above the nav bar containing links to Monthly Review and 2027 Milestones.
- Settings icon positioned in the top-right header corner across all screens.

### R4. Core Daily Execution Loop (Today Screen)
- Daily tracking time budget of 30 seconds to 2 minutes.
- Synamic greeting based on device time + subtitle: "Build today. Don't fix your whole life today."
- Large animated circular progress ring (0-100%) with status colors (Green ≥90%, Yellow 70-89%, Red <70%) showing completed vs active targets.
- 1-tap YES with tactile haptic response; NO opens the 15-reason failure bottom sheet.
- Auto-appearing Recovery Mode banner after 2+ consecutive sub-70% days with non-negotiable phrasing: "Do not recover the lost days. Recover today."

### R5. Goals Management & Starter Blueprints
- Full CRUD: Create, Edit, Pause, Resume, Archive, Delete.
- Paused goals are completely excluded from daily scoring and hidden from Today.
- Pre-configured editable blueprints for SSC CGL-Exam Prep, English Fluency, Fitness/Recomposition, and Self-Control.

### R6. Scoring Engine & Predefined Rewards
- Daily Score = (Completed Active Goals / Total Active Goals) * 100.
- Weekly Reward unlocks at ≉90% average AND ≥3 logged days. Rewards must be defined before period starts.
- Monthly Reward unlocks at ≥90% average AND ≥10 logged days.
- 2027 Milestones Vault unlocked exclusively via manual user confirmation with real-world verification dialog.

### R7. Visual Analysis Dashboard & Neuroscience Metacognitive Mirror
- Overall completion rate donut chart and Pareto failure reasons breakdown chart with legend.
- Goal rankings horizontal bar chart and category breakdown matrix.
- Streak, perfect days, and total days logged stat cards.
- Time range selector: Last 30 days, Last 90 days, All time.
- Dynamic Metacognitive Mirror mapping dominant failure reasons to biological root causes and actionable protocols from NEUROSCIENCE_SYSTEM.md.
- Static Huberman Execution Laws quick-reference card (The Rhythm, The Off Switch, The Arc, The Fighter).
- Strict "Pattern observed" non-clinical phrasing.

### R8. Universal Satoshi Typography & Zero Italics
- 100%