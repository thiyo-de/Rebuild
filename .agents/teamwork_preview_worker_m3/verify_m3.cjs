const fs = require('fs');
const path = require('path');
const assert = require('assert');

const projectRoot = path.resolve(__dirname, '../../');
const navbarPath = path.join(projectRoot, 'src/components/Navbar.tsx');
const appPath = path.join(projectRoot, 'src/App.tsx');

console.log('Running Milestone 3 Verification...\n');

const navbarContent = fs.readFileSync(navbarPath, 'utf-8');
const appContent = fs.readFileSync(appPath, 'utf-8');

let passed = 0;
let total = 0;

function check(desc, fn) {
  total++;
  try {
    fn();
    console.log(`✅ [PASS] ${desc}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${desc}: ${err.message}`);
  }
}

// 1. Bottom navigation 4 primary tabs
check('1.1: 4 main navigation buttons present with exact icons and labels', () => {
  assert.ok(navbarContent.includes('id="mobile-tab-today"'), 'Missing mobile-tab-today');
  assert.ok(navbarContent.includes('ri-checkbox-line'), 'Missing ri-checkbox-line');
  assert.ok(navbarContent.includes('>Today</span>'), 'Missing Today label');

  assert.ok(navbarContent.includes('id="mobile-tab-goals"'), 'Missing mobile-tab-goals');
  assert.ok(navbarContent.includes('ri-focus-3-line'), 'Missing ri-focus-3-line');
  assert.ok(navbarContent.includes('>Goals</span>'), 'Missing Goals label');

  assert.ok(navbarContent.includes('id="mobile-tab-weekly"'), 'Missing mobile-tab-weekly');
  assert.ok(navbarContent.includes('ri-trophy-line'), 'Missing ri-trophy-line');
  assert.ok(navbarContent.includes('>Weekly</span>'), 'Missing Weekly label');

  assert.ok(navbarContent.includes('id="mobile-tab-analysis"'), 'Missing mobile-tab-analysis');
  assert.ok(navbarContent.includes('ri-bar-chart-2-line'), 'Missing ri-bar-chart-2-line');
  assert.ok(navbarContent.includes('>Analysis</span>'), 'Missing Analysis label');
});

// 1.2: Analysis renamed from Stats on both mobile and desktop
check('1.2: Stats renamed to Analysis across navigation', () => {
  assert.ok(!navbarContent.includes('>Stats</span>'), 'Stats text label must not exist');
  assert.ok(navbarContent.includes('ANALYSIS'), 'Desktop nav must feature ANALYSIS');
  assert.ok(navbarContent.includes('aria-label="Analysis"'), 'Aria label must be Analysis');
});

// 1.3: 5th item is strictly icon-only More button
check('1.3: 5th item More trigger is strictly ICON-ONLY with NO text label', () => {
  assert.ok(navbarContent.includes('id="mobile-tab-more"'), 'Missing mobile-tab-more');
  assert.ok(
    navbarContent.includes('ri-more-fill') || navbarContent.includes('ri-apps-2-line'),
    'Must use ri-more-fill or ri-apps-2-line'
  );
  
  const moreBtnIdx = navbarContent.indexOf('id="mobile-tab-more"');
  assert.ok(moreBtnIdx !== -1, 'Could not find mobile-tab-more index');
  const openTagEnd = navbarContent.indexOf('>', navbarContent.indexOf('className=', moreBtnIdx));
  const closeTagStart = navbarContent.indexOf('</button>', openTagEnd);
  const inner = navbarContent.substring(openTagEnd + 1, closeTagStart).trim();

  assert.ok(!inner.includes('<span'), 'More button must not contain span element');
  assert.ok(!inner.includes('More'), 'More button must not render More text');
  assert.ok(!inner.includes('getSecondaryLabel'), 'More button must not render dynamic text');
  assert.ok(inner.startsWith('<i') && inner.endsWith('/>'), 'More button must only contain icon element');
  assert.strictEqual(inner, '<i className="ri-more-fill text-2xl shrink-0" />', 'Must render icon-only');
});

