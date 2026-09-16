## 2026-09-11T06:49:11Z
You are the Milestone 2 Worker for the REBUILD project.
Your working directory is: d:\Thiyo\Rebuild\Rebuild-main\.agents\teamwork_preview_worker_m2
Authoritative requirements: d:\Thiyo\Rebuild\Rebuild-main\.agents\ORIGINAL_REQUEST.md
Project architecture: d:\Thiyo\Rebuild\Rebuild-main\PROJECT.md

MANDATORY: Read ORIGINAL_REQUEST.md and PROJECT.md first.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your exclusive write ownership:
- android/app/src/main/AndroidManifest.xml
- src/App.tsx
- src/components/Navbar.tsx
- src/components/ConfirmationModal.tsx

Your specific tasks (R10: Mobile-First Ergonomics & Capacitor Integration):
1. Android Vibration Permission:
   - In `android/app/src/main/AndroidManifest.xml`, add `<uses-permission android:name="android.permission.VIBRATE" />` so native haptics work on physical Android hardware.
2. Screen Padding & Ergonomics:
   - In `src/App.tsx`, update line 303 container from `px-3` (12px) to `px-4` (16px) for proper 16px screen padding as required by R10. Ensure safe-area insets (`pb-safe`, `pt-safe`, or padding utility) are preserved.
3. Modal-Aware Hardware Back Button:
   - In `src/App.tsx`, update the `App.addListener('backButton', ...)` listener. Currently it unconditionally sets activeTab to 'today' or calls `exitApp()`.
   - Provide a global modal/back stack awareness mechanism: if a modal, bottom sheet, or popover is open, pressing the hardware back button MUST dismiss the active modal/sheet first! If no modal is open, and activeTab !== 'today', navigate to 'today'. If already on 'today', call `App.exitApp()`.
4. Touch Target Sizes (44-48dp):
   - In `src/components/Navbar.tsx`, ensure the top-right Settings header button (`line 243`) and bottom navigation buttons have at least `min-w-[44px] min-h-[44px]` (or `w-11 h-11`) touch targets with centered alignment.
   - In `src/components/ConfirmationModal.tsx`, ensure action buttons and close buttons meet 44-48dp touch targets.
5. Base Input Typography:
   - Ensure input fields use `text-base` (16px) so mobile browsers do not auto-zoom upon focus.

Verification:
- Run `npm run lint` and `npm run build` to verify 0 errors.
- Document all changes in d:\Thiyo\Rebuild\Rebuild-main\.agents\teamwork_preview_worker_m2\changes.md.
- Deliver handoff.md in your working directory.
- Send message to parent upon completion.
