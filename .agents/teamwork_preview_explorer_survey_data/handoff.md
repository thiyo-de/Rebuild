# Handoff Report: Data Layer & Cloud Pruning Survey

**Agent**: Data & Cloud Pruning Explorer  
**Working Directory**: d:\Thiyo\Rebuild\Rebuild-main\.agents\teamwork_preview_explorer_survey_data  
**Report Artifact**: d:\Thiyo\Rebuild\Rebuild-main\.agents\teamwork_preview_explorer_survey_data\survey_data_report.md  
**Target Milestone**: survey_data -> plan / implement  

---

### 1. Observation

1. **Zero Auth & Local Storage Architecture**:
   - src/services/storage.ts lines 16-24 defines storage keys:
     `	s
     const STORAGE_KEYS = {
       GOALS: 'rebuild_2027_goals_v2',
       DAILY_LOGS: 'rebuild_2027_daily_logs_v2',
       WEEKLY_REWARDS: 'rebuild_2027_weekly_rewards_v2',
       MONTHLY_REWARDS: 'rebuild_2027_monthly_rewards_v2',
       MILESTONES: 'rebuild_2027_milestones_v2',
       SETTINGS: 'rebuild_2027_settings_v2',
       IS_INITIALIZED: 'rebuild_2027_initialized_v2',
     };
     `
   - src/App.tsx lines 71-93: On mount, loadStoredState() loads all 6 entities from localStorage. On state changes, an auto-save useEffect invokes saveStoredState().
   - src/App.tsx contains no authentication providers, login screens, API keys, or backend server requests.

2. **Data Entities Inventory**:
   - src/types.ts:
     - Goal (lines 3-18): 13 fields including ctive: boolean (used for pause/resume), category, 	arget, requency, and obsolete calendarEventId?: string;.
     - FailureReason (lines 20-36): 15 friction reasons ('Illness' | 'Mental fog' | 'Too tired' | 'Lazy / low energy' | 'Procrastination' | 'Phone / social media' | 'Porn / distraction' | 'Work' | 'Unexpected situation' | 'Poor planning' | 'Forgot' | 'Goal was too difficult' | 'Goal was unrealistic' | 'No specific reason' | 'Other').
     - DailyLogEntry (lines 39-50): Daily execution records with completed: boolean, ailureReason?: string, 	imestamp.
     - WeeklyReward (lines 71-88): Unlocks at weekScore >= requiredThreshold && recordedDaysCount >= 3 (WeeklyRewardsView.tsx:51).
     - MonthlyReward (lines 90-104): Unlocks at monthlyScore >= requiredThreshold && recordedDaysCount >= 10 (MonthlyView.tsx:61).
     - Milestone2027 (lines 106-118): Unlocks only via user manual confirmation dialog (Milestones2027View.tsx:95-112).
     - AppSettings (lines 120-130): Global config containing 3 obsolete fields: spreadsheetId?, spreadsheetUrl?, lastSyncedAt?.

3. **Backup & Restore**:
   - src/services/native.ts lines 67-89 (exportBackupNative): Calls @capacitor/share Share.share({ title: 'REBUILD 2027 Backup', text: stateJson, dialogTitle: 'Share or Save REBUILD Backup' }) if native, with an HTML <a download> fallback.
   - src/components/SettingsView.tsx lines 100-121 (handleImportJSON): Reads file using FileReader.readAsText, validates if (parsed.goals && parsed.settings), and updates all 6 entity stores via onImportState.

4. **Remote Sync Files & Cloud Dependencies**:
   - googleSheets.ts, googleCalendar.ts, uth.ts, GoogleSyncModal.tsx: ind_by_name across src/ and project returned 0 matches. None exist in src/.
   - irebase-applet-config.json in root: Contains live Google Cloud project gen-lang-client-0103147346, OAuth client ID 188164293159-i05sf4v6sii3ijt00brvb3uhmborg3o0.apps.googleusercontent.com, and Firebase API key.
   - .env.example in root: Mentions GEMINI_API_KEY and Google Cloud Run APP_URL.
   - metadata.json in root: Contains description: ...with Google Sheets and Calendar synchronization... and majorCapabilities: [MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API].
   - package.json dependencies:
     - @google/genai: 0 references in src/.
     - irebase: 0 references in src/.
     - express: 0 references in src/.
     - @types/express: 0 references in src/.
     - dotenv: 0 references in src/.
     - 	sx: 0 references in src/.
     - lucide-react: 0 references in src/ (app uses Remix Icon CDN).
     - motion: 0 references in src/ (app uses pure CSS/Tailwind transitions).

