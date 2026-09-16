# Handoff Report: Infra & Aesthetics Spec Miner

**Agent Folder:** `.agents/teamwork_preview_spec_miner_survey_infra`  
**Date:** 2026-09-11  
**Mission:** Read-only specification mining of R8 (Typography & Zero Italics), R9 (Remixicon Icon System & Offline Protection), and R10 (Mobile Ergonomics & Capacitor Integration).  

---

## 1. Observation

1. **R8: Typography & Zero Italics:**
   - Font loading in `index.html:15`:
     ```html
     <link href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&display=swap" rel="stylesheet" />
     ```
   - Font import in `src/index.css:1`:
     ```css
     @import url('https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&display=swap');
     ```
   - Global typography rules in `src/index.css:21-29`:
     ```css
     *, *::before, *::after {
       font-style: normal !important;
       -webkit-tap-highlight-color: transparent;
       box-sizing: border-box;
     }

     html, body, button, input, select, textarea, p, span, h1, h2, h3, h4, h5, h6, a, label, table, td, th {
       font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
     }
     ```
   - Codebase-wide grep for `italic` across all `.ts`, `.tsx`, `.css`, `.html`, `.json`, `.md`, `.gradle` returned **0 matches**.
   - Codebase-wide grep for `<em>` returned **0 matches**.
   - Codebase-wide grep for `</i>` returned **0 matches**.
   - All `<i>` tags (48+ instances across `src/components/*.tsx`) are self-closing (`<i className="ri-..." />`) and explicitly reset via `src/index.css:32-36`:
     ```css
     [class^="ri-"], [class*=" ri-"], i[class*="ri-"] {
       font-family: 'remixicon' !important;
       font-style: normal !important;
       speak: never;
     }
     ```
   - There are **zero local Satoshi font files** in `assets/`, `public/`, or `src/`.

2. **R9: Remixicon Icon System & Offline Bundling:**
   - `package.json:33` lists `"remixicon": "^4.9.1"`.
   - `src/main.tsx:3` imports `'remixicon/fonts/remixicon.css'`.
   - `dist/assets/` contains the bundled local font files: `remixicon-CZw4FkzQ.woff2` (189 KB), `remixicon-S6an_USy.woff` (260 KB), `remixicon-sqouR8Ox.ttf` (613 KB), `remixicon-B25hvfAs.eot` (613 KB), `remixicon-BTtOSOPh.svg` (3.0 MB).
   - `index.html:18` contains redundant external CDN link:
     ```html
     <link href="https://cdn.jsdelivr.net/npm/remixicon@4.3.0/fonts/remixicon.css" rel="stylesheet" />
     ```
   - `package.json:29` lists `"lucide-react": "^0.546.0"`, but grep for `lucide` in `src/` yielded **0 matches**. Grep for `<svg` in `src/` yielded **0 matches**.

3. **R10: Mobile Ergonomics & Capacitor Plugins:**
   - `package.json:14-20` dependencies:
     ```json
     "@capacitor/android": "^7.0.1",
     "@capacitor/app": "^7.0.0",
     "@capacitor/core": "^7.0.1",
     "@capacitor/haptics": "^7.0.0",
     "@capacitor/share": "^7.0.0",
     "@capacitor/splash-screen": "^7.0.0",
     "@capacitor/status-bar": "^7.0.0",
     ```
   - `capacitor.config.ts` configures `appId: 'com.rebuild.app'`, `appName: 'REBUILD'`, `webDir: 'dist'`, `server: { androidScheme: 'https' }`, and plugin blocks for `StatusBar` and `SplashScreen`.
   - `android/capacitor.settings.gradle` and `android/app/capacitor.build.gradle` include and implement all 5 plugins.
   - `android/app/src/main/assets/capacitor.plugins.json` lists all 5 plugins.
   - `android/app/src/main/AndroidManifest.xml:41`:
     ```xml
     <uses-permission android:name="android.permission.INTERNET" />
     ```
     `android.permission.VIBRATE` is absent.
   - `src/App.tsx:51-67` implements `CapApp.addListener('backButton')` which handles top-level tab switching to 'today' or `exitApp()`, but does not inspect or dismiss open bottom sheets or modals.
   - Screen padding in `src/App.tsx:303`: `<main className="... px-3 sm:px-6 ...">` (12px instead of 16px).
   - Touch targets: Header settings button (`Navbar.tsx:243`) is `w-10 h-10` (40px); time range filter buttons (`AnalysisView.tsx:190`) are `min-h-[40px]`; modal close buttons (`ConfirmationModal.tsx:68`, `Navbar.tsx:365`) are `w-9 h-9` or `w-10 h-10` (36–40px).
   - Bottom sheets: 6 sheets/modals (`TodayView` failure reason and quick add, `GoalsView` goal editor and starter blueprints, `Navbar` more menu drawer, `ConfirmationModal`) use `rounded-t-3xl`, slide-up animation, and `<div className="w-12 h-1.5 rounded-full bg-slate-700" />` drag handles.
   - 16px input font: `src/index.css:49-51` forces `input, select, textarea { font-size: 16px !important; }`.
   - Circular progress ring: `src/components/TodayView.tsx:204` renders a square box (`w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-slate-950/80`) with text, not a circular animated ring.

