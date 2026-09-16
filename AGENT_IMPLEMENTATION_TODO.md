# REBUILD — Detailed implementation TODO and agent handoff

Created: 2026-09-12  
Application root: `D:\Thiyo\Rebuild\Rebuild-main`  
Scope of this document: plan and tracker only; application implementation has not been authorized by the act of creating this file. A future agent must follow the user's implementation request and selected scope.  
Starting point: the current September 12 source audit, not the older operating brief or earlier checkout.

## 1. Read this before starting

The user recently changed this application substantially. Inspect the actual source before implementing any task. The user explicitly said not to blindly follow older documents.

This file is the single working TODO and completion tracker. Update its task status and evidence after each selected task; do not create a competing completion list. File references below are starting points, not limits on investigation. Line numbers from earlier audits may have moved.

### Current implementation to preserve

- React 19, TypeScript, Vite 6, Tailwind CSS 4, and Capacitor 7.
- Eight views: Today, Goals, Weekly, Monthly, Milestones, Analysis, Theoretical Foundation, and Settings.
- Four mobile bottom tabs: Today, Goals, Weekly, Analysis. More and Settings are in the top header. More includes Monthly, Analysis, Theory, and Milestones.
- `src/context/AppContext.tsx` owns data and mutations. `src/App.tsx` owns navigation and selected date. All views currently stay mounted and are hidden with CSS when inactive.
- `src/components/GoalModal.tsx` is shared by Today and Goals.
- Baseline-protector flags, a three-minute recovery timer, completion-reset undo, and configurable day rollover exist.
- Storage uses localStorage with partial writes and a version field. It has NOT yet been migrated to native Preferences or SQLite.
- Notification syncing compares pending notification IDs. It does NOT yet correctly replace a changed reminder with the same ID.
- Satoshi and Remixicon assets are bundled locally. Do not switch to CDN-only assets to satisfy an older document.
- Capacitor uses `webDir: 'dist'`, with no remote application server URL. Android exists; an iOS project is not present.

### Behavioral rules to retain

1. Offline operation, no login, no backend, no Google account or cloud-sync integration.
2. YES earns completion credit; NO does not. Failure reasons are analysis-only and must not change scoring.
3. Keep equal goal weighting unless the user explicitly changes the product rule. A `weight` field in the schema is not authorization to introduce weighted scoring.
4. Weekly/monthly averages currently include only recorded days. Do not silently count all unlogged days as failures.
5. Default reward threshold is 90%; minimum recorded days are three weekly and ten monthly. Do not silently add a period-end requirement.
6. Rewards are intended to be configured before their period starts. Fix enforcement without silently changing claim eligibility.
7. Milestone achievement requires manual confirmation; a high daily score must not automatically unlock a milestone.
8. Keep the recovery message: "Do not recover the lost days. Recover today."
9. Keep locally bundled fonts/icons, current navigation, Theory, and recent shared-component work unless the user approves a change.
10. Preserve real user records during every migration, import, reset correction, and history refactor. Do not generate fake historical completions.
11. Do not add a special health exemption to scoring from an older REBUILD checkout. That is not the current reason-neutral scoring rule.
12. Keep daily YES/NO logging fast. Reliability work must not add mandatory steps to ordinary completion tracking.

### Execution discipline

- Confirm the actual application root and applicable `AGENTS.md` instructions each time you resume.
- Re-read the selected task's source. The code may have changed since this audit.
- Work one selected task at a time. Do not use this document as permission for a full redesign or unrelated cleanup.
- If the issue has already been fixed, verify its acceptance criteria and record evidence rather than applying the old proposed patch.
- Before a substantial correction, report the current problem, proposed approach, data impact, and verification plan.
- Avoid asking again for authorization already present in the user's request. Unresolved product decisions should block only work that actually depends on them.
- Do not reset live data, uninstall the user's app, regenerate signing keys, publish, upload backups, or rotate credentials as an incidental test action.
- Use isolated synthetic data for destructive and corruption tests. Never put user backup contents, signing passwords, or other secrets into this tracker.
- Do not delete or weaken tests to obtain a green result. Replace stale source-string assertions with tests of the intended behavior where appropriate.
- Do not claim browser/device acceptance from Node tests, server rendering, successful bundling, an existing APK, or old report files.
- Prefer one small, reviewable implementation and its tests over a broad rewrite.

## 2. Audit baseline and verification boundaries

These are results from the September 12 analysis, not guarantees about future source revisions:

| Check | Observed result |
|---|---|
| `npm test` | 195 passed, 25 suites, zero failures |
| `npm run lint` | One TS2304 error: `DayRecord` not imported in AnalysisView |
| Basic server rendering | All eight view components rendered with clean-state props |
| In-memory Vite production bundle | Passed, without writing build outputs; the audit runner supplied the config directory for `__dirname` |
| `dist` versus Android bundled public assets | All 26 files in `dist` matched their Android copies |
| Browser visual/interaction tests | Not run: no browser was available |
| Android build/install/device tests | Not run during that analysis |
| Native backup-file round trip | Not verified |
| Git metadata | No Git repository was found in the application folder during the earlier inspection; recheck before assuming Git workflows |

The old Monthly `monthInfo.weeks.map()` crash and the earlier seven TypeScript errors were already addressed by recent changes. Do not reopen them as unchanged bugs. Monthly still has separate title/boundary issues described below.

### Reproduced behaviors that remain useful regression cases

- A future-start weekday goal was included in Saturday scoring.
- A past daily score changed from 100% to 0% after pausing its only completed goal.
- Three perfect logged days and four unlogged days yielded a 100% weekly average. This matches the current documented policy; it is not automatically a bug.
- The schedule builder produced 15 notifications with the master switch disabled.
- Changing a goal reminder from 10 AM to 11 AM, with a name change, produced no cancel/schedule calls in the real sync implementation using a mocked native adapter.
- A goal beginning September 12 was considered unscheduled at 1 AM September 12 in Asia/Kolkata because a UTC date string was used.
- Ten daily reminder goals produced 78 queued items over seven days, relevant to any future iOS implementation.
- Saving an empty milestone list and reloading restored two predefined milestones.
- Injecting a quota failure while importing left new goals mixed with old daily logs.
- Low-score records on September 9 and 11 triggered recovery on September 12 despite the unlogged September 10 gap.
- Monthly server rendering produced a duplicated year in its heading.

## 3. Status and evidence rules