// 1.4: Compact popover anchored directly above nav bar
check('1.4: Compact relative popover anchored directly above bottom nav bar (not full drawer)', () => {
  assert.ok(!navbarContent.includes('rounded-t-3xl'), 'Must not render bottom sheet drawer container');
  assert.ok(!navbarContent.includes('w-12 h-1.5 rounded-full bg-slate-700'), 'Must not render drawer drag handle');
  assert.ok(navbarContent.includes('absolute bottom-[calc(100%+'), 'Must anchor directly above bottom nav');
  assert.ok(navbarContent.includes('w-60'), 'Must be compact popover w-60');
});

// 1.5: Popover contains ONLY Monthly Review and 2027 Milestones (Settings removed)
check('1.5: Popover contains ONLY Monthly Review and 2027 Milestones (no Settings)', () => {
  assert.ok(navbarContent.includes('id="popover-tab-monthly"'), 'Missing popover-tab-monthly');
  assert.ok(navbarContent.includes('ri-calendar-event-line'), 'Missing ri-calendar-event-line');
  assert.ok(navbarContent.includes('Monthly Review'), 'Missing Monthly Review');

  assert.ok(navbarContent.includes('id="popover-tab-milestones"'), 'Missing popover-tab-milestones');
  assert.ok(navbarContent.includes('ri-flag-line'), 'Missing ri-flag-line');
  assert.ok(navbarContent.includes('2027 Milestones'), 'Missing 2027 Milestones');

  // Check popover block specifically
  const popoverMatch = navbarContent.match(/ref=\{mobileMorePopoverRef\}[\s\S]*?<\/div>\s*<\/div>/);
  assert.ok(popoverMatch, 'Could not extract mobileMorePopoverRef block');
  const popoverContent = popoverMatch[0];
  assert.ok(!popoverContent.includes('settings'), 'Popover must NOT contain settings');
  assert.ok(!popoverContent.includes('Settings & Data Backup'), 'Popover must NOT contain Settings & Data Backup');
});

// 1.6: Clicking outside and hardware back button closes popover
check('1.6: Dismiss handlers for click-outside and hardware back button', () => {
  assert.ok(navbarContent.includes('handleClickOutside'), 'Missing handleClickOutside handler');
  assert.ok(navbarContent.includes('mobileMorePopoverRef.current?.contains'), 'Missing popover click-outside check');
  assert.ok(navbarContent.includes('__REBUILD_BACK_STACK__'), 'Missing back stack handler');
});

// 2.1: Global header Settings icon across ALL screens on mobile & desktop
check('2.1: Dedicated Settings button in top-right header corner across mobile & desktop', () => {
  assert.ok(navbarContent.includes('id="header-settings-btn"'), 'Missing header-settings-btn');
  assert.ok(navbarContent.includes('ri-settings-3-line'), 'Missing ri-settings-3-line');
  assert.ok(navbarContent.includes("handleSelectTab('settings')"), 'Clicking must select settings tab');
  // Confirm it is NOT hidden on md or mobile
  const settingsBtnMatch = navbarContent.match(/<button[^>]*id="header-settings-btn"[^>]*>/);
  assert.ok(settingsBtnMatch, 'Could not find header-settings-btn');
  assert.ok(!settingsBtnMatch[0].includes('hidden'), 'Header settings button must not have hidden class');
});

// 3.1: Ergonomic touch targets (>=44x44px)
check('3.1: All touch targets meet >=44x44px standard', () => {
  assert.ok(navbarContent.includes('min-h-[44px]'), 'Must include min-h-[44px]');
  assert.ok(navbarContent.includes('min-h-[48px]'), 'Must include min-h-[48px]');
  assert.ok(navbarContent.includes('min-w-[44px]'), 'Must include min-w-[44px]');
});

// 3.2: Universal Satoshi typography & 0 italics
check('3.2: Universal Satoshi typography and 0 italics', () => {
  assert.ok(!navbarContent.includes('italic'), 'Navbar must not contain italic CSS classes');
  // Check for <i> tags that are NOT remixicon
  const nonIconI = navbarContent.match(/<i(?!\s+className=["{]ri-|\s+className={`ri-)/g);
  assert.strictEqual(nonIconI, null, 'All <i> tags must be Remixicon icon elements');
});

console.log(`\nResults: ${passed}/${total} checks passed.`);
if (passed !== total) {
  process.exit(1);
} else {
  console.log('🎉 All Milestone 3 checks passed successfully!');
}
