# REBUILD — Data Layer, Persistence & Cloud Pruning Survey Report

**Explorer**: Data & Cloud Pruning Explorer  
**Date**: 2026-09-11  
**Scope**: Data Entities, State Storage, Persistence Lifecycle, Backup/Restore Flows, Google & Cloud Dependency Audit, Package Pruning  
**Working Directory**: d:\Thiyo\Rebuild\Rebuild-main\.agents\teamwork_preview_explorer_survey_data  

---

## Executive Summary

The REBUILD project is an offline-first personal accountability and execution system designed for a single user with zero backend and zero authentication.

This survey investigated two primary mandates:
1. **R1: Offline Local Data Persistence & Zero Auth** — Validating entity models, storage mechanisms, mobile lifecycle persistence, and single-file JSON backup/restore flows.
2. **R2: Complete Removal of Google & External Cloud Dependencies** — Auditing all Google OAuth, Sheets, Drive, Calendar, and Firebase artifacts, identifying residual schema fields, and isolating dead npm packages.

### Key Conclusions
- **Zero Auth Architecture**: Fully intact. No user logins, no remote sessions, no tokens, and no server endpoints exist in the frontend runtime.
- **State Management & Storage**: State is held in React useState at App.tsx and mirrored synchronously to window.localStorage via src/services/storage.ts using seven dedicated keys with version suffix _v2.
- **Sync Files Status**: googleSheets.ts, googleCalendar.ts, uth.ts, and GoogleSyncModal.tsx **do not exist** in src/. They have already been deleted or omitted from the TypeScript source.
- **Residual Cloud Artifacts Found**:
  1. irebase-applet-config.json in repository root (contains OAuth client ID, Firebase API key, project credentials).
  2. .env.example in root (contains references to GEMINI_API_KEY and Google Cloud Run APP_URL).
  3. metadata.json in root (declares MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API and describes Google Sheets/Calendar sync).
  4. src/types.ts contains 4 dead Google fields: Goal.calendarEventId, AppSettings.spreadsheetId, AppSettings.spreadsheetUrl, and AppSettings.lastSyncedAt.
  5. package.json contains 8 dead packages including @google/genai, irebase, express, @types/express, dotenv, 	sx, lucide-react, and motion.
- **Backup & Restore**: Single-file JSON export is implemented in src/services/native.ts via @capacitor/share with a Web download fallback. JSON file import with schema parsing is functional in src/components/SettingsView.tsx.

---

## 1. R1: Offline Local Data Persistence & Zero Auth

### 1.1 Data Entities Inventory

All core data types are declared in src/types.ts and initialized in src/data/starterData.ts and src/services/storage.ts.

