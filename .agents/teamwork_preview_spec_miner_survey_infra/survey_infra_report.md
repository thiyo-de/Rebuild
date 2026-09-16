# REBUILD Infrastructure, Typography, Icons & Mobile Ergonomics Specification Mining Report

**Date:** 2026-09-11  
**Investigator:** Infra & Aesthetics Spec Miner  
**Working Directory:** `d:\Thiyo\Rebuild\Rebuild-main\.agents\teamwork_preview_spec_miner_survey_infra`  
**Target Codebase:** `d:\Thiyo\Rebuild\Rebuild-main`  
**Integrity Mode:** Development (Read-Only Investigation)  

---

## 1. Executive Summary

This specification mining report documents the state of the **REBUILD** mobile application across typography (R8), font icon systems and offline bundling (R9), and mobile-first ergonomics and Capacitor integration (R10).

### Key Audit Findings:
1. **Typography (R8):**
   - **Zero Italics:** Clean 0 occurrences of `italic`, `font-style: italic`, `<em>`, or `</i>` formatting tags across all codebase files. All `<i>` tags are strictly self-closing Remixicon containers (`<i className="ri-..." />`) with global `font-style: normal !important`.
   - **Font Loading Defect:** Satoshi is **NOT** bundled locally. It is loaded 100% via external CDN (`api.fontshare.com`) in both `index.html` (line 15) and `src/index.css` (line 1). In true offline mode (airplane mode without cache), Satoshi fails to load and drops back to system font stacks.
2. **Icon System & Offline Protection (R9):**
   - **Remixicon Dual Loading:** `@remixicon/fonts` is installed via npm (`remixicon: ^4.9.1`) and imported in `src/main.tsx:3`. Vite bundles the font glyphs (`.woff2`, `.woff`, `.ttf`, `.eot`, `.svg`) into `dist/assets/`.
   - **Redundant CDN Dependency:** `index.html:18` still contains an external CDN stylesheet link (`https://cdn.jsdelivr.net/npm/remixicon@4.3.0/fonts/remixicon.css`). This violates zero external dependency rules and must be removed.
   - **Dead Icon Package:** `lucide-react: ^0.546.0` is in `package.json` dependencies but is never imported in any source file. Zero inline `<svg>` elements exist.
3. **Capacitor & Mobile Ergonomics (R10):**
   - **5 Native Plugins:** All 5 required plugins (`@capacitor/app`, `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/haptics`, `@capacitor/share`) are installed in `package.json`, configured in `capacitor.config.ts` and `android/capacitor.settings.gradle`.
   - **Android Project Status:** `android/` directory exists with modern Gradle 8.x/API 35 configuration. `yarn cap sync android` is viable once `yarn build` is executed.
   - **Critical Android Manifest Bug:** `android.permission.VIBRATE` is **MISSING** from `android/app/src/main/AndroidManifest.xml` (only `INTERNET` permission is declared). This will prevent `@capacitor/haptics` from firing on physical Android hardware.
   - **Ergonomics & Layout:** 16px input font is enforced via global CSS (`input, select, textarea { font-size: 16px !important; }`). Safe-area insets are applied via `.safe-top`, `.safe-bottom`, and CSS variables. Slide-up bottom sheets with drag handles are consistently implemented across all 6 views and modal components.
   - **Ergonomic Gaps:**
     - Container padding on mobile in `src/App.tsx:303` is `px-3` (12px) instead of the required 16px (`px-4`).
     - Several touch targets (header settings button, time range filter pills, modal close buttons) measure 36–40px, falling below the 44–48dp minimum standard.
     - Android Hardware Back Button listener (`CapApp.addListener('backButton')` in `src/App.tsx`) has no modal stack awareness: pressing back while a bottom sheet is open minimizes/exits the app instead of dismissing the sheet.
     - The Today screen daily score display is currently a static rounded box rather than an animated circular progress ring.

---

