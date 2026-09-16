import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ActiveTab, AppSettings } from '../../src/types';
import { INITIAL_SETTINGS } from '../../src/data/starterData';

const PROJECT_ROOT = process.cwd();

describe('Tier 1 - Feature 3: Zero Cloud & Google Elimination (R2)', () => {
  it('F3.1: should confirm elimination of all remote sync and Google cloud source files', () => {
    const forbiddenFiles = [
      path.join(PROJECT_ROOT, 'src/services/googleSheets.ts'),
      path.join(PROJECT_ROOT, 'src/services/googleCalendar.ts'),
      path.join(PROJECT_ROOT, 'src/services/auth.ts'),
      path.join(PROJECT_ROOT, 'src/components/GoogleSyncModal.tsx'),
      path.join(PROJECT_ROOT, 'firebase-applet-config.json'),
    ];

    for (const file of forbiddenFiles) {
      assert.strictEqual(
        fs.existsSync(file),
        false,
        `Forbidden cloud sync file must not exist: ${path.relative(PROJECT_ROOT, file)}`
      );
    }
  });

  it('F3.2: should ensure AppSettings has zero Google Sheets or Calendar sync fields', () => {
    const settings: AppSettings = INITIAL_SETTINGS;
    assert.strictEqual((settings as any).spreadsheetId, undefined, 'spreadsheetId must be pruned');
    assert.strictEqual((settings as any).spreadsheetUrl, undefined, 'spreadsheetUrl must be pruned');
    assert.strictEqual((settings as any).lastSyncedAt, undefined, 'lastSyncedAt must be pruned');
  });

  it('F3.3: should verify index.html contains zero Google Fonts preconnect or external sync scripts', () => {
    const indexPath = path.join(PROJECT_ROOT, 'index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');

    assert.strictEqual(
      indexContent.includes('fonts.googleapis.com'),
      false,
      'index.html must not contain Google fonts preconnect'
    );
    assert.strictEqual(
      indexContent.includes('fonts.gstatic.com'),
      false,
      'index.html must not contain Google gstatic preconnect'
    );
    assert.strictEqual(
      indexContent.includes('accounts.google.com'),
      false,
      'index.html must not contain Google OAuth script'
    );
    assert.strictEqual(
      indexContent.includes('apis.google.com'),
      false,
      'index.html must not contain Google API client'
    );
  });

  it('F3.4: should verify metadata.json and .env.example contain zero cloud sync keys or claims', () => {
    const metaPath = path.join(PROJECT_ROOT, 'metadata.json');
    if (fs.existsSync(metaPath)) {
      const metaContent = fs.readFileSync(metaPath, 'utf-8');
      assert.strictEqual(
        metaContent.toLowerCase().includes('google sheets'),
        false,
        'metadata.json must not reference Google Sheets'
      );
      assert.strictEqual(
        metaContent.toLowerCase().includes('google calendar'),
        false,
        'metadata.json must not reference Google Calendar'
      );
    }

    const envPath = path.join(PROJECT_ROOT, '.env.example');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      assert.strictEqual(
        envContent.includes('GEMINI_API_KEY='),
        false,
        '.env.example must not demand Gemini API key'
      );
    }
  });

  it('F3.5: should verify src/ types and components contain zero imports of deleted cloud modules', () => {
    const srcDir = path.join(PROJECT_ROOT, 'src');
    const scanDir = (dir: string): string[] => {
      const results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const item of list) {
        const full = path.join(dir, item);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          results.push(...scanDir(full));
        } else if (/\.(ts|tsx)$/.test(item)) {
          results.push(full);
        }
      }
      return results;
    };

    const files = scanDir(srcDir);
    const cloudImportPatterns = [
      /googleSheets/i,
      /googleCalendar/i,
      /GoogleSyncModal/i,
      /@google\/genai/i,
      /firebase\/app/i,
      /firebase\/auth/i,
    ];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      for (const pattern of cloudImportPatterns) {
        assert.strictEqual(
          pattern.test(content),
          false,
          `Found obsolete cloud import in ${path.relative(PROJECT_ROOT, file)} matching ${pattern}`
        );
      }
    }
  });

  it('F3.6: should verify Goal model contains zero remote calendar mapping IDs', () => {
    const typesPath = path.join(PROJECT_ROOT, 'src/types.ts');
    const content = fs.readFileSync(typesPath, 'utf-8');
    assert.strictEqual(
      content.includes('calendarEventId'),
      false,
      'Goal interface must not contain calendarEventId'
    );
  });
});

