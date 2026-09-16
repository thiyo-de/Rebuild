## 2026-09-11T06:56:20Z
You are the Milestone 3 Worker for the REBUILD project.
Your working directory is: d:\Thiyo\Rebuild\Rebuild-main\.agents\teamwork_preview_worker_m3
Authoritative requirements: d:\Thiyo\Rebuild\Rebuild-main\.agents\ORIGINAL_REQUEST.md
Project architecture: d:\Thiyo\Rebuild\Rebuild-main\PROJECT.md

MANDATORY: Read ORIGINAL_REQUEST.md and PROJECT.md first.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your exclusive write ownership:
- src/components/Navbar.tsx
- src/App.tsx (only if needed for header/navigation synchronization)

Your specific tasks (R3: 7-Screen Mobile Architecture & 4+1 Navigation):
1. 4+1 Bottom Navigation (src/components/Navbar.tsx):
   - 4 main navigation buttons:
     1. Today (`ri-checkbox-line`, label "Today")
     2. Goals (`ri-focus-3-line`, label "Goals")
     3. Weekly (`ri-trophy-line`, label "Weekly")
     4. Analysis (`ri-bar-chart-2-line`, label "Analysis" — rename from "Stats")
   - 5th "More" trigger button:
     * Icon-only: use `ri-more-fill` or `ri-apps-2-line`. It must be ICON-ONLY with NO text label!
     * Positioned as the 5th item on the bottom navigation bar.
     * Clicking it opens a compact relative popover anchored directly above the nav bar (not a full-screen drawer).
     * The popover MUST contain ONLY links to:
       - Monthly Review (`ri-calendar-event-line`, label "Monthly Review")
       - 2027 Milestones (`ri-flag-line`, label "2027 Milestones")
     * Remove the "Settings & Data Backup" link from the popover (Settings is accessed exclusively via the header Settings icon).
     * Ensure clicking an item in the popover navigates to that tab and closes the popover.
     * Ensure clicking outside or pressing the hardware back button closes the popover.
2. Global Header Settings Icon:
   - Position a dedicated Settings button (`ri-settings-3-line`) in the top-right header corner across ALL screens on both mobile and desktop.
   - Clicking it switches the active screen to 'settings'.
3. Ergonomics & Aesthetics:
   - All interactive touch targets must be at least 44x44px.
   - Use universal Satoshi typography, 0 italics, locally bundled Remixicon icons.

Verification:
- Run `npm run lint` and `npm run build` to verify 0 errors.
- Document all changes in d:\Thiyo\Rebuild\Rebuild-main\.agents\teamwork_preview_worker_m3\changes.md.
- Deliver handoff.md in your working directory.
- Send message to parent upon completion.
