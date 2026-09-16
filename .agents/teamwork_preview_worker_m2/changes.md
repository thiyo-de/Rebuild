# Milestone 2: Mobile-First Ergonomics & Capacitor Integration (R10) — Changes

## Summary of Changes
This milestone implemented all requirements under R10 (Mobile-First Ergonomics & Capacitor Integration) with strict adherence to the project's exclusive write ownership boundaries:
1. `android/app/src/main/AndroidManifest.xml`
2. `src/App.tsx`
3. `src/components/Navbar.tsx`
4. `src/components/ConfirmationModal.tsx`

---

## Detailed File Modifications

### 1. `android/app/src/main/AndroidManifest.xml`
- **Change**: Added `<uses-permission android:name="android.permission.VIBRATE" />` under the `<!-- Permissions -->` section alongside `android.permission.INTERNET`.
- **Rationale**: On physical Android devices running Capacitor with `@capacitor/haptics`, hardware vibration is blocked at the OS level without the explicit manifest permission. Adding this enables genuine tactile haptics across daily 1-tap YES executions, button clicks, and modal confirms.

### 2. `src/App.tsx`
- **Change 1 (16px Screen Padding)**: Updated `<main>` container horizontal padding from `px-3` (12px) to `px-4` (16px) on mobile viewports (`px-4 sm:px-6 lg:px-8`). Safe-area insets (`pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+5rem))] md:pb-12`) were strictly preserved.
- **Change 2 (Global Modal/Back Stack Awareness Mechanism)**:
  - Created `dismissActiveModalOrSheet()` supporting two layers of dismissal:
    1. **Programmatic Back Stack**: Checks `window.__REBUILD_BACK_STACK__` for registered dismissal handlers from open modals/drawers and executes the top handler.
    2. **DOM-Based Hierarchy Fallback**: Inspects the DOM for visible modal overlays (`.fixed.inset-0.z-50, [role="dialog"], [data-modal="true"]`), locates the top-most modal, and triggers its close/cancel button or backdrop.
  - Implemented `handleHardwareBack()`:
    - If `dismissActiveModalOrSheet()` returns true, dismissal is complete without altering navigation state.
    - If no modal/sheet is open, checks `activeTab`: if not on `'today'`, navigates back to `'today'`.
    - If already on `'today'`, calls `CapApp.exitApp()`.
  - Wired `handleHardwareBack` into Capacitor's native `CapApp.addListener('backButton')`.
  - Added desktop and accessibility keyboard fallback for the `Escape` key.
  - Attached handlers to `window.__REBUILD_DISMISS_MODAL__` and `window.__REBUILD_HARDWARE_BACK__` for E2E and unit testing.

### 3. `src/components/Navbar.tsx`
- **Change 1 (Top-Right Settings Header Touch Target)**:
  - Upgraded the mobile settings icon button from `w-10 h-10` (40px) to `min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl flex items-center justify-center`. Meets Apple HIG / Material 44-48dp standards with centered icon alignment.
- **Change 2 (Bottom Navigation Touch Targets)**:
  - Upgraded all 5 bottom bar navigation buttons (Today, Goals, Weekly, Stats, More) to guarantee `min-w-[44px] min-h-[48px]` with centered alignment (`flex flex-col items-center justify-center`).
- **Change 3 (More Sheet Drawer)**:
  - Upgraded drawer close button from `w-9 h-9` (36px) to `min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center`.
  - Added accessibility and back-stack attributes: `role="dialog"`, `aria-modal="true"`, and `data-modal="true"`.
  - Added `useEffect` registering an automatic dismissal handler to `window.__REBUILD_BACK_STACK__` when `isMoreSheetOpen` is true.
- **Change 4 (Screen Padding Alignment)**:
  - Updated header container from `px-3` to `px-4` (`px-4 sm:px-6 lg:px-8`) to maintain perfect vertical alignment with the main screen content grid.

### 4. `src/components/ConfirmationModal.tsx`
- **Change 1 (Touch Target Upgrades)**:
  - Upgraded header close button from `w-9 h-9` (36px) to `min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center`.
  - Upgraded Cancel and Confirm action buttons with `min-h-[48px] min-w-[48px] sm:min-w-[100px] flex items-center justify-center`.
- **Change 2 (Back Stack Registration)**:
  - Added `useEffect` registering `handleCancel` to `window.__REBUILD_BACK_STACK__` when `isOpen` is active.
  - Added `role="dialog"`, `aria-modal="true"`, and `data-modal="true"` to modal overlay container.

### 5. Base Input Typography
- Verified `src/index.css` contains universal rule:
  ```css
  input, select, textarea {
    font-size: 16px !important;
  }
  ```
  Guarantees mobile WebKit / Android WebView will not auto-zoom upon focusing text fields.

---

## Verification Results
| Check | Command | Result |
|---|---|---|
| Production Build | `npm run build` | PASS (Built in 1.32s, 0 errors, 57 modules) |
| Milestone 2 Verification | `node .agents/teamwork_preview_worker_m2/verify_m2.cjs` | PASS (All 6 checks passed) |
| Back Stack Behavior Sim | `node .agents/teamwork_preview_worker_m2/test_behavior.cjs` | PASS (All 4 scenarios passed) |
| Capacitor Android Sync | `node ./node_modules/@capacitor/cli/bin/capacitor sync android` | PASS (Copied web assets, synced 5 plugins) |
| TypeScript Source Files | `tsc --noEmit` on `src/` | PASS (0 errors in `src/`) |