| Entity | Model / Interface | Storage Key | Description & Fields |
|---|---|---|---|
| **Goals** | Goal | ebuild_2027_goals_v2 | Core habits/targets. Fields: id, 
ame, category, 	arget, requency (Daily, Weekly, Mon-Fri, Weekends, Custom), customDays?, eminderTime?, durationMinutes?, startDate, endDate?, ctive: boolean, 
otes?, calendarEventId? *(obsolete)*, weight?. |
| **Daily Logs** | DailyLogEntry | ebuild_2027_daily_logs_v2 | Granular daily execution events. Fields: id, date (YYYY-MM-DD), goalId, goalName?, category?, 	arget?, completed: boolean, ailureReason?, 
otes?, 	imestamp: number. |
| **Day Aggregations** | DayRecord | Computed in memory | Daily score calculation: score = Math.round((completedGoals / totalActiveGoals) * 100). Stores entries: Record<string, { completed: boolean; failureReason?: string }>. |
| **Failure Reasons** | FailureReason & string[] | ebuild_2027_settings_v2 | 15 friction categories captured when NO is tapped. Declared as union in 	ypes.ts and array in DEFAULT_FAILURE_REASONS. Stored as custom list in AppSettings.failureReasons. |
| **Weekly Rewards** | WeeklyReward | ebuild_2027_weekly_rewards_v2 | Predefined weekly rewards. Fields: id, weekId (YYYY-Www), weekNumber, year, startDate, endDate, ewardName, ewardType, udget, ctualSpend, currency, equiredScore (default 90), isConfigLocked, isClaimed, claimedAt?, 
otes?. Unlocks at weekScore >= 90 && recordedDaysCount >= 3. |
| **Monthly Rewards** | MonthlyReward | ebuild_2027_monthly_rewards_v2 | Predefined monthly rewards. Fields: id, monthId (YYYY-MM), monthName, year, ewardName, ewardType, udget, ctualSpend, currency, equiredScore (default 90), isClaimed, claimedAt?, 
otes?. Unlocks at monthlyScore >= 90 && recordedDaysCount >= 10. |
| **2027 Milestones** | Milestone2027 | ebuild_2027_milestones_v2 | Long-term ambition vault. Fields: id, 	itle, description, category, eward, ewardCategory, udget?, currency, chieved: boolean, chievedDate?, isPredefined?. Unlocks exclusively via manual user confirmation with real-world verification dialog. |
| **Settings** | AppSettings | ebuild_2027_settings_v2 | Global parameters: weeklyRewardThreshold (90), monthlyRewardThreshold (90), currency (₹), weekStartDay (1 = Monday), categories: string[], ailureReasons: string[], spreadsheetId? *(obsolete)*, spreadsheetUrl? *(obsolete)*, lastSyncedAt? *(obsolete)*. |
| **Initialization** | oolean | ebuild_2027_initialized_v2 | Flag indicating whether first-time clean state has been seeded to prevent re-initializing over user data. |

### 1.2 State Storage Architecture

1. **Storage Technology**: window.localStorage (browser Web Storage API).
2. **State Pattern**:
   - Root state is centralized in src/App.tsx using standard React useState hooks.
   - There is **no Redux, no Zustand, and no React Context**. State and action handlers are passed down as explicit props to the 7 view components (TodayView, GoalsView, WeeklyRewardsView, MonthlyView, Milestones2027View, AnalysisView, SettingsView).
3. **Read Flow**:
   - On component mount (useEffect in App.tsx:71), loadStoredState() in src/services/storage.ts executes synchronously.
   - It reads raw JSON strings from localStorage, parses them, and falls back to clean starter defaults (generateCleanState()) if uninitialized or if parsing fails.
4. **Write Flow**:
   - An auto-sync useEffect in App.tsx:83 triggers on any change to [goals, dailyLogs, weeklyRewards, monthlyRewards, milestones, settings, isLoaded].
   - Calls saveStoredState(state) which executes 6 localStorage.setItem calls synchronously.

### 1.3 Persistence Verification (Reboots, Restarts, Webview Reloads)

| Scenario | Persistence Behavior | Mechanism | Risk Assessment |
|---|---|---|---|
| **Webview Reload (F5 / location.reload)** | **100% Persisted** | Synchronously re-read from localStorage. | Zero risk. |
| **App Backgrounding / Task Switcher** | **100% Persisted** | Memory state stays intact; storage already flushed on edit. | Zero risk. |
| **App Force Kill & Restart** | **100% Persisted** | Capacitor Android/iOS WebView maps localStorage to SQLite/file-backed persistent storage in app private directory (/data/data/com.rebuild.app/app_webview/Local Storage). | Zero risk under standard usage. |
| **Device Reboot** | **100% Persisted** | Files in app private directory survive OS reboots. | Zero risk under standard usage. |
| **OS Extreme Low Memory / Disk Pressure** | **Conditional** | Mobile OSes (especially iOS WebKit) can technically evict localStorage under critical disk pressure. | For extreme safety in production, storing an automated JSON snapshot via @capacitor/preferences or local SQLite could provide secondary resilience, though localStorage fulfills the immediate requirements. |

### 1.4 Backup and Restore Implementation