Statuses: `TODO`, `IN_PROGRESS`, `BLOCKED`, `IMPLEMENTED_PENDING_VERIFICATION`, `DONE`, `DEFERRED`.

- `DONE` means that task's listed acceptance checks passed. If it requires device testing, automated success alone is insufficient.
- `BLOCKED` needs a specific dependency, decision, environment requirement, or failed check; do not write only "needs testing."
- `DEFERRED` needs a recorded user decision or explicit scope reason.
- Priority: P0 = data-loss/release-gate work; P1 = core correctness; P2 = usability/maintenance. Optional suggestions use OPT.
- Task IDs are stable. Add follow-up IDs rather than renumbering completed work.
- Dependencies mean prerequisite contracts/results, not permission to edit every dependent file at once.

| ID | Task | Priority | Dependencies | Status | Evidence / blocker |
|---|---|---|---|---|---|
| RB-00 | Refresh baseline and source map | P0 | None | TODO | — |
| RB-01 | Fix current TypeScript error | P0 | RB-00 | DONE | DayRecord imported in AnalysisView.tsx; tsc --noEmit passes cleanly |
| RB-02 | Establish real interaction test support | P1 | RB-00 | TODO | — |
| RB-03 | Record unresolved product contracts | P1 | RB-00 | TODO | — |
| RB-04 | Validate and version backup/state schemas | P0 | RB-03 | TODO | — |
| RB-05 | Make persistence commits explicit and state updates pure | P0 | RB-04 | TODO | — |
| RB-06 | Migrate native persistence without losing existing data | P0 | RB-05 | TODO | — |
| RB-07 | Make backup import atomic and recoverable | P0 | RB-04, RB-05, RB-06 | TODO | — |
| RB-08 | Export a real portable JSON backup file | P1 | RB-04, RB-06 | TODO | — |
| RB-09 | Preserve empty data and make reset safe | P0 | RB-05, RB-07, RB-08 | DONE | loadStoredState distinguishes [] from uninitialized; verified via test F01.8 |
| RB-10 | Centralize local tracking dates and rollover | P1 | RB-03 | TODO | — |
| RB-11 | Use one goal scheduling rule across the app | P1 | RB-10 | TODO | — |
| RB-12 | Preserve historical goal/scoring meaning | P1 | RB-03, RB-04, RB-05, RB-06, RB-11 | TODO | — |
| RB-13 | Preserve paused state and fields when editing goals | P1 | RB-02 | DONE | GoalModal spreads editingGoal and preserves active: false; verified via tests |
| RB-14 | Make undo restore the original record/date | P1 | RB-02, RB-10 | TODO | — |
| RB-15 | Refresh settings drafts after import/reset | P1 | RB-02, RB-07, RB-09 | TODO | — |
| RB-16 | Honour the notification master switch | P1 | RB-00 | DONE | buildRollingNotificationSchedule returns [] when notificationsEnabled: false; verified via F16.7 |
| RB-17 | Replace edited reminders and serialize queue updates | P1 | RB-11, RB-16 | DONE | Fingerprinted notifId with reminder time/content; serialized sync queue; verified via F16.8 |
| RB-18 | Refresh and bound native reminder schedules | P1 | RB-10, RB-17 | TODO | — |
| RB-19 | Enforce reward configuration timing | P1 | RB-03, RB-10, RB-12 | TODO | — |
| RB-20 | Correct reward spend and claim edge cases | P1 | RB-02, RB-19 | TODO | — |
| RB-21 | Make recovery detection match the selected rule | P1 | RB-03, RB-10, RB-11, RB-12 | TODO | — |
| RB-22 | Unify overlays, focus, and back dismissal | P1 | RB-02 | TODO | — |
| RB-23 | Correct analytics category and date scope | P1 | RB-10, RB-11, RB-12 | TODO | — |
| RB-24 | Correct Monthly labels and boundary breakdown | P2 | RB-03, RB-10, RB-11 | TODO | — |
| RB-25 | Replace unsupported diagnostic UI claims | P2 | RB-00 | TODO | — |
| RB-26 | Protect release signing configuration | P0 | RB-00 | DONE | keystore.properties + example created, .gitignore updated, build.gradle reads from props; verified via gradlew |
| RB-27 | Verify integrated regression scenarios | P1 | RB-01 through RB-26 | TODO | — |
| RB-28 | Verify packaged Android behavior | P1 | RB-27 | TODO | — |
| RB-29 | Reconcile current documentation and handoff | P2 | RB-27; record RB-28 status | TODO | — |
| OPT-01 | Add separate logging-coverage information | OPT | Explicit selection; RB-12, RB-23 | TODO | Not selected |
| OPT-02 | Finish shared visual tokens/components | OPT | Explicit selection; RB-22 | TODO | Not selected |
| OPT-03 | Complete accessibility and mobile visual pass | OPT | Explicit selection; RB-22 | TODO | Not selected |
| OPT-04 | Measure startup and reduce unnecessary work/assets | OPT | Explicit selection; RB-27 | TODO | Not selected |
| OPT-05 | Prepare iOS as a separate delivery scope | OPT | Explicit selection; RB-28 | TODO | Not selected |

Suggested execution: complete RB-00/RB-01 first. Use RB-03 to settle only needed contracts, then protect persistence before the history migration. RB-13, RB-16, and RB-26 are bounded corrections that can be selected without waiting for the entire persistence sequence. Finish integrated and device acceptance after functional changes. Optional tasks are not part of the automatic reliability pass.

## 4. Detailed reliability tasks

### RB-00 — Refresh baseline and source map

**Files:** `package.json`, `src/`, `tests/`, `capacitor.config.ts`, `android/`, current instruction files.

- [ ] Confirm checkout, current instructions, package manager/lockfiles, and existing user changes. Do not install packages just to inspect the project.
- [ ] Re-run type checking and tests; record actual counts/errors. Read failed tests before classifying them.
- [ ] Record current screen/navigation structure and storage mechanism. Check which previous findings still exist.
- [ ] If Git exists now, record status and revision without changing branches or discarding edits. Otherwise record "no Git metadata" and use another scoped change inventory.

**Acceptance:** a dated baseline with exact commands/results and current source references; no stale issue treated as current without inspection.

### RB-01 — Fix the current TypeScript error

**Files:** `src/components/AnalysisView.tsx`, `src/types.ts`.

- [ ] Import the existing `DayRecord` type correctly; do not replace it with `any` or disable type checking.
- [ ] Check for newly introduced errors and resolve only those within the selected correction's scope.

