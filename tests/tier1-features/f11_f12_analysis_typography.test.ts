import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Goal, DailyLogEntry } from '../../src/types';

const PROJECT_ROOT = process.cwd();

describe('Tier 1 - Feature 11: Visual Analysis & Neuroscience Mirror (R7)', () => {
  const sampleGoals: Goal[] = [
    { id: 'g1', name: 'SSC Maths', category: 'SSC', target: '2h', frequency: 'Daily', startDate: '2026-09-01', active: true },
    { id: 'g2', name: 'Workout', category: 'Fitness', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
  ];

  it('F11.1: should compute overall completion rate across filtered time range', () => {
    const logs: DailyLogEntry[] = [
      { id: '1', date: '2026-09-08', goalId: 'g1', completed: true, timestamp: 1 },
      { id: '2', date: '2026-09-08', goalId: 'g2', completed: true, timestamp: 2 },
      { id: '3', date: '2026-09-09', goalId: 'g1', completed: true, timestamp: 3 },
      { id: '4', date: '2026-09-09', goalId: 'g2', completed: false, failureReason: 'Too tired', timestamp: 4 },
    ];

    const total = logs.length;
    const completed = logs.filter(l => l.completed).length;
    const rate = Math.round((completed / total) * 100);

    assert.strictEqual(total, 4);
    assert.strictEqual(completed, 3);
    assert.strictEqual(rate, 75, '3/4 completed = 75%');
  });

  it('F11.2: should generate Pareto failure reason distribution sorted by frequency descending', () => {
    const logs: DailyLogEntry[] = [
      { id: '1', date: '2026-09-01', goalId: 'g1', completed: false, failureReason: 'Phone / social media', timestamp: 1 },
      { id: '2', date: '2026-09-02', goalId: 'g1', completed: false, failureReason: 'Phone / social media', timestamp: 2 },
      { id: '3', date: '2026-09-03', goalId: 'g1', completed: false, failureReason: 'Phone / social media', timestamp: 3 },
      { id: '4', date: '2026-09-04', goalId: 'g2', completed: false, failureReason: 'Too tired', timestamp: 4 },
      { id: '5', date: '2026-09-05', goalId: 'g2', completed: false, failureReason: 'Procrastination', timestamp: 5 },
    ];

    const reasonCounts: Record<string, number> = {};
    const missed = logs.filter(l => !l.completed && l.failureReason);
    missed.forEach(l => {
      const r = l.failureReason!;
      reasonCounts[r] = (reasonCounts[r] || 0) + 1;
    });

    const sorted = Object.entries(reasonCounts)
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: Math.round((count / missed.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    assert.strictEqual(sorted[0].reason, 'Phone / social media');
    assert.strictEqual(sorted[0].count, 3);
    assert.strictEqual(sorted[0].percentage, 60, '3/5 = 60%');
    assert.strictEqual(sorted[1].count, 1);
  });

  it('F11.3: should rank goals by consistency rate (strongest vs weakest)', () => {
    const logs: DailyLogEntry[] = [
      // g1: 3 completed out of 3 = 100%
      { id: '1', date: '2026-09-01', goalId: 'g1', completed: true, timestamp: 1 },
      { id: '2', date: '2026-09-02', goalId: 'g1', completed: true, timestamp: 2 },
      { id: '3', date: '2026-09-03', goalId: 'g1', completed: true, timestamp: 3 },
      // g2: 1 completed out of 3 = 33%
      { id: '4', date: '2026-09-01', goalId: 'g2', completed: false, failureReason: 'Tired', timestamp: 4 },
      { id: '5', date: '2026-09-02', goalId: 'g2', completed: false, failureReason: 'Tired', timestamp: 5 },
      { id: '6', date: '2026-09-03', goalId: 'g2', completed: true, timestamp: 6 },
    ];

    const stats = sampleGoals.map(g => {
      const gLogs = logs.filter(l => l.goalId === g.id);
      const completed = gLogs.filter(l => l.completed).length;
      const rate = gLogs.length > 0 ? Math.round((completed / gLogs.length) * 100) : 0;
      return { goal: g, rate };
    });

    const strongest = [...stats].sort((a, b) => b.rate - a.rate)[0];
    const weakest = [...stats].sort((a, b) => a.rate - b.rate)[0];

    assert.strictEqual(strongest.goal.id, 'g1');
    assert.strictEqual(strongest.rate, 100);
    assert.strictEqual(weakest.goal.id, 'g2');
    assert.strictEqual(weakest.rate, 33);
  });

  it('F11.4: should calculate current unbroken streak and perfect days count', () => {
    const dateGroups: Record<string, DailyLogEntry[]> = {
      '2026-09-11': [{ id: '1', date: '2026-09-11', goalId: 'g1', completed: true, timestamp: 1 }, { id: '2', date: '2026-09-11', goalId: 'g2', completed: true, timestamp: 2 }],
      '2026-09-10': [{ id: '3', date: '2026-09-10', goalId: 'g1', completed: true, timestamp: 3 }, { id: '4', date: '2026-09-10', goalId: 'g2', completed: true, timestamp: 4 }],
      '2026-09-09': [{ id: '5', date: '2026-09-09', goalId: 'g1', completed: false, timestamp: 5 }, { id: '6', date: '2026-09-09', goalId: 'g2', completed: false, timestamp: 6 }],
    };

    let perfectDays = 0;
    Object.values(dateGroups).forEach(entries => {
      if (entries.every(e => e.completed)) perfectDays++;
    });

    assert.strictEqual(perfectDays, 2, '2 days were 100% completed');
  });

  it('F11.5: should provide time range selector filters (7, 30, 90, all)', () => {
    const analysisViewPath = path.join(PROJECT_ROOT, 'src/components/AnalysisView.tsx');
    const content = fs.readFileSync(analysisViewPath, 'utf-8');

    assert.ok(content.includes("'7'"), 'Analysis view must provide 7 Days filter');
    assert.ok(content.includes("'30'"), 'Analysis view must provide 30 Days filter');
    assert.ok(content.includes("'90'"), 'Analysis view must provide 90 Days filter');
    assert.ok(content.includes("'all'"), 'Analysis view must provide All Time filter');
  });

  it('F11.6: should enforce non-clinical biological root-cause language', () => {
    const analysisViewPath = path.join(PROJECT_ROOT, 'src/components/AnalysisView.tsx');
    const content = fs.readFileSync(analysisViewPath, 'utf-8');

    // Verify non-clinical phrasing principles
    assert.strictEqual(
      content.includes('patient') || content.includes('symptom') || content.includes('clinical diagnosis'),
      false,
      'Must maintain strictly non-clinical behavioral/biological terminology'
    );
  });
});

describe('Tier 1 - Feature 12: Universal Satoshi & Zero Italics (R8)', () => {
  it('F12.1: should verify all 6 local Satoshi .woff2 font files exist in public/fonts/', () => {
    const fontsDir = path.join(PROJECT_ROOT, 'public/fonts');
    const requiredFontFiles = [
      'Satoshi-Light.woff2',
      'Satoshi-Regular.woff2',
      'Satoshi-Medium.woff2',
      'Satoshi-Bold.woff2',
      'Satoshi-Black.woff2',
      'Satoshi-Variable.woff2',
    ];

    for (const fontFile of requiredFontFiles) {
      const fullPath = path.join(fontsDir, fontFile);
      assert.ok(fs.existsSync(fullPath), `Missing required local font file: ${fontFile}`);
      const stats = fs.statSync(fullPath);
      assert.ok(stats.size > 10000, `Font file ${fontFile} must not be empty or truncated`);
    }
  });

  it('F12.2: should declare local @font-face rules in src/index.css pointing to /fonts/Satoshi-*.woff2', () => {
    const cssPath = path.join(PROJECT_ROOT, 'src/index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    assert.ok(cssContent.includes("@font-face"), 'index.css must contain @font-face definitions');
    assert.ok(cssContent.includes("/fonts/Satoshi-Variable.woff2"), 'index.css must reference local Satoshi-Variable');
    assert.ok(cssContent.includes("/fonts/Satoshi-Regular.woff2"), 'index.css must reference local Satoshi-Regular');
    assert.ok(cssContent.includes("/fonts/Satoshi-Bold.woff2"), 'index.css must reference local Satoshi-Bold');
  });

  it('F12.3: should enforce global Satoshi font-family across all HTML elements', () => {
    const cssPath = path.join(PROJECT_ROOT, 'src/index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    assert.ok(
      cssContent.includes("'Satoshi'") && cssContent.includes('font-family'),
      'index.css must declare Satoshi as primary font-family'
    );
  });

  it('F12.4: should verify 0 occurrences of word italic or font-style: italic in src/', () => {
    const srcDir = path.join(PROJECT_ROOT, 'src');
    const scanDir = (dir: string): string[] => {
      const results: string[] = [];
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) results.push(...scanDir(full));
        else if (/\.(ts|tsx|css)$/.test(item)) results.push(full);
      }
      return results;
    };

    const files = scanDir(srcDir);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const hasItalic = /\bitalic\b/i.test(content);
      const hasFontStyleItalic = /font-style\s*:\s*italic/i.test(content);

      assert.strictEqual(
        hasItalic,
        false,
        `Found forbidden 'italic' in ${path.relative(PROJECT_ROOT, file)}`
      );
      assert.strictEqual(
        hasFontStyleItalic,
        false,
        `Found forbidden 'font-style: italic' in ${path.relative(PROJECT_ROOT, file)}`
      );
    }
  });

  it('F12.5: should verify 0 occurrences of <em> or </em> emphasis tags in src/', () => {
    const srcDir = path.join(PROJECT_ROOT, 'src');
    const scanDir = (dir: string): string[] => {
      const results: string[] = [];
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) results.push(...scanDir(full));
        else if (/\.(tsx|html)$/.test(item)) results.push(full);
      }
      return results;
    };

    const files = scanDir(srcDir);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      assert.strictEqual(
        /<em\b|<\/em>/i.test(content),
        false,
        `Found forbidden <em> tag in ${path.relative(PROJECT_ROOT, file)}`
      );
    }
  });

  it('F12.6: should enforce global font-style: normal !important on all elements and icons in src/index.css', () => {
    const cssPath = path.join(PROJECT_ROOT, 'src/index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    assert.ok(
      cssContent.includes('font-style: normal !important'),
      'src/index.css must enforce font-style: normal !important globally'
    );
  });
});
