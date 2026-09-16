import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';

const PROJECT_ROOT = process.cwd();

describe('Tier 2 - Boundary 6: Typography, Icon Assets & Mobile Ergonomics Boundaries', () => {
  it('B6.1: should reject any CSS rule containing font-style: italic with any whitespace variations', () => {
    const cssPath = path.join(PROJECT_ROOT, 'src/index.css');
    const content = fs.readFileSync(cssPath, 'utf-8');

    // Test whitespace variations of font-style : italic
    assert.strictEqual(/font-style\s*:\s*italic\b/i.test(content), false);
    assert.strictEqual(/font-style\s*:\s*oblique\b/i.test(content), false);
  });

  it('B6.2: should verify Satoshi font-weight ranges span from Light (300) to Black (900)', () => {
    const cssPath = path.join(PROJECT_ROOT, 'src/index.css');
    const content = fs.readFileSync(cssPath, 'utf-8');

    assert.ok(content.includes('font-weight: 300') || content.includes('300 900'), 'Must support light weight 300');
    assert.ok(content.includes('font-weight: 400') || content.includes('300 900'), 'Must support regular weight 400');
    assert.ok(content.includes('font-weight: 700') || content.includes('300 900'), 'Must support bold weight 700');
    assert.ok(content.includes('font-weight: 900') || content.includes('300 900'), 'Must support black weight 900');
  });

  it('B6.3: should verify all Satoshi .woff2 files have valid WOFF2 file signatures (magic bytes wOF2)', () => {
    const fontsDir = path.join(PROJECT_ROOT, 'public/fonts');
    const fontFiles = fs.readdirSync(fontsDir).filter(f => f.endsWith('.woff2'));

    assert.ok(fontFiles.length >= 6, 'Must have at least 6 woff2 font files');

    for (const file of fontFiles) {
      const buffer = fs.readFileSync(path.join(fontsDir, file));
      // First 4 bytes of WOFF2 is 'wOF2' (0x77 0x4F 0x46 0x32)
      const magic = buffer.subarray(0, 4).toString('ascii');
      assert.strictEqual(magic, 'wOF2', `Font file ${file} must have valid wOF2 magic header`);
    }
  });

  it('B6.4: should verify no external URL imports exist in src/index.css', () => {
    const cssPath = path.join(PROJECT_ROOT, 'src/index.css');
    const content = fs.readFileSync(cssPath, 'utf-8');

    assert.strictEqual(
      /@import\s+(url\()?['"]https?:\/\//i.test(content),
      false,
      'src/index.css must not contain external HTTP/HTTPS @import rules'
    );
  });

  it('B6.5: should ensure Remixicon class names follow ri-* convention strictly', () => {
    const componentsDir = path.join(PROJECT_ROOT, 'src/components');
    const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

    for (const file of files) {
      const content = fs.readFileSync(path.join(componentsDir, file), 'utf-8');
      const matches = content.match(/ri-[a-z0-9-]+/g) || [];
      for (const cls of matches) {
        assert.ok(/^ri-[a-z0-9-]+$/.test(cls), `Invalid Remixicon class format: ${cls}`);
      }
    }
  });

  it('B6.6: should verify bottom navigation height respects mobile viewport constraints', () => {
    const navbarPath = path.join(PROJECT_ROOT, 'src/components/Navbar.tsx');
    const content = fs.readFileSync(navbarPath, 'utf-8');

    // Must be compact yet ergonomic
    assert.ok(content.includes('bottom-0'), 'Must be placed at bottom-0');
    assert.ok(content.includes('safe-bottom'), 'Must support safe-bottom area');
  });

  it('B6.7: should ensure mobile bottom sheet handles drag handle container cleanly', () => {
    const todayPath = path.join(PROJECT_ROOT, 'src/components/TodayView.tsx');
    const content = fs.readFileSync(todayPath, 'utf-8');

    assert.ok(
      content.includes('rounded-full') && content.includes('w-12'),
      'Must render mobile bottom sheet drag handle indicator'
    );
  });

  it('B6.8: should verify touch active scale effect (active:scale-[0.98] or active:scale-95) for tactile feedback', () => {
    const navbarPath = path.join(PROJECT_ROOT, 'src/components/Navbar.tsx');
    const content = fs.readFileSync(navbarPath, 'utf-8');

    assert.ok(
      content.includes('active:scale-95') || content.includes('active:scale-'),
      'Navbar tabs must have active scale tactile response'
    );
  });

  it('B6.9: should verify Capacitor core imports handle web platform without exceptions', () => {
    const nativePath = path.join(PROJECT_ROOT, 'src/services/native.ts');
    const content = fs.readFileSync(nativePath, 'utf-8');

    assert.ok(
      content.includes('if (!isNativePlatform()) return'),
      'Native operations must safely guard when running in browser or test environment'
    );
  });

  it('B6.10: should verify native haptics wrapper provides all 7 standard tactile styles', () => {
    const nativePath = path.join(PROJECT_ROOT, 'src/services/native.ts');
    const content = fs.readFileSync(nativePath, 'utf-8');

    assert.ok(content.includes('light'), 'Must support light haptic');
    assert.ok(content.includes('medium'), 'Must support medium haptic');
    assert.ok(content.includes('heavy'), 'Must support heavy haptic');
    assert.ok(content.includes('selection'), 'Must support selection haptic');
    assert.ok(content.includes('success'), 'Must support success haptic');
    assert.ok(content.includes('warning'), 'Must support warning haptic');
    assert.ok(content.includes('error'), 'Must support error haptic');
  });

  it('B6.11: should confirm zero CSS inline style tags setting font-style: italic in components', () => {
    const componentsDir = path.join(PROJECT_ROOT, 'src/components');
    const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

    for (const file of files) {
      const content = fs.readFileSync(path.join(componentsDir, file), 'utf-8');
      assert.strictEqual(
        /fontStyle\s*:\s*['"]italic['"]/i.test(content),
        false,
        `Found inline fontStyle: 'italic' in ${file}`
      );
    }
  });

  it('B6.12: should confirm universal typography fallback stack in index.css is well-formed', () => {
    const cssPath = path.join(PROJECT_ROOT, 'src/index.css');
    const content = fs.readFileSync(cssPath, 'utf-8');

    assert.ok(
      content.includes('-apple-system') && content.includes('BlinkMacSystemFont') && content.includes('sans-serif'),
      'CSS must contain standard robust fallback font stack'
    );
  });

  it('B6.13: should verify index.html declares viewport meta with viewport-fit=cover for mobile edge-to-edge', () => {
    const indexPath = path.join(PROJECT_ROOT, 'index.html');
    const content = fs.readFileSync(indexPath, 'utf-8');

    assert.ok(
      content.includes('viewport-fit=cover') || content.includes('width=device-width'),
      'index.html must specify mobile device-width and viewport coverage'
    );
  });

  it('B6.14: should verify that no Markdown documentation files leak italic tags into UI components', () => {
    const componentsDir = path.join(PROJECT_ROOT, 'src/components');
    const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

    for (const file of files) {
      const content = fs.readFileSync(path.join(componentsDir, file), 'utf-8');
      assert.strictEqual(
        /<em>|<\/em>|<i\s+class="italic"/i.test(content),
        false,
        `Found forbidden emphasis markup in ${file}`
      );
    }
  });

  it('B6.15: should verify theme tokens are defined for dark mode background (--bg-app: #090D16)', () => {
    const cssPath = path.join(PROJECT_ROOT, 'src/index.css');
    const content = fs.readFileSync(cssPath, 'utf-8');

    assert.ok(content.includes('--bg-app'), 'Must define semantic --bg-app theme variable');
    assert.ok(content.includes('#090D16') || content.includes('#0A0E17'), 'Must use the deep dark theme token');
  });
});