**Acceptance:** `npm run lint` exits successfully; no behavior change to analytics; relevant existing tests still pass. This is a type-check failure, not evidence that the Analysis screen necessarily crashes at runtime.

### RB-02 — Establish tests of actual component interactions

**Files:** `package.json`, `tests/`, existing test configuration and helpers.

- [ ] Inspect the current Node/tsx runner and unused/stale Vitest configuration before selecting test tooling.
- [ ] Add the smallest practical component/browser testing setup needed for real forms, state transitions, and navigation. Use maintained tooling compatible with installed React; document any added dependency.
- [ ] Test actual exported modules and UI handlers through their public behavior. Do not write a second implementation in tests and validate only that copy.
- [ ] Keep native plugin adapters mockable and keep synthetic storage separate from real app data.

**Acceptance:** a meaningful interaction test and a native-adapter test run through documented commands; failures are reported by a nonzero exit status; no package-manager churn unrelated to the task.

### RB-03 — Record unresolved product contracts

**Files:** this document, `src/types.ts`, parent `APP.md`, relevant source services.

Write agreed rules in the decision log in section 5 before implementing dependent behavior.

- [ ] Resolve treatment of future execution records. Recommendation: prohibit new future completions; preserve imported legacy records without silently counting them in current progress.
- [ ] Resolve recovery continuity: adjacent calendar/tracking days or successive recorded days. Do not silently choose one based only on the word "consecutive."
- [ ] Resolve monthly sub-week presentation: month-only slices or full calendar weeks with adjacent dates clearly labelled.
- [ ] Record the effective date for schedule edits/pause/resume and the legacy-history migration strategy. Recommend prospective changes with honest legacy provenance.
- [ ] Define treatment of existing rewards configured after period start. Do not retrospectively erase claimed rewards.
- [ ] Confirm minimum-day reward unlocking remains permitted before period end unless the user changes that policy.

**Acceptance:** each needed decision has its outcome, date, and rationale; unresolved choices are identified; unrelated corrections may proceed.

### RB-04 — Validate and version state/backup schemas

**Files:** `src/types.ts`, `src/services/storage.ts`, `src/components/SettingsView.tsx`, `src/context/AppContext.tsx`.

- [ ] Define a versioned backup envelope including every entity type and settings. Keep storage and export versions explicit.
- [ ] Validate entity arrays, required fields, IDs, dates, frequencies/custom days, reminder times, booleans, finite numeric values, and settings ranges before use.
- [ ] Define duplicate goal/log/reward handling and referential checks. Account for intentionally retained history after goal retirement.
- [ ] Support known legacy backups through explicit migrations; reject unsupported newer versions without overwriting current data.
- [ ] Treat an intentionally empty collection as valid. Do not replace it with starter data.
- [ ] Preserve supported optional fields during normalization; report invalid data clearly without exposing full backup contents in logs.

**Acceptance:** current complete backup validates; malformed objects, primitive settings, duplicate records, invalid dates/times, and unsupported versions are rejected or migrated according to explicit tests. Validation performs no writes.

### RB-05 — Make persistence commits explicit and state updates pure

**Files:** `src/context/AppContext.tsx`, `src/services/storage.ts`, related storage adapters.

- [ ] Remove storage writes from functional React state updaters. Keep state calculations pure and storage commits controlled.
- [ ] Establish a repository/adapter boundary that can support asynchronous native persistence without making components storage-aware.
- [ ] Serialize writes and define what happens when saving fails. The UI must not announce success while durable state remains stale.
- [ ] Ensure newer changes cannot be overwritten by completion of an older asynchronous save.
- [ ] Keep initial hydration, normal mutations, import, and reset consistent; avoid saving empty pre-hydration state over real records.

**Acceptance:** rapid consecutive edits retain all intended changes; a failed write is visible and recoverable; Strict Mode does not produce duplicate logical commits; hydration cannot erase persisted data. Run failure-injection and ordering tests.

### RB-06 — Migrate native persistence safely

**Files:** storage adapter, `src/services/storage.ts`, `src/context/AppContext.tsx`, `package.json`, native plugin configuration.

- [ ] Choose the smallest suitable native store: Preferences for lightweight state, or SQLite where history size/querying/transaction needs justify it. Record the tradeoff before implementation.
- [ ] Preserve a browser adapter for web development. Do not add cloud infrastructure.
- [ ] Read and validate existing localStorage data, write the new store, read back and verify it, and only then record migration success.
- [ ] Retain the legacy copy until the new copy is verified. Make interrupted migration resumable and idempotent.
- [ ] Prevent later launches from repeatedly importing stale legacy data over newer native records.
- [ ] Ensure async loading has clear loading/error states and no premature default-state writes.

**Acceptance:** synthetic current/legacy installations migrate without entity loss; interruption at each stage is recoverable; repeated launch does not duplicate or overwrite data. Native close/reopen and update preservation must be recorded separately under RB-28.

### RB-07 — Make backup import atomic and recoverable

**Files:** `src/components/SettingsView.tsx`, `src/context/AppContext.tsx`, storage repository and schema validation.

- [ ] Parse, validate, and migrate in memory before committing any imported entity.
- [ ] Present a concise import summary and replacement confirmation for real user data; distinguish replacement from any explicitly supported merge mode.
- [ ] Commit all entities/settings together, or use a recoverable staging/version-pointer design. Sequential unprotected writes are insufficient.
- [ ] Retain the previous valid state if validation, persistence, or activation fails. Use an actual storage transaction where supported.
- [ ] Clear obsolete UI drafts and resync dependent services only after successful activation.
- [ ] Produce accurate success/failure messages; a quota/write error is not a JSON syntax error.

**Acceptance:** complete all-entity round trip; invalid input leaves current data unchanged; injected failure after every commit stage never exposes mixed old/new state; reload after interruption recovers a complete state.

### RB-08 — Export a real portable JSON backup file

**Files:** `src/services/native.ts`, `src/components/SettingsView.tsx`, schema/storage export code, native file-sharing configuration.

- [ ] Export the validated/versioned complete snapshot rather than a partial form state.
- [ ] On native platforms, create an actual UTF-8 `.json` file and share its URI through the platform share mechanism. Verify Capacitor-version-specific API behavior.
- [ ] Preserve a working browser download path and clean up temporary resources appropriately.
- [ ] Handle share cancellation separately from export failure; avoid launching an unexpected download after ordinary cancellation.
- [ ] Include goals, logs, both reward types, milestones, settings, and any history/version records added by RB-12.

