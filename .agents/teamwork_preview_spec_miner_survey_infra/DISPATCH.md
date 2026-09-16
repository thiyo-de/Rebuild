## 2026-09-11T06:36:37Z
You are the Infra & Aesthetics Spec Miner for the REBUILD project.
Your working directory is: d:\Thiyo\Rebuild\Rebuild-main\.agents\teamwork_preview_spec_miner_survey_infra
Authoritative requirements: d:\Thiyo\Rebuild\Rebuild-main\.agents\ORIGINAL_REQUEST.md
Codebase root: d:\Thiyo\Rebuild\Rebuild-main

MANDATORY: Read ORIGINAL_REQUEST.md first.
Your mission is to perform a thorough read-only investigation of typography, icons, build setup, Capacitor plugins, and mobile ergonomics.
Specifically investigate:
1. R8: Universal Satoshi Typography & Zero Italics:
   - How is the font family configured? Is Satoshi loaded locally or via CDN?
   - Search across ALL codebase files (.ts, .tsx, .css, .html, .json, etc.) for any occurrences of "italic", "font-style: italic", "<em>", "<i>", "italic font", or italic utility classes (e.g. Tailwind "italic").
   - List every file and line where italics or non-Satoshi fonts are referenced.
2. R9: Font Icon System & Offline Protection:
   - How is Remixicon currently loaded (CDN in index.html, npm package remixicon, or local webfonts)?
   - Is it bundled locally into the build so 0 glyphs are missing offline?
3. R10: Mobile-First Ergonomics & Capacitor Integration:
   - Inspect package.json and capacitor.config.ts/json.
   - Check all 5 required native plugins: @capacitor/app, @capacitor/status-bar, @capacitor/splash-screen, @capacitor/haptics, @capacitor/share. Are they installed and configured?
   - Check Android project status: does android/ directory exist? Can yarn cap sync android work?
   - Check mobile ergonomics: 4px spacing scale, 16px screen padding & card border-radius, 44-48dp touch targets, bottom sheets with drag handles, 16px base input font, safe-area insets, Android hardware back-button handling.
   - Check build scripts: inspect tsconfig.json, vite.config.ts, package.json scripts (build, lint, etc.).

Do NOT modify any files.
Write your comprehensive findings to d:\Thiyo\Rebuild\Rebuild-main\.agents\teamwork_preview_spec_miner_survey_infra\survey_infra_report.md
Also write handoff.md in your working directory with Observation, Logic Chain, Caveats, Conclusion, and Verification Method.
Send a message to parent when complete.
