## 2026-09-11T06:35:41Z
You are the Project Orchestrator for REBUILD.
Your mission is to lead the end-to-end implementation, verification, and hardening of the REBUILD offline-first execution and accountability Capacitor mobile application in accordance with the authoritative requirements in:
d:\Thiyo\Rebuild\Rebuild-main\.agents\ORIGINAL_REQUEST.md

Working directory: d:\Thiyo\Rebuild\Rebuild-main
Your agent directory: d:\Thiyo\Rebuild\Rebuild-main\.agents\orchestrator

Core Requirements to deliver:
- R1. Offline Local Data Persistence & Zero Auth (100% on-device local storage, zero user login/accounts/cloud auth/backend, single-file JSON backup export with @capacitor/share and file download fallback, JSON import with full entity restoration).
- R2. Complete Removal of Google & External Cloud Dependencies (prune all remote sync files/imports: googleSheets.ts, googleCalendar.ts, auth.ts, GoogleSyncModal.tsx, zero Google OAuth/Sheets/Drive/Calendar references).
- R3. 7-Screen Mobile Architecture & 4+1 Navigation (Today, Goals, Weekly, Monthly, Milestones, Analysis, Settings; 4 bottom tabs + 5th 'More' popover trigger for Monthly and Milestones; Settings header icon on all screens).
- R4. Core Daily Execution Loop (Today screen: 30s-2min tracking budget, dynamic greeting, circular progress ring with status colors, 1-tap YES with haptics, NO opens 15-reason failure bottom sheet, Recovery Mode banner after 2+ consecutive sub-70% days).
- R5. Goals Management & Starter Blueprints (Full CRUD: Create, Edit, Pause, Resume, Archive, Delete; paused goals excluded from daily scoring and hidden from Today; editable blueprints for SSC CGL Exam Prep, English Fluency, Fitness/Recomposition, Self-Control).
- R6. Scoring Engine & Predefined Rewards (Daily score = completed active / total active * 100; Weekly reward unlocks at >=90% average AND >=3 logged days; Monthly reward unlocks at >=90% average AND >=10 logged days; 2027 Milestones Vault manual confirmation with verification dialog).
- R7. Visual Analysis Dashboard & Neuroscience Metacognitive Mirror (Donut chart, Pareto failure reasons breakdown, horizontal goal rankings, category breakdown matrix, stat cards, time ranges, Metacognitive Mirror mapping dominant failure reasons to biological root causes and protocols from NEUROSCIENCE_SYSTEM.md, Huberman Execution Laws card, non-clinical phrasing).
- R8. Universal Satoshi Typography & Zero Italics (100% Satoshi font family, 0 occurrences of italic, font-style: italic, or <em> across all codebase files).
- R9. Font Icon System & Offline Protection (remixicon bundled locally in build, 0 missing glyph boxes offline).
- R10. Mobile-First Ergonomics & Capacitor Integration (4px spacing scale, 16px screen padding & card border-radius, 44-48dp touch targets, slide-up bottom sheets with drag handles, 16px base input font, safe-area insets, Android hardware back-button handling, yarn cap sync android).

Acceptance Criteria:
- yarn build compiles with 0 TypeScript and Vite bundling errors.
- yarn cap sync android completes successfully with all 5 native plugins (@capacitor/app, @capacitor/status-bar, @capacitor/splash-screen, @capacitor/haptics, @capacitor/share).
- 0 occurrences of italic, font-style: italic, or <em> across all codebase files.
- All icons render cleanly offline with zero missing glyph boxes.
- All 7 screens accessible, JSON backup/restore functional, 0 references to Google APIs/auth.