**Acceptance:** file name/content are correct; Unicode and empty collections survive export/import; Android share yields an importable file. Do not mark the native-file portion DONE from a mocked share call alone.

### RB-09 — Preserve empty data and make reset safe

**Files:** `src/services/storage.ts`, `src/components/ErrorBoundary.tsx`, `src/components/SettingsView.tsx`, repository reset flow.

- [ ] Distinguish missing/corrupt milestones from the valid saved value `[]`. Apply the same principle to user-editable collections.
- [ ] Require explicit in-app destructive confirmation before resetting user records, including the error-recovery screen.
- [ ] Offer a usable backup/recovery path where possible before destruction; keep non-destructive reload available.
- [ ] Remove whole-origin `localStorage.clear()` fallback. Reset only the selected app-owned data through the repository.
- [ ] Reset atomically; refresh mounted UI state; cancel/reconcile stale notifications.

**Acceptance:** deleting all milestones survives reload; cancelling reset changes nothing; confirmed synthetic reset affects only REBUILD data; reset failure retains a recoverable state. Test without resetting the user's real installation.

### RB-10 — Centralize local tracking dates and rollover

**Files:** `src/utils/dateUtils.ts`, `src/App.tsx`, Today/Goals/GoalModal/Analysis/Theory/Milestones, notification date handling.

- [ ] Define shared local-calendar and effective-tracking-date helpers; avoid `toISOString().split('T')[0]` for local date decisions.
- [ ] Separate the live tracking day from a deliberately selected historical review date.
- [ ] Refresh at the configured rollover boundary and when the app returns to foreground. Preserve deliberate history navigation according to a clear rule.
- [ ] Apply consistent date semantics to goal creation, completions, analytics, milestones, and notification payloads. Reminder wall-clock time and a tracking-day label may differ intentionally; document that distinction.
- [ ] Implement the future-record policy agreed in RB-03 without silently deleting existing imports.

**Acceptance:** tests around midnight, configured rollover, month/year changes, Asia/Kolkata 1 AM, and a DST timezone; foreground refresh updates live Today; historical browsing does not unexpectedly jump dates.

### RB-11 — Use one goal scheduling rule everywhere

**Files:** `src/services/storage.ts`, `src/services/notifications.ts`, date/schedule helpers, `TodayView.tsx`, goal models.

- [ ] Extract a domain scheduling rule from notification-specific code and use it for Today, daily/period scores, recovery, and reminder generation.
- [ ] Respect start/end bounds, Daily, Weekly, Mon-Fri, Weekends, and valid Custom days.
- [ ] Keep paused/archived goals excluded from current execution while allowing RB-12 to resolve their historical applicability.
- [ ] Avoid implementing several subtly different active/scheduled filters across views.
- [ ] Define zero-scheduled-goal handling without dividing by zero or making an idle day a perfect achievement.

**Acceptance:** a future goal is absent before its start; weekdays/weekends/custom/weekly recurrence match across UI and reminders; schedule boundaries and no-goal days are tested using the actual helper.

### RB-12 — Preserve historical goal and scoring meaning

**Files:** `src/types.ts`, storage schema/migrations, AppContext mutations, goal editing, all score consumers.

- [ ] Implement the agreed dated-goal-version or daily-snapshot model. Store enough information to preserve goal identity, target, category, schedule applicability, and scoring denominator.
- [ ] Apply new edits/pause/resume/retirement prospectively according to RB-03; keep prior completed and missed records meaningful.
- [ ] Ensure deleting a current goal does not erase or relabel historical achievements. Define archival/retirement separately from explicitly authorized historical erasure.
- [ ] Carry the new records through export/import/migration.
- [ ] Treat legacy history honestly: missing past schedules/targets cannot be reconstructed with certainty. Preserve available records and label any derived baseline rather than inventing events.
- [ ] Continue reason-neutral, equal-weight scoring and the approved logged-day averaging policy.

**Acceptance:** adding, editing, pausing, archiving, resuming, and retiring a goal do not rewrite finalized prior scores; current/future schedules reflect changes; legacy migration and complete backup round trips retain history.

### RB-13 — Preserve paused state and fields during goal editing

**Files:** `src/components/GoalModal.tsx`, `src/components/GoalsView.tsx`, related goal mutation code.

- [ ] Do not set every non-archived edited goal to active. Preserve a paused goal's status unless resume is explicitly requested.
- [ ] Preserve supported fields not edited by this form, including `endDate`, `customDays`, and `weight`.
- [ ] Validate the selected frequency against its required data; do not erase imported custom schedules simply because the form has no editor for them.
- [ ] Keep create, ordinary edit, pause/resume, archive/unarchive as distinct intents. Coordinate with RB-12 when its new history contract lands.

**Acceptance:** edit the title of a paused goal: it remains paused and absent from current Today/reminders. Editing one visible field retains other supported fields. Test both Today and Goals entry points with the shared modal.

### RB-14 — Make undo restore the original record and date

**Files:** `src/components/TodayView.tsx`, AppContext execution mutation interface if needed.

- [ ] Capture the original tracking date and exact prior record when creating an undo action.
- [ ] Restore that record on Undo, regardless of the currently selected date or tab.
- [ ] Replace "Marked as missed" with accurate copy when clearing a completion; clearing is not a NO record.
- [ ] Cancel previous toast timers before replacing them and clean up timers on disposal/import/reset.
- [ ] Prevent a stale undo from restoring a record into an unrelated imported/reset data set.

**Acceptance:** clear yesterday, navigate to today, Undo restores only yesterday; rapid resets do not let an old timer dismiss the newest toast; expiry/dismissal leaves the cleared record cleared; metadata is preserved.

### RB-15 — Refresh settings drafts after import/reset

**Files:** `src/components/SettingsView.tsx`, AppContext import/reset flow, App view lifecycle.

- [ ] Define an explicit draft lifecycle or controlled settings form. Do not leave a permanently mounted form with stale initial props.
- [ ] On successful import/reset, replace obsolete thresholds, currency, categories, reasons, rollover, and reminder controls.
- [ ] Preserve ordinary unsaved typing during unrelated rerenders; do not add a broad effect that resets the draft on every state change.
- [ ] Make auto-saving controls and the general Save button consistent so stale drafts cannot undo a newer persisted change.

**Acceptance:** import settings, inspect fields, save: imported values remain; reset then save does not resurrect old values; unrelated goal logging does not erase an in-progress settings draft.