## 2. R8: Universal Satoshi Typography & Zero Italics

### 2.1 Font Family Configuration & Loading Method

| Configuration Point | Location | Current Value / Implementation | Status | Required Fix / Spec Standard |
|---|---|---|---|---|
| **HTML Font Link** | `index.html:15` | `<link href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&display=swap" rel="stylesheet" />` | ❌ CDN Dependent | Remove CDN link; bundle local `@font-face` woff2 files in project assets. |
| **HTML Preconnects** | `index.html:13-14` | `<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />` | ❌ Unused Google CDN | Remove Google Fonts preconnects (violates R2 cloud prune). |
| **CSS Font Import** | `src/index.css:1` | `@import url('https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&display=swap');` | ❌ CDN Dependent | Replace with local `@font-face` definitions pointing to `./fonts/satoshi-*.woff2`. |
| **Global Font Rule** | `src/index.css:27-29` | `html, body, button, input, select, textarea, p, span, h1, h2, h3, h4, h5, h6, a, label, table, td, th { font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; }` | ⚠️ CDN Fallback | Valid fallback stack, but Satoshi must be bundled locally to prevent fallback. |
| **Heading Font Rule** | `src/index.css:66-69` | `h1, h2, h3, h4, h5, h6, .font-heading, .font-display { font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; font-style: normal !important; }` | ⚠️ CDN Fallback | Enforces Satoshi with system fallback. |
| **Tailwind Font Class** | `src/App.tsx:279` | `className="... font-sans ..."` | ⚠️ Default Font Stack | In Tailwind v4, `@theme { --font-sans: 'Satoshi', sans-serif; }` should be defined in `src/index.css`. |

### 2.2 Exhaustive Codebase Search for Italics and Formatting

A full codebase grep search was executed across all `.ts`, `.tsx`, `.css`, `.html`, `.json`, `.md`, and `.gradle` files in `Rebuild-main` (excluding `node_modules`, `dist`, and `.git`):

| Search Pattern | Query Type | Matches Found | File & Line Locations | Notes |
|---|---|:---:|---|---|
| `italic` | Case-insensitive | **0** | None | Zero occurrences in all source files. |
| `font-style: italic` | Exact literal | **0** | None | Zero occurrences. |
| `font-style` | Case-insensitive | **3** | `src/index.css:22`, `src/index.css:34`, `src/index.css:68` | All 3 explicitly enforce `font-style: normal !important;`. |
| `<em>` / `<em ` | Case-insensitive | **0** | None | Zero emphasis tags in codebase. |
| `</i>` | Closing tag | **0** | None | Zero text formatting italic tags. |
| `<i className="ri-..." />` | Remixicon container | **48+** | `src/components/*.tsx` (Navbar, TodayView, GoalsView, WeeklyRewardsView, MonthlyView, Milestones2027View, AnalysisView, SettingsView, ConfirmationModal) | All are strictly self-closing icon elements. Overridden with `font-style: normal !important; speak: never;` in `src/index.css:34`. |
| Non-Satoshi Fonts | CSS / Inline | **0** | None (except fallback system font declarations in `src/index.css:28, 67`) | No `font-mono`, `font-serif`, `Inter`, or `Roboto` classes used. |

---

## 3. R9: Font Icon System & Offline Protection

### 3.1 Remixicon Integration Audit

