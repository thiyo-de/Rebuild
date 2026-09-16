## 2026-09-11T07:05:03Z
You are the Milestone 4 Worker for the REBUILD project.
Your working directory is: d:\Thiyo\Rebuild\Rebuild-main\.agents\teamwork_preview_worker_m4
Authoritative requirements: d:\Thiyo\Rebuild\Rebuild-main\.agents\ORIGINAL_REQUEST.md
Project architecture: d:\Thiyo\Rebuild\Rebuild-main\PROJECT.md

MANDATORY: Read ORIGINAL_REQUEST.md and PROJECT.md first.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your exclusive write ownership:
- src/components/TodayView.tsx
- src/components/GoalsView.tsx
- src/data/starterData.ts

Your specific tasks:
1. R4: Core Daily Execution Loop (src/components/TodayView.tsx):
   - Daily tracking budget: indicate 30 seconds to 2 minutes tracking budget.
   - Dynamic greeting based on device time (e.g., "Good morning", "Good afternoon", "Good evening") + subtitle: "Build today. Don't fix your whole life today."
   - Large animated circular progress ring (0-100% SVG circular ring):
     * Status colors: Green (>=90%), Yellow (70-89%), Red (<70%).
     * Prominently display completed vs active targets (e.g., "3 / 4 targets completed" and score percentage).
     * Replaces the square container/linear bar as the primary hero visualization.
   - 1-tap YES with tactile haptics; NO opens the 15-reason failure bottom sheet with slide-up animation and drag handle.
   - Recovery Mode banner: automatically appears when 2+ consecutive sub-70% days are recorded. Display exact text: "Do not recover the lost days. Recover today." and "Rule: Never miss twice."
   - Register the failure bottom sheet with `window.__REBUILD_BACK_STACK__` so the hardware back button dismisses it cleanly.

2. R5: Goals Management & Starter Blueprints (src/components/GoalsView.tsx & src/data/starterData.ts):
   - Full CRUD: Create, Edit, Pause, Resume, Archive, Delete.
   - Ensure paused goals are completely excluded from daily scoring and hidden from Today.
   - Goal Archiving UI:
     * Support `archived?: boolean` on goals.
     * Add Archive / Unarchive action button for each goal.
     * Add an "Active" vs "Archived" filter or tab in GoalsView so users can view and manage archived goals.
     * Archived goals are hidden from Today and excluded from daily scoring.
   - 4 Pre-configured editable Starter Blueprints in `starterData.ts`:
     1. SSC CGL Exam Prep (Quantitative Aptitude, General Awareness, English Comprehension, Reasoning)
     2. English Fluency (Daily Speaking Practice, Vocabulary Building, Reading Aloud, Listening Analysis)
     3. Fitness / Recomposition (Strength Training, Protein Intake Target, Daily Steps / Cardio, Sleep Hygiene)
     4. Self-Control (Screen Time Limit, Dopamine Fast / No Cheap Dopamine, Meditation / Mind Reset, Evening Reflection)
   - In `GoalsView.tsx`, provide a 1-click Starter Blueprints modal/section to load and add any of these 4 blueprints into the user's goals list.
   - Register all open modals in `GoalsView.tsx` with `window.__REBUILD_BACK_STACK__` for Android hardware back button dismissal.

3. Ergonomics & Aesthetics:
   - Touch targets >= 44x44px.
   - Universal Satoshi typography, 0 occurrences of italics.
   - Bundled Remixicon icons.

Verification:
- Run `npm run lint` and `npm run build` to ensure 0 errors.
- Run `node --import tsx --test --test-reporter=spec "tests/**/*.test.ts"` to ensure all 188 E2E tests pass.
- Document all changes in d:\Thiyo\Rebuild\Rebuild-main\.agents\teamwork_preview_worker_m4\changes.md.
- Deliver handoff.md in your working directory.
- Send message to parent upon completion.