### RB-16 — Honour the notification master switch

**Files:** `src/services/notifications.ts`, Settings notification controls.

- [ ] Return an empty desired schedule when notifications are disabled.
- [ ] Reconcile pending app-owned reminders so disabling cancels per-goal, evening, and weekly notifications.
- [ ] Re-enabling rebuilds only eligible future reminders and respects individual switches.
- [ ] Show actual permission status; browser preview must not suggest that native delivery has been verified.

**Acceptance:** disabled builder returns zero; mocked native queue is emptied; repeated disable is harmless; re-enable produces no duplicates. Verify delivery/cancellation on device under RB-28.

### RB-17 — Replace edited reminders and serialize queue updates

**Files:** `src/services/notifications.ts`, native adapter test helpers.

- [ ] Compare desired content/time with pending reminders or use a persisted fingerprint where the native pending API lacks enough fields.
- [ ] Replace reminders when name, target, reminder time, schedule, or relevant metadata changes even if the ID remains the same.
- [ ] Cancel reminders for paused, archived, deleted, expired, or out-of-window goals.
- [ ] Serialize/coalesce sync requests; rapid goal edits must not let an older queue overwrite a newer desired schedule.
- [ ] Retain deterministic bounded IDs and check collision handling for supported scale.

**Acceptance:** 10 AM → 11 AM replaces the pending alarm; name/target edits update content; rapid A→B→C changes finish at C; unchanged desired state causes no unnecessary replacement. Exercise the real sync implementation behind a mock adapter.

### RB-18 — Refresh and bound native reminder schedules

**Files:** `src/App.tsx`, notification service, Capacitor App listeners, Android permissions/configuration.

- [ ] Refill the rolling window on cold start and foreground/resume, and on relevant data changes; dispose listeners correctly.
- [ ] Check notification permission and Android exact-alarm availability as required by the installed Capacitor version. Handle denial without claiming delivery success.
- [ ] Apply a platform-aware pending-queue budget; prioritize imminent reminders instead of exceeding a platform limit. No new iOS app is implied by this task.
- [ ] Define the limitation when the app is not opened beyond the rolling window. Do not promise indefinite scheduling from seven days of one-shot alarms.
- [ ] Recover from sync errors with meaningful state/feedback; avoid overlapping sync runs.

**Acceptance:** simulated foreground extends the window; denied permissions and native errors are covered; ten-goal schedules obey the selected platform budget; real Android permission and lifecycle behavior is recorded under RB-28.

### RB-19 — Enforce reward configuration timing

**Files:** WeeklyRewardsView, MonthlyView, AppContext reward mutations, period helpers.

- [ ] Implement one explicit configuration-eligibility rule based on the actual tracking date and period start, not the date the user happens to be reviewing.
- [ ] Enforce it in both mutations and UI. A stored `isConfigLocked` flag alone is not enforcement.
- [ ] Lock the agreed reward fields and threshold for the period; global settings changes must not silently rewrite locked historical terms.
- [ ] Preserve existing claimed/legacy rewards according to RB-03. Do not fabricate an earlier configuration timestamp.
- [ ] Keep the current score/minimum-logged-day claim rule unless the user approves a different rule.

**Acceptance:** future rewards can be configured; locked-period edits are rejected at the mutation boundary; claimed records survive migration; browsing older/future periods cannot bypass the lock.

### RB-20 — Correct reward spend and claim edge cases

**Files:** WeeklyRewardsView, MonthlyView, AppContext claim handlers, reward types.

- [ ] Preserve valid zero actual spend. Use explicit blank/invalid handling rather than `Number(value) || budget`.
- [ ] Reject non-finite/negative amounts according to the selected budget rules; avoid inconsistent fallback values.
- [ ] Require an existing eligible reward before showing a working claim action or mutating it. The Weekly view currently can show a claim action with no configured reward.
- [ ] Make repeated claim attempts idempotent and retain timestamps/amounts consistently.
- [ ] Clarify monthly actual-spend behavior: do not silently invent spending if the UI does not collect it.

**Acceptance:** zero remains zero; invalid values do not persist; no configured reward cannot be claimed; repeated claim does not duplicate spending; displayed and stored amounts agree.

### RB-21 — Make recovery detection match the agreed rule

**Files:** `src/services/storage.ts`, Today recovery UI, date/schedule helpers.

- [ ] Implement the continuity policy from RB-03, including gaps, idle days, pauses, and the effective tracking date.
- [ ] Do not classify an unfinished current day as a finalized failure before its agreed boundary.
- [ ] Keep the recovery prompt supportive and preserve the fixed phrase.
- [ ] Treat the three-minute timer as a start aid, not automatic completion of the full goal target.

**Acceptance:** boundary tests for 69/70%, one versus two low days, logged gaps, zero-scheduled days, rollover, and a successful day breaking the sequence. Timer completion never awards a goal automatically.

### RB-22 — Unify overlays, focus, and back dismissal

**Files:** App, Navbar, GoalModal, ConfirmationModal, CustomSelect, Today recovery/reason sheets, Weekly/Monthly/Milestone editors.

- [ ] Render overlays outside the main content stacking context through a common portal/root. Increasing a child z-index alone does not solve the current parent-stacking problem.
- [ ] Define consistent ordering among navigation, backdrops, dialogs, sheets, dropdowns, and toasts.
- [ ] Register every active overlay in one reliable dismissal mechanism, including the new recovery sheet and custom selects.
- [ ] Escape/hardware back closes only the top layer, then returns to Today only when no overlay remains. Do not call native exit in web preview.
- [ ] Add dialog names, focus entry/trapping/restoration, background interaction blocking, and scroll handling where applicable.
- [ ] Avoid duplicate form IDs when multiple mounted views contain the shared goal editor; keep footer submission associated with the correct form.
- [ ] Preserve current navigation and intended draft retention; changing hidden-view lifecycle is not a shortcut that may discard edits silently.

**Acceptance:** keyboard and browser interaction tests cover dropdown within modal, every sheet, navigation behind a modal, focus restoration, and correct form submit. Small-screen keyboard and Android hardware back require RB-28 evidence.

### RB-23 — Correct analytics category and date scope

**Files:** `src/components/AnalysisView.tsx`, `src/components/TheoreticalFoundationView.tsx`, Today streak logic, shared selectors.