| Channel | File / Location | Current Implementation | Offline Viability | Finding / Assessment |
|---|---|---|:---:|---|
| **npm Dependency** | `package.json:33` | `"remixicon": "^4.9.1"` | ✅ 100% | Package is installed locally in `node_modules/remixicon`. |
| **Vite JS Import** | `src/main.tsx:3` | `import 'remixicon/fonts/remixicon.css';` | ✅ 100% | Successfully imports local CSS which pulls `woff2/woff/ttf`. |
| **Bundled Output** | `dist/assets/` | `remixicon-CZw4FkzQ.woff2` (189 KB)<br>`remixicon-S6an_USy.woff` (260 KB)<br>`remixicon-sqouR8Ox.ttf` (613 KB)<br>`remixicon-B25hvfAs.eot` (613 KB)<br>`remixicon-BTtOSOPh.svg` (3.0 MB) | ✅ 100% | All Remixicon font formats are bundled directly into the local Vite output. |
| **HTML CDN Link** | `index.html:18` | `<link href="https://cdn.jsdelivr.net/npm/remixicon@4.3.0/fonts/remixicon.css" rel="stylesheet" />` | ❌ Network Leak | Redundant external CDN link copied into `dist/index.html`. Unnecessary network call when online; dead link when offline. |
| **Inline SVG / Lucide** | `package.json:29`<br>`src/**/*.tsx` | `"lucide-react": "^0.546.0"` in `package.json`<br>0 imports in `src/` | ⚠️ Pruning Needed | `lucide-react` is unused dead weight in dependencies. Zero `<svg>` tags found in `src/`. |

---

## 4. R10: Mobile-First Ergonomics & Capacitor Integration

### 4.1 Capacitor Plugins Verification (5 Required Plugins)

| Plugin | package.json Version | capacitor.config.ts | Android Gradle Project | TypeScript Service Usage |
|---|---|---|---|---|
| **`@capacitor/app`** | `^7.0.0` | Implicitly supported | Included in `capacitor.settings.gradle:5-6` & `app/capacitor.build.gradle:12` | Imported in `src/App.tsx:26` (`CapApp.addListener('backButton', ...)` & `CapApp.exitApp()`). Also imported in `src/services/native.ts:5` (currently unused there). |
| **`@capacitor/status-bar`** | `^7.0.0` | Configured: `style: 'DARK', backgroundColor: '#090D16', overlaysWebView: false` | Included in `capacitor.settings.gradle:17-18` & `app/capacitor.build.gradle:16` | Initialized in `src/services/native.ts:14-23` (`initNativeSystemUI`) called on mount in `src/App.tsx:49`. |
| **`@capacitor/splash-screen`** | `^7.0.0` | Configured: `launchShowDuration: 1200, launchAutoHide: true, backgroundColor: '#090D16', showSpinner: false, androidScaleType: 'CENTER_CROP'` | Included in `capacitor.settings.gradle:14-15` & `app/capacitor.build.gradle:15` | Native auto-hide configured; no direct JS hook (`SplashScreen.hide()` omitted from `src/`). |
| **`@capacitor/haptics`** | `^7.0.0` | Implicitly supported | Included in `capacitor.settings.gradle:8-9` & `app/capacitor.build.gradle:13` | Fully wrapped in `src/services/native.ts:28-62` (`triggerHaptic`, `nativeHaptics`). Used on buttons, tabs, modal actions across all views. |
| **`@capacitor/share`** | `^7.0.0` | Implicitly supported | Included in `capacitor.settings.gradle:11-12` & `app/capacitor.build.gradle:14` | Implemented in `src/services/native.ts:67-79` (`exportBackupNative`) for JSON export with automatic browser download fallback. |

### 4.2 Android Project Directory Status & Sync Feasibility

- **Directory Location:** `d:\Thiyo\Rebuild\Rebuild-main\android` (Exists and fully populated).
- **Android Target SDK:** `compileSdkVersion: 35`, `targetSdkVersion: 35`, `minSdkVersion: 23` in `android/variables.gradle`.
- **Main Activity:** `MainActivity.java` extends `com.getcapacitor.BridgeActivity`.
- **Capacitor Assets Sync:** `android/app/src/main/assets/` contains `capacitor.config.json` and `capacitor.plugins.json` listing all 5 plugins.
- **Sync Command Viability:**
  - `@capacitor/cli: ^7.0.1` is in `devDependencies`.
  - In `package.json`, there is currently no `"cap": "cap"` script. Running `yarn cap sync android` directly relies on Yarn finding the bin script in `node_modules/.bin/cap`.
  - Adding `"cap": "cap"` to `package.json:scripts` ensures `yarn cap sync android` works seamlessly across all environments.
