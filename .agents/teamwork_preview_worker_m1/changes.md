# Milestone 1 Changes Log

## Scope: Core Clean-up, Typography & Offline Assets (R2, R8, R9)

### Summary of Changes
| File | Action | Description |
|------|--------|-------------|
| `firebase-applet-config.json` | DELETED | Purged Google Firebase configuration completely. |
| `.env.example` | MODIFIED | Removed `GEMINI_API_KEY` and Cloud Run `APP_URL`. Clarified offline-first nature. |
| `metadata.json` | MODIFIED | Removed Google Sheets/Calendar sync descriptions and `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`. |
| `src/types.ts` | MODIFIED | Pruned `calendarEventId?: string;` from `Goal`. Pruned `spreadsheetId?: string;`, `spreadsheetUrl?: string;`, `lastSyncedAt?: string;` from `AppSettings`. Added `archived?: boolean;` to `Goal`. |
| `package.json` | MODIFIED | Pruned dead packages (`@google/genai`, `firebase`, `express`, `@types/express`, `dotenv`, `tsx`, `lucide-react`, `motion`, duplicate `vite`). Added `"cap": "cap"`. Made `"clean"` cross-platform using Node `fs.rmSync`. |
| `index.html` | MODIFIED | Removed external Fontshare CDN link and Remixicon jsDelivr CDN link along with external font preconnects. |
| `public/fonts/*` | ADDED | Added local Satoshi `.woff2` font files (`Satoshi-Light.woff2`, `Satoshi-Regular.woff2`, `Satoshi-Medium.woff2`, `Satoshi-Bold.woff2`, `Satoshi-Black.woff2`, `Satoshi-Variable.woff2`). |
| `src/index.css` | MODIFIED | Replaced external Fontshare `@import` with local `@font-face` rules pointing to `/fonts/Satoshi-*.woff2`. Verified zero italics and `font-style: normal !important`. |

---

### Detailed File Changes

#### 1. `firebase-applet-config.json`
- **Before**: Contained Firebase project credentials (`projectId`, `appId`, `apiKey`, `authDomain`, `storageBucket`, `messagingSenderId`, `oAuthClientId`).
- **After**: File deleted completely. Zero cloud configuration files remain.

#### 2. `.env.example`
- **Before**: Contained `GEMINI_API_KEY` and Cloud Run `APP_URL`.
- **After**: Sanitized to state that REBUILD is 100% offline-first with zero backend server, zero cloud auth, and zero API keys required.

#### 3. `metadata.json`
- **Before**: Described Google Sheets and Calendar sync and listed `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`.
- **After**: Cleaned description to reflect offline-first goal execution and consistency tracking with neuroscience-based failure analytics; emptied `majorCapabilities` array.

#### 4. `src/types.ts`
- **Goal Interface**:
  - Removed: `calendarEventId?: string;`
  - Added: `archived?: boolean;`
- **AppSettings Interface**:
  - Removed: `spreadsheetId?: string;`
  - Removed: `spreadsheetUrl?: string;`
  - Removed: `lastSyncedAt?: string;`

#### 5. `package.json`
- **Scripts**:
  - `"clean"`: Changed from `rm -rf dist server.js` to `node -e "fs.rmSync('dist', {recursive:true, force:true})"` (cross-platform).
  - Added: `"cap": "cap"`.
- **Dependencies Pruned**:
  - `@google/genai`
  - `dotenv`
  - `express`
  - `firebase`
  - `lucide-react`
  - `motion`
  - duplicate `vite` (kept in `devDependencies`)
- **DevDependencies Pruned**:
  - `@types/express`
  - `tsx`

#### 6. `index.html`
- Removed Google fonts preconnect tags.
- Removed Fontshare CDN CSS link (`https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&display=swap`).
- Removed jsDelivr CDN link for Remixicon (`https://cdn.jsdelivr.net/npm/remixicon@4.3.0/fonts/remixicon.css`).
- Retained clean local application shell pointing directly to `/src/main.tsx`.

#### 7. `public/fonts/`
- Created directory `public/fonts/`.
- Populated with local Satoshi `.woff2` font files:
  - `Satoshi-Light.woff2` (weight 300)
  - `Satoshi-Regular.woff2` (weight 400)
  - `Satoshi-Medium.woff2` (weight 500)
  - `Satoshi-Bold.woff2` (weight 700)
  - `Satoshi-Black.woff2` (weight 900)
  - `Satoshi-Variable.woff2` (weights 300-900)

#### 8. `src/index.css`
- Replaced external Fontshare `@import` with 6 local `@font-face` declarations loading `/fonts/Satoshi-*.woff2`.
- Confirmed strict zero italics: all font styles configured as `normal` / `normal !important`.

---

### Verification Summary
- `npm run lint` (`tsc --noEmit`): PASSED (Exit code 0, 0 errors).
- `npm run build` (`vite build`): PASSED (Exit code 0, bundled in 1.32s, 0 errors).
- `npm run clean`: PASSED (Exit code 0, cross-platform directory removal).
- Italics Scan: 0 occurrences of `italic`, `font-style: italic`, `<em>`, or `<i>` formatting tags across the codebase.
- CDN Scan: 0 external URLs in `index.html` and built `dist/assets/index-*.css`.