---

## 2. Logic Chain

1. **From Observation 1 (Typography):**
   - Because Satoshi is fetched from `api.fontshare.com` via `<link>` in `index.html:15` and `@import` in `src/index.css:1`, and no local `.woff2` files exist in `assets/` or `public/`, an offline user on a device without primed cache will fail to fetch the font. The browser will fall back to system fonts (`-apple-system`, `Roboto`, `Segoe UI`), violating the 100% offline requirement of R8.
   - Because 0 occurrences of `italic`, `font-style: italic`, `<em>`, or `</i>` exist in any file, and global CSS sets `font-style: normal !important`, the zero italics requirement of R8 is 100% satisfied.

2. **From Observation 2 (Icons & Bundling):**
   - Because `remixicon` npm package is imported in `src/main.tsx:3`, Vite bundles the icon webfonts directly into `dist/assets/remixicon-*.woff2`. The app has local offline icon glyph support.
   - However, because `index.html:18` still retains `<link href="https://cdn.jsdelivr.net/npm/remixicon@4.3.0/fonts/remixicon.css" rel="stylesheet" />`, the app attempts an unnecessary external network round-trip on startup, violating the offline-first zero cloud dependency standard of R2 and R9.
   - Because `lucide-react` is listed in `package.json` but has 0 imports in `src/`, it is dead weight and can be pruned.

3. **From Observation 3 (Capacitor & Mobile Ergonomics):**
   - All 5 plugins are present in `package.json` and properly wired in `android/` Gradle files.
   - In `AndroidManifest.xml`, without `<uses-permission android:name="android.permission.VIBRATE" />`, the Android OS security sandbox will deny vibration permissions to `@capacitor/haptics`.
   - In `App.tsx`, the hardware back button listener directly switches tabs or calls `exitApp()`. When a user has a slide-up bottom sheet open (e.g. FailureReason, GoalEditor, MoreDrawer), pressing the Android hardware back button will exit the app instead of closing the sheet.
   - In `App.tsx:303`, `px-3` provides 12px horizontal padding on mobile screens, which breaches the 16px mobile spacing specification in R10.
   - The Today score indicator is currently a box, missing the circular progress ring requested in R4 and R10.

---

## 3. Caveats

- **No Code Modifications:** In strict compliance with the dispatch instructions ("Do NOT modify any files"), no source code, HTML, CSS, or manifest files were altered.
- **Physical Device Execution:** Haptics and native hardware back-button behavior were assessed from static code and manifest inspection; physical Android hardware was not connected during this session.
- **Windows Terminal Commands:** Build scripts (`yarn clean`) were inspected statically; `rm -rf` was flagged for Windows PowerShell environments without running destructive commands.

---

## 4. Conclusion

The `Rebuild-main` codebase possesses a solid architectural foundation for offline mobile execution, but has several specific infrastructural and ergonomic gaps that must be resolved to fulfill R8, R9, and R10:
1. **R8:** Satoshi font must be downloaded into local assets and referenced via local `@font-face`, completely removing the CDN `@import` and `<link>` tags. Zero italics is already 100% verified.
2. **R9:** Remove the jsDelivr CDN link from `index.html`. Local Remixicon bundling is already verified in `dist/assets/`. Prune unused `lucide-react`.
3. **R10:** Add `<uses-permission android:name="android.permission.VIBRATE" />` to `AndroidManifest.xml`. Add a modal dismissal check to `CapApp.addListener('backButton')` in `App.tsx`. Adjust mobile screen padding to `px-4` (16px). Upgrade undersized touch targets to 44–48dp. Implement the circular SVG progress ring in `TodayView.tsx`. Add `"cap": "cap"` to `package.json` scripts.

---

## 5. Verification Method

1. **Verify Zero Italics:**
   ```powershell
   # Run from d:\Thiyo\Rebuild\Rebuild-main
   Get-ChildItem -Recurse -Include *.ts,*.tsx,*.css,*.html,*.json -Exclude node_modules,dist | Select-String -Pattern "italic" -CaseSensitive:$false
   # Expected: 0 results
   ```
2. **Verify Font and CDN Links:**
   - Inspect `index.html` lines 13–18: check for removal of Fontshare and jsDelivr links.
   - Inspect `src/index.css` line 1: check for replacement of Fontshare `@import` with local `@font-face`.
3. **Verify Android Manifest Permissions:**
   - Inspect `android/app/src/main/AndroidManifest.xml`: confirm presence of `android.permission.VIBRATE`.
4. **Verify TypeScript & Build:**
   ```powershell
   yarn lint
   yarn build
   ```
   Check that `dist/` builds with 0 errors and contains bundled local font assets.
5. **Verify Capacitor Android Sync:**
   ```powershell
   npx cap sync android
   ```
   Confirm all 5 plugins update without errors in Android assets.