- [ ] Include custom categories and retained historical categories instead of only `ALL_GOAL_CATEGORIES`.
- [ ] Bound selected time ranges at both ends using the tracking-date rule. Exclude future records from current retrospective metrics.
- [ ] Define inclusive range lengths so "7 days" does not accidentally include eight calendar dates.
- [ ] Use consistent scheduling/history inputs for perfect days and daily/period scores.
- [ ] Make it clear whether streaks are all-time/current or truncated by the selected display range; avoid conflicting Today and Analysis values.
- [ ] Keep raw logged-entry completion rate distinct from scheduled-goal execution score. They have different denominators and need honest labels.

**Acceptance:** a custom category appears; boundary/future records are correctly filtered; goal edits do not rewrite historical categories; range counts and streak labels match fixtures; no invalid/NaN chart output on empty data.

### RB-24 — Correct Monthly labels and boundary breakdown

**Files:** `src/components/MonthlyView.tsx`, `src/utils/dateUtils.ts`, period-score selectors.

- [ ] Remove the duplicate year from the month title.
- [ ] Implement the month-only versus full-calendar-week presentation selected in RB-03.
- [ ] Replace hard-coded "4-Week" wording where the displayed month can contain five or six week slices.
- [ ] Ensure each displayed slice has clear date boundaries and its scores agree with the stated scope.

**Acceptance:** September 2026 title contains the year once; February/leap-year/months spanning six weeks are correct; adjacent-month logs affect the breakdown only under the explicitly labelled full-week policy.

### RB-25 — Replace unsupported diagnostic UI claims

**Files:** TodayView, AnalysisView, TheoreticalFoundationView, `src/data/neuroscienceData.ts`.

- [ ] Replace personalized claims such as "Your amygdala is blocking execution" with descriptions of reported behavior and optional practical prompts.
- [ ] Do not describe self-reported completion records as biometric measurements or a detected biological diagnosis.
- [ ] Keep Theory available as educational content; distinguish general explanation from what the app can observe.
- [ ] Review shame-oriented copy without silently renaming saved failure-reason IDs/history. If reasons are renamed, provide compatible aliases/migration.

**Acceptance:** dynamic messages are grounded in recorded behavior; advice does not claim measurement the app does not perform; stored reason history remains usable; no completion-score change.

### RB-26 — Protect release signing configuration

**Files:** `android/app/build.gradle`, ignore rules, release build documentation; inspect key metadata without printing secret values.

- [ ] Remove hard-coded signing passwords from shareable build configuration and read them from an appropriate local secret mechanism.
- [ ] Keep the existing signing identity unless the user explicitly authorizes a separate key-transition process. Do not generate a replacement key as cleanup.
- [ ] Ensure private keys/local secret files are excluded from ordinary source sharing. Do not remove the real key from disk before a secure recovery plan exists.
- [ ] Document required variables/paths with placeholders only; do not copy passwords into reports or commands shown to the user.
- [ ] Remove unused Google-services integration scaffolding only if confirmed unused. Do not remove Android's `google()` dependency repository simply because cloud integration is prohibited.

**Acceptance:** no signing passwords in shareable source; missing configuration produces an understandable release-build error; when credentials are available, signing identity is verified unchanged without exposing them.

### RB-27 — Verify integrated regression scenarios

**Files:** tests, actual components/services, package scripts, this tracker.

- [ ] Run type checking, the complete automated suite, and the production build after integration.
- [ ] Run the scenario matrix in section 6 against actual behavior, not only regex assertions.
- [ ] Add regression tests alongside the fixes, not merely a large test pass at the end.
- [ ] Replace misleading "E2E" labels where tests exercise only pure functions/source strings; distinguish unit, integration, browser, and device suites.
- [ ] Record any acceptance gaps as open, with a concrete next step. Do not conceal failing branches under mocks that bypass the real logic.

**Acceptance:** required automated checks pass; each reproduced defect has a regression check; browser interaction evidence exists or this task remains pending that portion. No user data is used as a destructive test fixture.

### RB-28 — Verify packaged Android behavior

**Files:** built web assets, Capacitor configuration, Android project, device validation record.

- [ ] Build web output, sync Capacitor, and build the intended Android artifact only after the integrated checks pass.
- [ ] Confirm native packaging uses current local assets and no remote app URL. Distinguish debug and release artifacts.
- [ ] Test airplane-mode cold start, all eight views, icon/font loading, and app background/resume.
- [ ] Test native persistence across close/reopen, process recreation, reboot, and an in-place app update retaining the same application ID/signing identity. Do not uninstall the user's app to test update preservation.
- [ ] Verify native JSON export/import using a complete synthetic dataset in an isolated test installation/profile where available.
- [ ] Verify reminder disable/enable, edits, permission denial, exact-alarm settings, rolling-window refresh, and notification delivery under realistic device conditions.
- [ ] Verify hardware back, open keyboards, safe areas, smallest supported viewport, and modal layering.
- [ ] Record device/OS/build identity, commands, results, and remaining OEM/OS-update limitations. A reboot test is not an OS-update test.

**Acceptance:** evidence covers each performed scenario and clearly marks untested cases. No blanket production-ready statement if required native acceptance remains open. iOS remains out of scope unless OPT-05 is selected.

### RB-29 — Reconcile documentation and prepare the next handoff

**Files:** this document, `PROJECT.md`, `TEST_READY.md`, `TEST_INFRA.md`, parent `APP.md`, relevant handoff notes.

- [ ] Update descriptions to the actual React version, eight views, current navigation, storage backend, scoring contracts, and verified platform scope.
- [ ] Remove obsolete Google-sync user instructions; distinguish ordinary Android build dependencies from app cloud integrations.
- [ ] Replace stale pass counts and "100% E2E" claims with dated, exact evidence and its limits.
- [ ] Preserve historical reports as historical evidence rather than pretending old results apply to new code.
- [ ] Update the task table, decisions, changed-file summary, migrations, and next recommended task. Keep this file the current completion ledger.

**Acceptance:** current docs and tracker agree; no DONE entry lacks evidence; unresolved decisions/device checks remain visible; another agent can resume from one named task without rereading the whole conversation.

## 5. Decision log — proposed, not approved merely by inclusion

Do not rewrite established behavior without the user's selected scope. Record decisions here when supplied; ask only when the selected implementation actually depends on the answer.

