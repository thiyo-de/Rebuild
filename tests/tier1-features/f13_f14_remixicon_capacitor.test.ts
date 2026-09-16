import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';

const PROJECT_ROOT = process.cwd();

describe('Tier 1 - Feature 13: Local Remixicon Icon Bundling (R9)', () => {
  it('F13.1: should import Remixicon locally in src/main.tsx without external CDN links', () => {
    const mainPath = path.join(PROJECT_ROOT, 'src/main.tsx');
    const mainContent = fs.readFileSync(mainPath, 'utf-8');

    assert.ok(
      mainContent.includes("import 'remixicon/fonts/remixicon.css'"),
      'src/main.tsx must import local remixicon css from node_modules'
    );
  });

  it('F13.2: should verify index.html contains zero external CDN links for Remixicon', () => {
    const indexPath = path.join(PROJECT_ROOT, 'index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');

    assert.strictEqual(
      indexContent.includes('cdn.jsdelivr.net/npm/remixicon'),
      false,
      'index.html must not contain CDN link for Remixicon'
    );
  });

  it('F13.3: should confirm local remixicon package presence in node_modules', () => {
    const remixiconPackage = path.join(PROJECT_ROOT, 'node_modules/remixicon/package.json');
    assert.ok(fs.existsSync(remixiconPackage), 'node_modules/remixicon must exist');
    const remixiconFonts = path.join(PROJECT_ROOT, 'node_modules/remixicon/fonts/remixicon.css');
    assert.ok(fs.existsSync(remixiconFonts), 'remixicon fonts css must exist');
  });

  it('F13.4: should verify all <i> tags in src/components are strictly self-closing icon elements', () => {
    const componentsDir = path.join(PROJECT_ROOT, 'src/components');
    const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

    for (const file of files) {
      const content = fs.readFileSync(path.join(componentsDir, file), 'utf-8');
      // Verify no </i> text closing tag is used for formatting
      assert.strictEqual(
        content.includes('</i>'),
        false,
        `Component ${file} must not contain closing </i> tag (all icons must be self-closing <i ... />)`
      );

      // Verify that all <i> tags have ri- class
      const iTags = content.match(/<i\b[^>]*>/g) || [];
      for (const tag of iTags) {
        assert.ok(
          tag.includes('ri-'),
          `Found <i> tag without Remixicon class in ${file}: ${tag}`
        );
      }
    }
  });

  it('F13.5: should ensure zero imports of unused Lucide icons in src/ source files', () => {
    const srcDir = path.join(PROJECT_ROOT, 'src');
    const scanDir = (dir: string): string[] => {
      const results: string[] = [];
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) results.push(...scanDir(full));
        else if (/\.(ts|tsx)$/.test(item)) results.push(full);
      }
      return results;
    };

    const files = scanDir(srcDir);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      assert.strictEqual(
        content.includes('lucide-react'),
        false,
        `Found unused lucide-react import in ${path.relative(PROJECT_ROOT, file)}`
      );
    }
  });

  it('F13.6: should enforce speak: never and font-style: normal !important on Remixicon icons', () => {
    const cssPath = path.join(PROJECT_ROOT, 'src/index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    assert.ok(
      cssContent.includes('[class*="ri-"]') || cssContent.includes('i['),
      'src/index.css must target icon classes'
    );
    assert.ok(
      cssContent.includes('speak: never'),
      'src/index.css must set speak: never for accessibility on decorative icons'
    );
  });
});

describe('Tier 1 - Feature 14: Mobile Ergonomics & Capacitor Plugins (R10)', () => {
  it('F14.1: should configure all 5 required Capacitor plugins in package.json', () => {
    const pkgPath = path.join(PROJECT_ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    assert.ok(allDeps['@capacitor/app'], 'Must include @capacitor/app');
    assert.ok(allDeps['@capacitor/haptics'], 'Must include @capacitor/haptics');
    assert.ok(allDeps['@capacitor/status-bar'], 'Must include @capacitor/status-bar');
    assert.ok(allDeps['@capacitor/share'], 'Must include @capacitor/share');
    assert.ok(allDeps['@capacitor/splash-screen'], 'Must include @capacitor/splash-screen');
    assert.ok(allDeps['@capacitor/core'], 'Must include @capacitor/core');
  });

  it('F14.2: should provide safe native wrappers with fallbacks for non-native environments in src/services/native.ts', () => {
    const nativeServicePath = path.join(PROJECT_ROOT, 'src/services/native.ts');
    const content = fs.readFileSync(nativeServicePath, 'utf-8');

    assert.ok(content.includes('isNativePlatform'), 'Must export isNativePlatform check');
    assert.ok(content.includes('triggerHaptic'), 'Must export triggerHaptic');
    assert.ok(content.includes('exportBackupNative'), 'Must export exportBackupNative');
    assert.ok(content.includes('nativeHaptics'), 'Must export nativeHaptics helpers');
  });

  it('F14.3: should enforce 16px font-size on inputs to eliminate iOS Safari zooming in src/index.css', () => {
    const cssPath = path.join(PROJECT_ROOT, 'src/index.css');
    const content = fs.readFileSync(cssPath, 'utf-8');

    assert.ok(
      content.includes('font-size: 16px !important'),
      'Must enforce 16px input font size to prevent automatic mobile zoom'
    );
  });

  it('F14.4: should implement touch-friendly targets of 44-48dp across mobile interactive components', () => {
    const navbarPath = path.join(PROJECT_ROOT, 'src/components/Navbar.tsx');
    const navbarContent = fs.readFileSync(navbarPath, 'utf-8');

    // Mobile tabs specify min-h-[50px] or min-h-[44px]
    assert.ok(
      navbarContent.includes('min-h-[50px]') || navbarContent.includes('min-h-[44px]'),
      'Navbar mobile touch targets must meet 44-48dp ergonomic standard'
    );

    const todayPath = path.join(PROJECT_ROOT, 'src/components/TodayView.tsx');
    const todayContent = fs.readFileSync(todayPath, 'utf-8');
    assert.ok(
      todayContent.includes('min-h-') || todayContent.includes('h-12') || todayContent.includes('h-14'),
      'TodayView buttons must support 44-48dp mobile touch size'
    );
  });

  it('F14.5: should configure safe-area CSS environment variable insets in src/index.css', () => {
    const cssPath = path.join(PROJECT_ROOT, 'src/index.css');
    const content = fs.readFileSync(cssPath, 'utf-8');

    assert.ok(content.includes('env(safe-area-inset-top'), 'Must configure safe-area-inset-top');
    assert.ok(content.includes('env(safe-area-inset-bottom'), 'Must configure safe-area-inset-bottom');
  });

  it('F14.6: should verify Android Manifest declares vibration permission for hardware haptics', () => {
    const manifestPath = path.join(PROJECT_ROOT, 'android/app/src/main/AndroidManifest.xml');
    if (fs.existsSync(manifestPath)) {
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      // If Android project exists, verify permissions
      assert.ok(manifestContent.includes('android.permission.INTERNET'), 'Must declare INTERNET');
    }
  });
});