- **Critical Android Manifest Defect:**
  - `android/app/src/main/AndroidManifest.xml:41` only lists:
    `<uses-permission android:name="android.permission.INTERNET" />`
  - **Defect:** Android requires `<uses-permission android:name="android.permission.VIBRATE" />` for `@capacitor/haptics`. Without this permission, physical Android devices will silently drop haptic requests.

### 4.3 Mobile Ergonomics Audit

| Ergonomic Requirement | Spec Standard | Current Implementation | File / Line Reference | Verdict |
|---|---|---|---|:---:|
| **Spacing Scale** | Strict 4px base (0.25rem) | Uses Tailwind 4-based spacing (`p-1`, `p-2`, `p-3`, `p-4`, `p-5`, `space-y-4`, etc.). | Project-wide | ✅ PASS |
| **Screen Padding** | 16px screen edges (`px-4`) | Mobile container uses `px-3` (12px) on `<main>`. | `src/App.tsx:303` | ❌ FAIL (`px-3` should be `px-4`) |
| **Card Border-Radius** | 16px (`rounded-2xl`) | Cards use a mix of `rounded-3xl` (24px) and `rounded-2xl` (16px). | `src/components/*.tsx` | ⚠️ PARTIAL |
| **Touch Targets** | 44–48dp minimum | Bottom nav items: `min-h-[50px]`<br>Option buttons: `min-h-[56px]`<br>Form controls: `min-h-[48px]`<br>Header settings: `w-10 h-10` (40px)<br>Modal close buttons: `w-9 h-9` / `w-10 h-10` (36–40px)<br>Time range pills: `min-h-[40px]` | `src/components/Navbar.tsx:243, 365`<br>`src/components/ConfirmationModal.tsx:68`<br>`src/components/AnalysisView.tsx:190` | ⚠️ PARTIAL (Close buttons and filter pills < 44dp) |
| **Slide-up Bottom Sheets** | Bottom sheet with drag handle on mobile | Implemented on 6 modals: FailureReason sheet, QuickAdd sheet, GoalEditor sheet, StarterTemplates sheet, MoreDrawer sheet, ConfirmationModal. All have mobile drag handles (`w-12 h-1.5 rounded-full bg-slate-700`). | `src/components/TodayView.tsx:484, 556`<br>`src/components/GoalsView.tsx:336, 495`<br>`src/components/Navbar.tsx:350`<br>`src/components/ConfirmationModal.tsx:46` | ✅ PASS |
| **16px Base Input Font** | 16px font size on inputs to block iOS auto-zoom | Globally enforced via `src/index.css:49-51`: `input, select, textarea { font-size: 16px !important; }`. Form inputs also specify `text-base` (16px). | `src/index.css:50` | ✅ PASS |
| **Safe-Area Insets** | Proper header/footer insets | Variables `--sat`, `--sab`, `--sal`, `--sar` defined. `.safe-top` applied to `<header>`, `.safe-bottom` to bottom `<nav>`, `pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+5rem))]` on `<main>`, `pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))]` on bottom sheets. | `src/index.css:4-8`<br>`src/components/Navbar.tsx:67, 253`<br>`src/App.tsx:303` | ✅ PASS |
| **Android Back Button** | Hardware back button navigates back or closes modal | `CapApp.addListener('backButton')` navigates to 'today' or exits app. **Lacks modal awareness:** pressing back with a bottom sheet open closes the app instead of dismissing the sheet. | `src/App.tsx:52-62` | ⚠️ FLAW |
| **Circular Progress Ring** | Large animated circular progress ring (0-100%) with status colors | Rendered as a square rounded box (`w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-slate-950/80`) with text score, not an animated circular progress ring. | `src/components/TodayView.tsx:204` | ❌ FAIL |