---

### 2. Logic Chain

1. Because the search across src/ for googleSheets.ts, googleCalendar.ts, uth.ts, and GoogleSyncModal.tsx returned zero files and zero import errors, these remote sync modules are already completely absent from the runtime code.
2. Because irebase-applet-config.json, .env.example, and metadata.json exist in the project root with active Google AI Studio / Firebase credentials and capabilities, they represent residual cloud configurations from initial scaffolding and must be deleted or sanitized.
3. Because Goal.calendarEventId, AppSettings.spreadsheetId, AppSettings.spreadsheetUrl, and AppSettings.lastSyncedAt exist in src/types.ts without being consumed by any business logic or UI component, they are dead schema remnants of the eliminated Google integration and can be safely deleted.
4. Because grep searches across src/ confirmed 0 imports for @google/genai, irebase, express, @types/express, dotenv, 	sx, lucide-react, and motion, all eight packages in package.json are dead weight and should be pruned to minimize attack surface, bundle size, and build overhead.
5. Because state is managed at the React root in App.tsx and mirrored synchronously to window.localStorage on every change, data survives webview reloads, backgrounding, force stops, and device reboots on both Android and iOS Capacitor WebViews.

---

### 3. Caveats

1. **Native Share Payload**: While @capacitor/share is integrated in src/services/native.ts, passing the full JSON string in Share.share({ text: stateJson }) on Android or iOS passes string text to the share sheet rather than a discrete file attachment. To guarantee a .json file that users can save to device storage, writing to cache via @capacitor/filesystem and sharing the file URI is recommended.
2. **Web Storage Purge Edge Cases**: Although localStorage persists across reboots, mobile OSes under critical storage shortage (< 500MB free disk) may technically purge WebKit/Chromium local storage. For single-user mission-critical apps, regular JSON backups are essential.
3. **Android Gradle Google Services Classpath**: ndroid/build.gradle has classpath 'com.google.gms:google-services:4.4.2', but ndroid/app/build.gradle has conditional logic skipping it because google-services.json is missing. This does not cause build failure, but can be cleaned up if desired.

---

### 4. Conclusion

- **R1 Status**: Fully met architecturally. The app is 100% offline, zero-auth, with complete entity schemas for Goals, Daily Logs, Day Records, 15 Failure Reasons, Weekly/Monthly Rewards, 2027 Milestones, and Settings. Single-file JSON export and import exist and are functional.
- **R2 Status**: The target sync files (googleSheets.ts, googleCalendar.ts, uth.ts, GoogleSyncModal.tsx) are already deleted from src/. However, five residual cloud artifacts must be pruned:
  1. Delete irebase-applet-config.json.
  2. Sanitize .env.example and metadata.json.
  3. Prune calendarEventId, spreadsheetId, spreadsheetUrl, lastSyncedAt from src/types.ts.
  4. Prune 8 dead dependencies from package.json (@google/genai, irebase, express, @types/express, dotenv, 	sx, lucide-react, motion).

---

### 5. Verification Method

1. **Verify Absence of Sync Files**:
   `ash
   # Run in d:\Thiyo\Rebuild\Rebuild-main
   dir src\googleSheets.ts src\googleCalendar.ts src\auth.ts src\components\GoogleSyncModal.tsx
   # Expected: File Not Found for all
   `
2. **Verify Dead Package Absence in Source**:
   `powershell
   Select-String -Path src\**\*.ts,src\**\*.tsx -Pattern @google/genai,firebase,express,dotenv,lucide-react,motion
   # Expected: 0 matches
   `
3. **Verify LocalStorage Keys & Persistence**:
   Inspect src/services/storage.ts lines 16-24 and run 
pm run lint or 
px tsc --noEmit to confirm complete type safety.