- **Export Mechanism (exportBackupNative in src/services/native.ts)**:
  - Encodes the full AppState object into formatted JSON (JSON.stringify(fullExportState, null, 2)).
  - Native Platform: Calls @capacitor/share Share.share({ title: 'REBUILD 2027 Backup', text: stateJson, dialogTitle: 'Share or Save REBUILD Backup' }).
  - Web Platform Fallback: Generates a dynamic data:text/json;charset=utf-8, data URI and clicks an invisible <a> download anchor with filename ebuild_2027_backup_YYYY-MM-DD.json.
  - **Observation on Native Share**: Sharing raw JSON as 	ext shares the payload content as string text to messaging/email apps. To save as a physical .json file on Android/iOS via native share, writing the file to @capacitor/filesystem cache and sharing the file URI would be more robust.
- **Import Mechanism (handleImportJSON in src/components/SettingsView.tsx)**:
  - Uses standard <input type=file accept=.json> and FileReader.readAsText.
  - Parses incoming JSON and verifies if (parsed.goals && parsed.settings).
  - Calls onImportState(parsed) in App.tsx, which updates goals, dailyLogs, weeklyRewards, monthlyRewards, milestones, and settings.
  - Because App.tsx has an auto-save useEffect, updating these states immediately flushes the imported data to localStorage.

---

## 2. R2: Complete Removal of Google & External Cloud Dependencies

### 2.1 Inventory of Target Remote Sync Files

Requirement R2 mandates:
> Zero Google OAuth, zero Google Sheets sync, zero Google Drive creation, zero Google Calendar event creation, and zero Sync modals.
> Completely prune all dead imports and files related to remote sync (googleSheets.ts, googleCalendar.ts, auth.ts, GoogleSyncModal.tsx).

**Status of Target Files in Source Code (src/)**:

| Target File Mentioned in R2 | Current Existence in src/ | Status / Observation |
|---|---|---|
| googleSheets.ts | **NOT FOUND** | Does not exist anywhere in src/ or project. |
| googleCalendar.ts | **NOT FOUND** | Does not exist anywhere in src/ or project. |
| uth.ts | **NOT FOUND** | Does not exist anywhere in src/ or project. |
| GoogleSyncModal.tsx | **NOT FOUND** | Does not exist anywhere in src/ or project. |

*Finding*: The codebase has already had these active sync implementation files removed from src/. No active imports of these files remain in any component.

### 2.2 Repository-Wide Google & Cloud References Audit

A deep search across the entire project identified residual cloud configurations and schema remnants:

1. **irebase-applet-config.json (Root Directory)**:
   - **File Path**: d:\Thiyo\Rebuild\Rebuild-main\firebase-applet-config.json
   - **Content**:
     `json
     {
       projectId: gen-lang-client-0103147346,
       appId: 1:188164293159:web:aaec4b3246bd11a862c402,
       apiKey: AIzaSyAYkUxrBrTRyi8lkyCICXA0EiQuIbvFxZE,
       authDomain: gen-lang-client-0103147346.firebaseapp.com,
       storageBucket: gen-lang-client-0103147346.firebasestorage.app,
       messagingSenderId: 188164293159,
       measurementId: ",
 oAuthClientId: 188164293159-i05sf4v6sii3ijt00brvb3uhmborg3o0.apps.googleusercontent.com,
 recaptchaSiteKey: 
 }
 `
 - **Action Required**: This file contains live Google OAuth and Firebase credentials from Google AI Studio. It must be completely deleted.

2. **.env.example (Root Directory)**:
 - **File Path**: d:\Thiyo\Rebuild\Rebuild-main\.env.example
 - **Content**:
 `env
 GEMINI_API_KEY=MY_GEMINI_API_KEY
 APP_URL=MY_APP_URL
 `
 - **Action Required**: Contains cloud AI and OAuth callback comments. Remove or replace with empty template since no cloud backend or Gemini API is used.

3. **metadata.json (Root Directory)**:
 - **File Path**: d:\Thiyo\Rebuild\Rebuild-main\metadata.json
 - **Lines 3 & 5**:
 `json
 description: A goal execution and consistency tracking system with Google Sheets and Calendar synchronization, rewards vault, and failure reason analytics.,
 majorCapabilities: [MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API]
 `
 - **Action Required**: Remove Google Sheets, Calendar, and Gemini API descriptions. Update to reflect 100% offline personal execution system.

