## 2026-09-11T07:14:06Z

You are the Milestone 5 Worker for the REBUILD project.
Your working directory is: d:\Thiyo\Rebuild\Rebuild-main\.agents\teamwork_preview_worker_m5
Authoritative requirements: d:\Thiyo\Rebuild\Rebuild-main\.agents\ORIGINAL_REQUEST.md
Project architecture: d:\Thiyo\Rebuild\Rebuild-main\PROJECT.md
Neuroscience authoritative specifications: d:\Thiyo\Rebuild\NEUROSCIENCE_SYSTEM.md

MANDATORY: Read ORIGINAL_REQUEST.md, PROJECT.md, and NEUROSCIENCE_SYSTEM.md first.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your exclusive write ownership:
- src/components/AnalysisView.tsx
- src/data/neuroscienceData.ts

Your specific tasks (R6 & R7: Visual Analysis Dashboard & Neuroscience Metacognitive Mirror):
1. Ingest Neuroscience System (src/data/neuroscienceData.ts):
   - Read `d:\Thiyo\Rebuild\NEUROSCIENCE_SYSTEM.md`.
   - Export typed data structures for:
     * Huberman's 4 Execution Laws:
       1. The Rhythm (Circadian timing, light exposure, temperature minimum)
       2. The Off Switch (Physiological sigh, down-regulation, NSDR)
       3. The Arc (90-minute ultradian focus blocks, dopamine reward prediction error)
       4. The Fighter (Limbic friction, anterior mid-cingulate cortex engagement)
     * The Metacognitive Mirror mapping: mapping all 15 Failure Reasons to Biological Root Cause, Actionable Neuro-Protocol, and Associated Law.
     * Enforce strict "Pattern observed: [reason]" non-clinical phrasing.

2. Visual Analysis Dashboard (src/components/AnalysisView.tsx):
   - Time Range Selector: Last 30 days, Last 90 days, All time (ensure touch targets >= 44x44px).
   - Stat Cards: Streak, Perfect Days, Total Days Logged (calculate correctly from storage/records).
   - SVG Donut Chart:
     * Overall completion rate donut chart with clean SVG circle arc, center percentage text, and status colors (>=90% emerald, 70-89% amber, <70% rose).
   - Pareto Failure Reasons Breakdown Chart:
     * Bar chart of failure reasons sorted from most frequent to least frequent.
     * Cumulative percentage curve or markers + legend identifying categories and percentages.
   - Horizontal Goal Rankings Bar Chart:
     * Horizontal bars representing goal completion consistency ranking.
   - Category Breakdown Matrix:
     * Table or cards breaking down performance across categories (Fitness, Deep Work, Mindset, etc.).
   - Metacognitive Mirror Component:
     * Reads the logged failure reasons in the selected time range and identifies the top 1-3 dominant failure reasons.
     * Renders card(s) displaying:
       - "Pattern observed: [dominant reason]"
       - "Biological Root Cause: [biological explanation]"
       - "Actionable Protocol: [protocol]"
       - Associated Huberman Law tag.
     * If 0 failure reasons logged in the window, display positive executive control confirmation: "Pattern observed: Zero friction logged in this period. Baseline dopamine and prefrontal regulation sustained."
   - Huberman Execution Laws Card:
     * Collapsible or structured quick-reference card displaying the 4 Execution Laws with exact copy and actionable takeaways from `NEUROSCIENCE_SYSTEM.md`.

3. Ergonomics & Typography:
   - 44-48dp touch targets on all interactive elements (time range buttons, accordion triggers).
   - Universal Satoshi typography, 0 occurrences of italics.
   - Bundled Remixicon icons with self-closing `<i className="ri-..." />` tags.

Verification:
- Run `npm run lint` and `npm run build` to verify 0 errors.
- Run `node --import tsx --test --test-reporter=spec "tests/**/*.test.ts"` to ensure all 188 E2E tests pass.
- Document all changes in d:\Thiyo\Rebuild\Rebuild-main\.agents\teamwork_preview_worker_m5\changes.md.
- Deliver handoff.md in your working directory.
- Send message to parent upon completion.
