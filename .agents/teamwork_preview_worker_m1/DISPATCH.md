## 2026-09-11T06:44:27Z

You are the Milestone 1 Worker for the REBUILD project.
Your working directory is: d:\Thiyo\Rebuild\Rebuild-main\.agents\teamwork_preview_worker_m1
Authoritative requirements: d:\Thiyo\Rebuild\Rebuild-main\.agents\ORIGINAL_REQUEST.md
Project architecture: d:\Thiyo\Rebuild\Rebuild-main\PROJECT.md

MANDATORY: Read ORIGINAL_REQUEST.md and PROJECT.md first.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your exclusive write ownership:
- firebase-applet-config.json
- .env.example
- metadata.json
- package.json
- src/types.ts
- index.html
- src/index.css
- public/fonts/* (or local font asset directory)

Your specific tasks:
1. Complete removal of Google & External Cloud Dependencies (R2):
   - Delete firebase-applet-config.json completely.
   - Sanitize .env.example: remove GEMINI_API_KEY and Cloud Run APP_URL references.
   - Sanitize metadata.json: remove Google Sheets/Calendar sync & Gemini descriptions.
   - In src/types.ts: prune `calendarEventId?: string;` from Goal, and prune `spreadsheetId?: string;`, `spreadsheetUrl?: string;`, `lastSyncedAt?: string;` from AppSettings.
   - Add `archived?: boolean;` to Goal interface in src/types.ts.
   - In package.json: prune dead packages that have 0 imports (@google/genai, firebase, express, @types/express, dotenv, tsx, lucide-react, motion, duplicate "vite"). Add `"cap": "cap"` to scripts. Fix the "clean" script to be cross-platform (e.g. `node -e \"fs.rmSync('dist', {recursive:true, force:true})\"`).

2. Universal Satoshi Typography & Offline Assets (R8, R9):
   - In index.html: remove the external Fontshare CDN link (`https://api.fontshare.com/...`) and remove the Remixicon jsDelivr CDN link (`https://cdn.jsdelivr.net/npm/remixicon...`). Remixicon is already installed via npm and bundled by Vite!
   - Ensure local Satoshi font files (.woff2) are available locally under public/fonts/ (or src/assets/fonts/). If needed, download the WOFF2 files from Fontshare or generate clean local font files/styles. Define local @font-face rules in src/index.css so that Satoshi loads 100% offline with zero CDN dependencies.
   - Strictly verify 0 occurrences of `italic`, `font-style: italic`, `<em>`, or `<i>` formatting tags. (All Remixicon usage must remain `<i className="ri-..." />` with `font-style: normal !important`).

3. Verification:
   - Run `yarn build` (or `npm run build`) to ensure 0 TypeScript and Vite bundling errors.
   - Document all changes in d:\Thiyo\Rebuild\Rebuild-main\.agents\teamwork_preview_worker_m1\changes.md.
   - Deliver handoff.md with Observation, Logic Chain, Caveats, Conclusion, and Verification Method.
   - Send message to parent upon completion.