4. **src/types.ts (Residual Cloud Schema Fields)**:
 - Line 16: calendarEventId?: string; on interface Goal.
 - Line 127: spreadsheetId?: string; on interface AppSettings.
 - Line 128: spreadsheetUrl?: string; on interface AppSettings.
 - Line 129: lastSyncedAt?: string; on interface AppSettings.
 - **Action Required**: Prune these 4 fields from src/types.ts.

5. **src/components/TodayView.tsx**:
 - Line 231: {/* Quick sync & status action */} (residual code comment).
 - **Action Required**: Clean comment during next UI pass.

6. **index.html**:
 - Lines 13-14:
 `html
 <link rel=preconnect href=https://fonts.googleapis.com />
 <link rel=preconnect href=https://fonts.gstatic.com crossorigin />
 `
 - **Observation**: All fonts are sourced from Fontshare (pi.fontshare.com/v2/css?f[]=satoshi...). These Google preconnect links are redundant.

7. **ndroid/app/build.gradle**:
 - Lines 48-53: Capacitor default build script checks for google-services.json. Since google-services.json does not exist, the plugin is not applied:
 logger.info(google-services.json not found, google-services plugin not applied. Push Notifications won't work)
 - **Observation**: Harmless fallback, but the com.google.gms:google-services classpath can be pruned if pure clean builds are desired.

### 2.3 Dead Packages in package.json

An audit of package.json against all TypeScript and CSS imports in src/ reveals 8 dead or unused dependencies:

| Package | Location in package.json | Used in src/? | Recommendation |
|---|---|---|---|
| @google/genai (^2.4.0) | dependencies | **NO** (0 imports) | **PRUNE IMMEDIATELY**. Dead Google Cloud AI SDK. |
| irebase (^12.18.0) | dependencies | **NO** (0 imports) | **PRUNE IMMEDIATELY**. Dead external cloud backend SDK. |
| express (^4.21.2) | dependencies | **NO** (0 imports) | **PRUNE IMMEDIATELY**. Backend server package in a pure client Capacitor app. |
| @types/express (^4.17.21) | devDependencies | **NO** (0 imports) | **PRUNE IMMEDIATELY**. Types for unused express. |
| dotenv (^17.2.3) | dependencies | **NO** (0 imports) | **PRUNE IMMEDIATELY**. Node environment variable loader. |
| sx (^4.21.0) | devDependencies | **NO** (0 scripts) | **PRUNE**. Unused TypeScript execution engine. |
| lucide-react (^0.546.0) | dependencies | **NO** (0 imports) | **PRUNE**. App exclusively uses Remix Icon CSS. |
| motion (^12.23.24) | dependencies | **NO** (0 imports) | **PRUNE**. Animations use pure Tailwind and canvas-confetti. |
| ite (^6.2.3) | Duplicated in both | Used | **CLEANUP**. Remove from dependencies, keep in devDependencies. |

Additionally:
- package.json metadata has name: react-example. Should be renamed to name: rebuild.
- Script clean: rm -rf dist server.js references non-existent server.js.

---

## 3. Recommended Action Plan for Implementation Agents

1. **Package Pruning (package.json)**:
 - Uninstall/remove @google/genai, irebase, express, @types/express, dotenv, sx, lucide-react, motion.
 - Deduplicate ite into devDependencies.
 - Run clean install (yarn install or un install).
2. **Delete Cloud Configuration Files**:
 - Delete irebase-applet-config.json.
 - Sanitize or delete .env.example.
 - Update metadata.json to remove Google references and capabilities.
3. **Prune Cloud Types in src/types.ts**:
 - Remove calendarEventId from Goal.
 - Remove spreadsheetId, spreadsheetUrl, and lastSyncedAt from AppSettings.
4. **Harden Backup & Restore**:
 - In src/services/native.ts, consider leveraging @capacitor/filesystem to write the JSON file to cache before invoking Share.share({ url: fileUri }) so mobile devices present file-saving dialogs (Save to Files/Drive/Downloads) rather than raw text sharing.
 - In SettingsView.tsx, ensure handleImportJSON cleanly restores all entities even if one array is empty.

---

*Report authored by Data & Cloud Pruning Explorer — REBUILD Teamwork.*