| Decision | Existing behavior / ambiguity | Recommended direction | Outcome |
|---|---|---|---|
| D-01 Future execution | Today can navigate forward and record future days | Prevent new future completions; retain legacy data with explicit treatment | UNRESOLVED |
| D-02 Recovery gaps | Gaps can be skipped in a three-day lookback | Prefer adjacent completed tracking days; define idle days explicitly | UNRESOLVED |
| D-03 Monthly slices | Full weeks can include adjacent-month logs | Prefer month-only slices for a monthly report, with displayed date spans | UNRESOLVED |
| D-04 History migration | Old data lacks complete schedule/version history | Preserve available records; prospective versioning with honest legacy baseline | UNRESOLVED |
| D-05 Goal-change effective date | Edits/pause/resume apply immediately and affect all score calculations | Prospective applicability; explicit rule for the current unfinished day | UNRESOLVED |
| D-06 Legacy reward terms | Existing records may have been configured late | Preserve claims; classify legacy terms without invented timestamps | UNRESOLVED |
| D-07 Reward averaging | Only recorded days are averaged | PRESERVE; separate coverage can be considered in OPT-01 | ESTABLISHED CURRENT RULE |
| D-08 Claim timing | 90% default plus 3/10 recorded days, potentially before period end | PRESERVE unless user explicitly requests final-period settlement | ESTABLISHED CURRENT RULE |
| D-09 Visual/navigation baseline | Brief differs from recent code | Preserve eight views, top-header More, bundled assets, current type direction | PRESERVE RECENT IMPLEMENTATION |

## 6. Integrated acceptance matrix

Each row needs a result and evidence under RB-27/RB-28. Synthetic data only for destructive scenarios.

| Scenario | Required result | Evidence level |
|---|---|---|
| Clean first launch | Empty execution data, intended initial milestones, no fake scores | Integration + device |
| Existing installation migration | All entities preserved, migration repeat-safe | Integration + device |
| Invalid/unsupported backup | Rejected before mutation | Integration |
| Interrupted/quota-failed import | Complete previous or complete imported state; never mixed | Failure injection |
| All-entity export/import | Unicode, empties, optional fields, history preserved | Integration + native file |
| Delete all milestones, reload | Milestones remain empty | Integration |
| Reset cancellation | No data or reminders changed | Interaction |
| Failed persistence | Visible failure, recoverable state, no false success | Integration + interaction |
| Future-start/weekday/custom goal | Today, scoring, and reminders agree | Unit + interaction |
| Edit paused goal | Stays paused; hidden fields retained | Interaction |
| Historical score after edits/retirement | Prior score and metadata unchanged | Integration |
| Undo after navigating dates | Exact original record restored to original date | Interaction |
| Import/reset then Settings Save | No stale settings resurrection | Interaction |
| Rollover while backgrounded | Live date refreshes correctly on resume | Clock-controlled + device |
| India early morning / DST / year change | Date semantics remain consistent | Clock-controlled |
| Master reminders off | Desired and native pending queues contain no enabled reminders | Unit + adapter + device |
| Reminder time/content changed | Existing notification replaced correctly | Adapter + device |
| Rapid reminder edits | Latest edit wins without duplicates | Integration |
| Permission denied/exact alarms unavailable | Accurate state and defined fallback | Adapter + device |
| Locked-period reward edit | Rejected by UI and mutation rules | Interaction + unit |
| Zero spend / no reward / repeated claim | Zero retained; invalid/duplicate claim blocked | Interaction |
| Recovery sequence with gaps/idle days | Matches D-02 exactly | Unit |
| Modal → dropdown → back | Only top layer closes; correct focus restoration | Browser + device |
| Main modal versus header/bottom nav | Background controls cannot bypass the modal | Browser + device |
| Custom category / time-range boundary | Correct analytics membership and labels | Unit + render |
| Month crossing five/six calendar weeks | Accurate title, labels, and selected date scope | Unit + render |
| Offline packaged cold start | App, fonts, icons, and views work without network | Device |
| In-place Android update | Existing records retained with same app identity/key | Device |

## 7. Optional improvements — implement only when selected

### OPT-01 — Show logging coverage separately

- [ ] Define a coverage denominator using applicable scheduled days; do not change the established average.
- [ ] Display execution percentage and logging coverage with understandable labels.
- [ ] Test three perfect logged days within a seven-day applicable period: execution may remain 100%, while coverage communicates the missing records.

**Acceptance:** users can distinguish consistency of recorded execution from completeness of logging; reward formulas remain unchanged unless separately approved.

### OPT-02 — Finish visual tokens and shared components

- [ ] Inspect actual CSS tokens and screen styling before choosing a narrow scope. Existing token declarations do not mean adoption is complete.
- [ ] Consolidate repeated cards/headers/buttons/badges incrementally; `Badge` and `SectionHeader` were unused at audit time.
- [ ] Keep offline Satoshi/Remixicon assets and recent navigation; do not force the old brief's icon provider, CDN, 40px hero, or fifth bottom trigger.
- [ ] Compare every use of the selected shared component across views, including active/disabled/error states.

**Acceptance:** selected components share one implementation and consistent tokens without behavior regression; visual inspection evidence is supplied.

### OPT-03 — Accessibility and mobile visual pass

- [ ] Respect reduced-motion preferences in CSS and JavaScript effects such as confetti.
- [ ] Make chart details accessible by touch and keyboard, not mouse hover only.
- [ ] Review disabled zoom, text scaling, measured contrast, accessible labels, focus visibility, target size, and gaps.
- [ ] Verify keyboard-open modal footers, safe-area padding, long text, and small viewports. Global CSS already forces native input/select/textarea text to 16px; do not falsely report their Tailwind text classes as computed input size.

**Acceptance:** measured/browser/device evidence, not only source regex checks; documented remaining platform limitations.

### OPT-04 — Measure startup and reduce unnecessary work/assets

- [ ] Measure before optimizing. All eight mounted views and historical calculations may add work, but no runtime performance regression was established in the audit.
- [ ] Preserve navigation/draft state if changing mount or loading strategy; do not trade correctness for a smaller first render.
- [ ] Inspect duplicate image copies and unused icon font formats. The audited `dist` was about 10.7 MB; transferred/loaded runtime bytes are a different metric.
- [ ] Profile representative long history and low-end Android startup before/after a bounded change.

**Acceptance:** measurable improvement with unchanged behavior, offline assets, and state retention; no unsupported claim that every packaged asset is downloaded or decoded at startup.

### OPT-05 — Prepare iOS separately