describe('Tier 1 - Feature 4: 7-Screen & 4+1 Mobile Navigation (R3)', () => {
  it('F4.1: should support exactly 7 distinct screen tabs in the navigation contract', () => {
    const expectedTabs: ActiveTab[] = [
      'today',
      'goals',
      'weekly',
      'monthly',
      'milestones',
      'analysis',
      'settings',
    ];
    assert.strictEqual(expectedTabs.length, 7, 'Must define exactly 7 screens');
  });

  it('F4.2: should configure 4 primary bottom navbar tabs (Today, Goals, Weekly, Analysis)', () => {
    const navbarPath = path.join(PROJECT_ROOT, 'src/components/Navbar.tsx');
    const content = fs.readFileSync(navbarPath, 'utf-8');

    // Verify presence of the 4 main items
    assert.ok(content.includes("'today'"), 'Navbar must include Today tab');
    assert.ok(content.includes("'goals'"), 'Navbar must include Goals tab');
    assert.ok(content.includes("'weekly'"), 'Navbar must include Weekly tab');
    assert.ok(content.includes("'analysis'"), 'Navbar must include Analysis tab');
  });

  it('F4.3: should feature an icon More trigger button for relative popover navigation', () => {
    const navbarPath = path.join(PROJECT_ROOT, 'src/components/Navbar.tsx');
    const content = fs.readFileSync(navbarPath, 'utf-8');

    // Verify more trigger with element ID or icon
    const hasMoreTrigger =
      (content.includes('id="header-more-btn"') || content.includes('id="mobile-tab-more"') || content.includes('id="desktop-more-menu-btn"')) &&
      (content.includes('ri-stack-line') || content.includes('ri-more-fill') || content.includes('ri-apps-2-line') || content.includes('ri-more-line'));
    assert.ok(hasMoreTrigger, 'Navbar must feature More trigger button with icon');
  });

  it('F4.4: should provide access to Monthly Review and 2027 Milestones within More popover', () => {
    const navbarPath = path.join(PROJECT_ROOT, 'src/components/Navbar.tsx');
    const content = fs.readFileSync(navbarPath, 'utf-8');

    assert.ok(content.includes("'monthly'"), 'More popover must route to Monthly view');
    assert.ok(content.includes("'milestones'"), 'More popover must route to Milestones view');
  });

  it('F4.5: should provide permanent top-right header Settings icon button across all screens', () => {
    const navbarPath = path.join(PROJECT_ROOT, 'src/components/Navbar.tsx');
    const content = fs.readFileSync(navbarPath, 'utf-8');

    assert.ok(content.includes("'settings'"), 'Navbar header must contain Settings trigger');
    assert.ok(
      content.includes('ri-settings-') || content.includes('ri-settings-3-line') || content.includes('ri-settings-4-line'),
      'Header must render Settings icon'
    );
  });

  it('F4.6: should enforce mobile ergonomics with fixed bottom bar and z-index positioning', () => {
    const navbarPath = path.join(PROJECT_ROOT, 'src/components/Navbar.tsx');
    const content = fs.readFileSync(navbarPath, 'utf-8');

    assert.ok(content.includes('fixed'), 'Bottom navbar must be fixed position');
    assert.ok(content.includes('bottom-0'), 'Bottom navbar must pin to bottom-0');
    assert.ok(content.includes('z-'), 'Navbar must specify z-index stacking');
  });
});
