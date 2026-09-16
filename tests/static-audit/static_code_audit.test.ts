import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';

const PROJECT_ROOT = process.cwd();

// Helper to recursively collect all source files (excluding node_modules, dist, .git, .agents)
function getSourceFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git', '.agents', 'coverage', 'android'].includes(entry.name)) {
        continue;
      }
      results.push(...getSourceFiles(fullPath));
    } else if (/\.(ts|tsx|css|html)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('Static Integrity Audit: Zero Italics & Local Typography Assets', () => {
  const sourceFiles = getSourceFiles(PROJECT_ROOT);

  it('Audit 1: should verify 0 occurrences of word "italic" across all source files', () => {
    const violations: { file: string; line: number; match: string }[] = [];

    for (const file of sourceFiles) {
      // Allow the test itself to refer to the rule
      if (file.includes('static_code_audit.test.ts') || file.includes('f11_f12_analysis_typography.test.ts') || file.includes('b06_typography_icons_boundaries.test.ts')) {
        continue;
      }

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        if (/\bitalic\b/i.test(line)) {
          violations.push({
            file: path.relative(PROJECT_ROOT, file),
            line: idx + 1,
            match: line.trim(),
          });
        }
      });
    }

    assert.strictEqual(
      violations.length,
      0,
      `Detected ${violations.length} forbidden 'italic' occurrences:\n${violations.map(v => `  ${v.file}:${v.line} -> ${v.match}`).join('\n')}`
    );
  });

  it('Audit 2: should verify 0 occurrences of "font-style: italic" across all source files', () => {
    const violations: { file: string; line: number; match: string }[] = [];

    for (const file of sourceFiles) {
      if (file.includes('static_code_audit.test.ts') || file.includes('f11_f12_analysis_typography.test.ts') || file.includes('b06_typography_icons_boundaries.test.ts')) {
        continue;
      }

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        if (/font-style\s*:\s*italic\b/i.test(line)) {
          violations.push({
            file: path.relative(PROJECT_ROOT, file),
            line: idx + 1,
            match: line.trim(),
          });
        }
      });
    }

    assert.strictEqual(
      violations.length,
      0,
      `Detected ${violations.length} forbidden 'font-style: italic' rules:\n${violations.map(v => `  ${v.file}:${v.line} -> ${v.match}`).join('\n')}`
    );
  });

  it('Audit 3: should verify 0 occurrences of <em> or </em> emphasis tags across all source files', () => {
    const violations: { file: string; line: number; match: string }[] = [];

    for (const file of sourceFiles) {
      if (file.includes('static_code_audit.test.ts') || file.includes('f11_f12_analysis_typography.test.ts') || file.includes('b06_typography_icons_boundaries.test.ts')) {
        continue;
      }

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        if (/<em\b|<\/em>/i.test(line)) {
          violations.push({
            file: path.relative(PROJECT_ROOT, file),
            line: idx + 1,
            match: line.trim(),
          });
        }
      });
    }

    assert.strictEqual(
      violations.length,
      0,
      `Detected ${violations.length} forbidden <em> tags:\n${violations.map(v => `  ${v.file}:${v.line} -> ${v.match}`).join('\n')}`
    );
  });

  it('Audit 4: should verify 0 occurrences of closing </i> tags in JSX (all icons must be self-closing)', () => {
    const violations: { file: string; line: number; match: string }[] = [];

    for (const file of sourceFiles) {
      if (!file.endsWith('.tsx')) continue;
      if (file.includes('static_code_audit.test.ts') || file.includes('f13_f14_remixicon_capacitor.test.ts')) {
        continue;
      }

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        if (line.includes('</i>')) {
          violations.push({
            file: path.relative(PROJECT_ROOT, file),
            line: idx + 1,
            match: line.trim(),
          });
        }
      });
    }

    assert.strictEqual(
      violations.length,
      0,
      `Detected ${violations.length} closing </i> tags:\n${violations.map(v => `  ${v.file}:${v.line} -> ${v.match}`).join('\n')}`
    );
  });

  it('Audit 5: should verify all 6 local Satoshi font files exist in public/fonts/ and are valid', () => {
    const fontsDir = path.join(PROJECT_ROOT, 'public/fonts');
    assert.ok(fs.existsSync(fontsDir), 'Directory public/fonts must exist');

    const expectedFonts = [
      'Satoshi-Light.woff2',
      'Satoshi-Regular.woff2',
      'Satoshi-Medium.woff2',
      'Satoshi-Bold.woff2',
      'Satoshi-Black.woff2',
      'Satoshi-Variable.woff2',
    ];

    for (const fontName of expectedFonts) {
      const fontPath = path.join(fontsDir, fontName);
      assert.ok(fs.existsSync(fontPath), `Font file public/fonts/${fontName} must exist`);
      const stat = fs.statSync(fontPath);
      assert.ok(stat.size > 10000, `Font file ${fontName} must be non-empty (>10KB)`);

      // Verify WOFF2 header magic bytes 'wOF2'
      const buf = fs.readFileSync(fontPath);
      const magic = buf.subarray(0, 4).toString('ascii');
      assert.strictEqual(magic, 'wOF2', `Font file ${fontName} must have valid wOF2 header`);
    }
  });

  it('Audit 6: should verify src/index.css configures local @font-face rules without CDN dependencies', () => {
    const cssPath = path.join(PROJECT_ROOT, 'src/index.css');
    const content = fs.readFileSync(cssPath, 'utf-8');

    assert.ok(content.includes('@font-face'), 'src/index.css must configure @font-face');
    assert.ok(content.includes('/fonts/Satoshi-Variable.woff2'), 'src/index.css must reference Satoshi-Variable.woff2');
    assert.ok(content.includes('/fonts/Satoshi-Regular.woff2'), 'src/index.css must reference Satoshi-Regular.woff2');
    assert.ok(content.includes("font-family: 'Satoshi'"), "src/index.css must declare font-family 'Satoshi'");
    assert.strictEqual(content.includes('api.fontshare.com'), false, 'src/index.css must NOT reference Fontshare CDN');
  });

  it('Audit 7: should verify index.html contains 0 remote font/icon CDN links', () => {
    const indexPath = path.join(PROJECT_ROOT, 'index.html');
    const content = fs.readFileSync(indexPath, 'utf-8');

    assert.strictEqual(content.includes('api.fontshare.com'), false, 'index.html must NOT reference Fontshare');
    assert.strictEqual(content.includes('fonts.googleapis.com'), false, 'index.html must NOT reference Google Fonts');
    assert.strictEqual(content.includes('fonts.gstatic.com'), false, 'index.html must NOT reference Google GStatic');
    assert.strictEqual(content.includes('cdn.jsdelivr.net'), false, 'index.html must NOT reference jsDelivr');
  });

  it('Audit 8: should verify 0 obsolete cloud sync files exist in repository', () => {
    const obsoleteFiles = [
      'src/services/googleSheets.ts',
      'src/services/googleCalendar.ts',
      'src/services/auth.ts',
      'src/components/GoogleSyncModal.tsx',
      'firebase-applet-config.json',
    ];

    for (const f of obsoleteFiles) {
      assert.strictEqual(
        fs.existsSync(path.join(PROJECT_ROOT, f)),
        false,
        `Obsolete cloud file must not exist: ${f}`
      );
    }
  });
});