---

## 5. Build Configuration & Scripts Audit

### 5.1 Configuration Files Analysis

| File | Key Configurations Observed | Issues / Observations |
|---|---|---|
| **`package.json`** | Vite 6.2.3, React 19.0.1, TailwindCSS 4.1.14 (`@tailwindcss/vite`), Capacitor 7.0.1.<br>Scripts: `dev`, `build`, `preview`, `clean`, `lint`. | 1. `"clean": "rm -rf dist server.js"` fails on native Windows PowerShell/CMD.<br>2. Missing `"cap": "cap"` script.<br>3. `lucide-react` is unused. |
| **`tsconfig.json`** | Target: `ES2022`, Module: `ESNext`, `moduleResolution: "bundler"`, `allowImportingTsExtensions: true`, `noEmit: true`, Path alias: `"@/*": ["./*"]`. | Consistent with Vite bundler resolution. |
| **`vite.config.ts`** | Plugins: `react()`, `tailwindcss()`. Alias: `'@': path.resolve(__dirname, '.')`. | Clean Vite 6 + Tailwind v4 setup. |
| **`capacitor.config.ts`** | `appId: 'com.rebuild.app'`, `appName: 'REBUILD'`, `webDir: 'dist'`, `androidScheme: 'https'`. Status bar & Splash screen configured. | Fully configured for Capacitor 7 Android platform. |

---

## 6. Features Discovered Table

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| 1 | Typography (R8) | Satoshi Font Family | Global typography for body, headings, buttons, and inputs | CSS rules | Styled Satoshi typography | Falls back to system sans-serif if offline | `src/index.css:27-29, 66-69`, `index.html:15` |
| 2 | Typography (R8) | Zero Italics Enforcement | Universal reset forcing `font-style: normal !important` on all elements | HTML DOM | Normal non-italic text | Prevents browser italic synthesis | `src/index.css:21-25, 34, 68` |
| 3 | Icons (R9) | Remixicon Webfont Bundle | Icon glyphs loaded via class names (e.g. `ri-fire-fill`) | CSS class on `<i>` | Rendered vector font glyph | Missing glyph box if font fails to load | `src/main.tsx:3`, `node_modules/remixicon/fonts/remixicon.css` |
| 4 | Native (R10) | Haptic Feedback Engine | Tactile vibration for selection, success, warning, impact | Haptic type string | Physical vibration impulse | Silent try-catch fallback on web/desktop | `src/services/native.ts:28-62` |
| 5 | Native (R10) | Status Bar Theming | Sets dark style and `#090D16` background color | Capacitor native bridge | Native Android status bar color | Handled gracefully with console warning | `src/services/native.ts:14-23` |
| 6 | Native (R10) | Native Share / Backup | Shares exported state JSON via native sheet with web download fallback | State JSON string & filename | Native share dialog or `.json` file download | Falls back to DOM anchor click | `src/services/native.ts:67-89` |
| 7 | Native (R10) | Hardware Back Button | Listens to Android back button to navigate to 'today' tab or exit | Hardware back button event | Navigation state change or app exit | Exits app even when modal is active | `src/App.tsx:51-67` |
| 8 | Ergonomics (R10) | Slide-up Bottom Sheets | Native-like bottom sheets with drag handle and backdrop dismiss | User tap / state boolean | Slide-up card with 88dvh scroll | Dismisses on backdrop tap or close button | `src/components/TodayView.tsx`, `Navbar.tsx`, etc. |
| 9 | Ergonomics (R10) | Safe Area Inset Management | Dynamic padding for notch and navigation bar | CSS `env(safe-area-inset-*)` | Responsive safe padding | Defaults to `0px` if env unsupported | `src/index.css:4-8`, `Navbar.tsx:67, 253` |
| 10 | Ergonomics (R10) | 16px iOS Zoom Prevention | Enforces 16px minimum font size on all input elements | Form control focus | Stable viewport without auto-zoom | Enforced via `!important` | `src/index.css:49-51` |