- [ ] Confirm iOS delivery is actually requested; no iOS native project existed in this audit.
- [ ] Review plugin compatibility, queue limits, file sharing, persistence/privacy declarations, safe areas, and any native navigation gestures.
- [ ] Build/test on appropriate Apple tooling/device; do not label Android success as cross-platform acceptance.

**Acceptance:** separate iOS build/device evidence and limitations. Do not add an iOS project as incidental Android cleanup.

## 8. Verification commands and reporting

Run from the confirmed application root. These are starting commands; inspect current scripts first.

```powershell
Set-Location 'D:\Thiyo\Rebuild\Rebuild-main'
npm run lint
npm test
npm run build
```

For a selected native packaging task, after web checks:

```powershell
npx cap sync android
```

Then from the `android` directory, use the intended target, for example:

```powershell
.\gradlew.bat assembleDebug
```

Notes:

- `npm run lint` currently means TypeScript checking, not a general lint/style audit.
- Build and Capacitor sync write generated assets; do not run them during a later request explicitly limited to read-only analysis without explaining/using an appropriate read-only verification method.
- Run commands separately and inspect each exit status. A successful last command must not hide an earlier failure.
- Do not run a package install, clean, force-upgrade, uninstall, release upload, or signing-key generation merely because it appears in another agent's old notes.
- If a tool/device is unavailable, record the specific gap and proceed with independent checks; leave dependent acceptance pending.

### Per-task evidence template

Copy into the completion log below after work. Keep the master table synchronized.

```text
Task ID:
Date / agent:
Status:
Current issue confirmed at:
Decision(s) used:
Change and reason:
Files changed:
Data/schema/migration impact:
Commands and exit results:
Behavioral checks / fixtures:
Browser/device checks actually performed:
Remaining risks / blocked acceptance:
Next task:
```

## 9. Copy-paste prompt for another AI agent

```text
Work in D:\Thiyo\Rebuild\Rebuild-main.
Read AGENT_IMPLEMENTATION_TODO.md and applicable project instructions.

Selected task: RB-01 (or replace with the task ID I specify).
I authorize implementation of that selected task and its necessary tests only.

Re-inspect current source first: this project has changed recently. Do not
blindly implement an old audit, operating brief, or another checkout's rules.
Preserve the eight-view application, current navigation, locally bundled
assets, reason-neutral scoring, and documented logged-day averages.

Before editing, briefly report the current finding and proposed correction.
Resolve routine implementation choices yourself. If a product decision is
actually required, identify the relevant decision ID and continue any
independent work; do not silently change the product policy.

Implement the selected scope, add meaningful regression coverage, run the
required checks, and update the task status/evidence in this same TODO file.
Do not alter unrelated features, reset my real data, replace signing keys,
or claim device/visual acceptance from automated tests.

Finish with what changed, actual checks/results, remaining acceptance gaps,
and the next task ID. Do not mark a partially verified task DONE.
```

## 10. Completion log

### RB-01: Fix current TypeScript error
- Date: 2026-09-12
- Status: DONE
- Files changed: `src/components/AnalysisView.tsx`
- Change: Imported `DayRecord` from `../types` to fix `error TS2304: Cannot find name 'DayRecord'`.
- Verification: `npm run lint` (`tsc --noEmit`) exited with code 0 (clean build).

### RB-13: Preserve paused state and fields when editing goals
- Date: 2026-09-12
- Status: DONE
- Files changed: `src/components/GoalModal.tsx`
- Change: Spread `...(editingGoal || {})` and preserved `active: formArchived ? false : (editingGoal ? editingGoal.active : true)`. Unedited fields (`customDays`, `weight`, `endDate`) and paused state are retained.
- Verification: All 198 unit and boundary tests pass (`npm test`).

### RB-26: Protect release signing configuration
- Date: 2026-09-12
- Status: DONE
- Files changed: `android/app/build.gradle`, `.gitignore`, `android/.gitignore`, created `android/app/keystore.properties.example` and `android/app/keystore.properties`
- Change: Dynamic loading of keystore credentials from `keystore.properties` or environment variables; excluded secrets and keystore files from git.
- Verification: Ran `gradlew.bat help` in `android/` -> `BUILD SUCCESSFUL in 8s`.

### RB-16: Honour the notification master switch
- Date: 2026-09-12
- Status: DONE
- Files changed: `src/services/notifications.ts`, `tests/tier1-features/f16_local_notifications.test.ts`
- Change: `buildRollingNotificationSchedule` returns `[]` when `settings.notificationsEnabled === false`. In `syncNotificationSchedule`, this clears all pending notifications via `LocalNotifications.cancel`.
- Verification: Added regression test `F16.7` confirming 0 notifications are scheduled when disabled.

### RB-17: Replace edited reminders and serialize queue updates
- Date: 2026-09-12
- Status: DONE
- Files changed: `src/services/notifications.ts`, `tests/tier1-features/f16_local_notifications.test.ts`
- Change: Notification IDs for goals, evening logging, and weekly nudges now include their reminder times and titles in the hash key. Any change produces a new ID so diff-sync cancels the old alarm and schedules the new one. Synchronized sync calls with `activeSyncPromise` chain.
- Verification: Added regression test `F16.8` confirming distinct IDs on reminder time edits.

### RB-09: Preserve empty data and make reset safe
- Date: 2026-09-12
- Status: DONE
- Files changed: `src/services/storage.ts`, `tests/tier1-features/f01_f02_persistence_backup.test.ts`
- Change: `loadStoredState` now distinguishes between uninitialized milestones (`rawMilestones === null`) and an explicit empty array `[]` (`hasMilestonesStored = true`), preventing `INITIAL_MILESTONES_2027` from resurrecting when a user deletes all milestones.
- Verification: Added regression test `F01.8` confirming empty milestone array survives reload.

## 11. Reference material

- Current application source is the authority for what is implemented. Parent `APP.md` and `NEUROSCIENCE_SYSTEM.md` provide product context but contain older material.
- The pasted operating brief is contextual guidance with conflicts; do not treat CDN-only assets or its older screen count as automatic correction targets.
- Capacitor 7 Preferences: https://capacitorjs.com/docs/v7/apis/preferences
- Capacitor 7 Local Notifications: https://capacitorjs.com/docs/v7/apis/local-notifications
- Capacitor 7 Share: https://capacitorjs.com/docs/v7/apis/share
- React state updater purity: https://react.dev/reference/react/useState

Recheck official documentation against the installed versions when implementing a plugin change. These references were consulted during the source audit; they are not evidence of native device acceptance.