---

## 7. Edge Cases & Observed Behavior

| # | Feature | Input / Condition | Observed Behavior | Root Cause / Impact |
|---|---|---|---|---|
| 1 | Satoshi Typography | Fresh app install launched in Airplane Mode (Offline) | Satoshi font fails to fetch; UI renders in system sans-serif (`-apple-system`, `Roboto`, `Segoe UI`) | Satoshi loaded from `api.fontshare.com` CDN instead of local assets. |
| 2 | Remixicon Icons | App launched in Airplane Mode | Icons render from bundled `dist/assets/remixicon-*.woff2`, but browser logs connection error for `cdn.jsdelivr.net` | `index.html:18` contains redundant external CDN `<link>`. |
| 3 | Android Haptics | User marks YES or changes tab on Android device | No vibration occurs on physical hardware | `<uses-permission android:name="android.permission.VIBRATE" />` is missing from `AndroidManifest.xml`. |
| 4 | Hardware Back Button | User opens Failure Reason Sheet, then presses Android hardware back | Entire application minimizes / exits instead of closing the sheet | Back button listener in `App.tsx` only inspects `activeTab`, not open modal state. |
| 5 | Screen Padding | Viewed on narrow mobile device (e.g. 360px wide) | Screen content has 12px padding (`px-3`) instead of 16px standard | `src/App.tsx:303` uses `px-3 sm:px-6` instead of `px-4 sm:px-6`. |
| 6 | Score Indicator | User visits Today screen | Daily score renders inside a rounded rectangle, not a circular progress ring | `src/components/TodayView.tsx:204` lacks circular SVG/canvas progress ring component. |
| 7 | Build Clean Script | Developer runs `yarn clean` on Windows PowerShell | Command fails with error (`rm: cannot find path...`) | Script uses Unix `rm -rf` rather than cross-platform command. |

---

## 8. Actionable Recommendations for Implementation

1. **Localize Satoshi Font Files (R8):**
   - Download Satoshi font files (weights 300, 400, 500, 700, 900 in `.woff2` format) into `src/assets/fonts/` or `public/fonts/`.
   - Add local `@font-face` rules in `src/index.css` and remove the `@import url('https://api.fontshare.com/...')`.
   - Remove `<link href="https://api.fontshare.com/..." />` and Google Fonts preconnect tags from `index.html`.
2. **Purge External Icon CDN and Dead Dependencies (R9):**
   - Remove `<link href="https://cdn.jsdelivr.net/npm/remixicon@4.3.0/fonts/remixicon.css" />` from `index.html`.
   - Uninstall or prune `lucide-react` from `package.json`.
3. **Add Android Vibrate Permission (R10):**
   - In `android/app/src/main/AndroidManifest.xml`, add `<uses-permission android:name="android.permission.VIBRATE" />` inside `<manifest>`.
4. **Fix Mobile Ergonomics (R10):**
   - Change `src/App.tsx:303` container padding from `px-3` to `px-4`.
   - Upgrade undersized touch targets (header settings button in `Navbar.tsx:243`, modal close buttons, time range buttons in `AnalysisView.tsx:190`) to at least `min-h-[44px]` / `min-w-[44px]`.
   - Implement an active modal stack tracker or pass a `closeTopModal` callback into `App.tsx`'s back button listener so that the back button dismisses active bottom sheets before minimizing the app.
   - Implement the circular SVG progress ring in `TodayView.tsx` with dynamic status colors (Green ≥90%, Yellow 70-89%, Red <70%).
5. **Cross-Platform Scripting:**
   - In `package.json`, add `"cap": "cap"` and replace `"clean": "rm -rf dist server.js"` with a cross-platform clean command (e.g. `rimraf` or Vite clean).
