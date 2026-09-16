const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== Verifying Milestone 2 (Mobile Ergonomics & Android Integration) ===\n');

const projectRoot = path.resolve(__dirname, '..', '..');

// 1. Android Vibration Permission
console.log('1. Checking AndroidManifest.xml vibration permission...');
const manifestPath = path.join(projectRoot, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
const manifestContent = fs.readFileSync(manifestPath, 'utf8');
assert(manifestContent.includes('<uses-permission android:name="android.permission.VIBRATE" />'), 'Missing VIBRATE permission in AndroidManifest.xml');
console.log('  [PASS] android.permission.VIBRATE is present in AndroidManifest.xml');

// 2. Screen Padding & Ergonomics
console.log('2. Checking screen padding in src/App.tsx...');
const appPath = path.join(projectRoot, 'src', 'App.tsx');
const appContent = fs.readFileSync(appPath, 'utf8');
assert(appContent.includes('px-4 sm:px-6 lg:px-8'), 'Missing px-4 screen padding on main container in App.tsx');
assert(!appContent.includes('px-3 sm:px-6 lg:px-8'), 'Found stale px-3 screen padding on main container in App.tsx');
assert(appContent.includes('safe-area-inset-bottom'), 'Safe area insets must be preserved in App.tsx');
console.log('  [PASS] Screen padding is updated to 16px (px-4) with safe-area insets preserved');

// 3. Modal-Aware Hardware Back Button
console.log('3. Checking modal-aware hardware back button in src/App.tsx...');
assert(appContent.includes('dismissActiveModalOrSheet'), 'App.tsx must define modal dismissal helper');
assert(appContent.includes('__REBUILD_BACK_STACK__'), 'App.tsx must reference global modal back stack');
assert(appContent.includes("CapApp.addListener('backButton'"), 'App.tsx must register CapApp backButton listener');
assert(appContent.includes("setActiveTab((prev) => {"), 'App.tsx must handle activeTab navigation');
assert(appContent.includes("CapApp.exitApp()"), 'App.tsx must call exitApp when on today tab and no modal open');
console.log('  [PASS] Modal-aware hardware back button logic implemented in App.tsx');

// 4. Touch Target Sizes in Navbar.tsx
console.log('4. Checking touch targets in src/components/Navbar.tsx...');
const navbarPath = path.join(projectRoot, 'src', 'components', 'Navbar.tsx');
const navbarContent = fs.readFileSync(navbarPath, 'utf8');

// Top-right settings header button: line 243 area
assert(navbarContent.includes('min-w-[44px] min-h-[44px] w-11 h-11') || navbarContent.includes('min-w-[44px] min-h-[44px]'), 'Settings button must have min-w-[44px] min-h-[44px]');
assert(navbarContent.includes('aria-label="Settings"'), 'Settings button aria-label preserved');

// Bottom nav buttons
const bottomNavMatches = (navbarContent.match(/min-w-\[44px\] min-h-\[48px\]/g) || []).length;
assert(bottomNavMatches >= 5, `Expected at least 5 bottom nav buttons with min-w-[44px] min-h-[48px], found ${bottomNavMatches}`);
console.log(`  [PASS] Navbar Settings button and ${bottomNavMatches} bottom nav buttons meet 44-48dp touch targets`);

// 5. Touch Target Sizes in ConfirmationModal.tsx
console.log('5. Checking touch targets in src/components/ConfirmationModal.tsx...');
const modalPath = path.join(projectRoot, 'src', 'components', 'ConfirmationModal.tsx');
const modalContent = fs.readFileSync(modalPath, 'utf8');

assert(modalContent.includes('min-w-[44px] min-h-[44px] w-11 h-11'), 'Close button in ConfirmationModal must have min-w-[44px] min-h-[44px]');
assert(modalContent.includes('min-h-[48px] min-w-[48px]'), 'Action buttons in ConfirmationModal must have min-h-[48px] min-w-[48px]');
assert(modalContent.includes('__REBUILD_BACK_STACK__'), 'ConfirmationModal must register with back stack');
console.log('  [PASS] ConfirmationModal close and action buttons meet 44-48dp touch targets and back stack registration');

// 6. Base Input Typography
console.log('6. Checking base input typography (16px)...');
const cssPath = path.join(projectRoot, 'src', 'index.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');
assert(cssContent.includes('input, select, textarea') && cssContent.includes('font-size: 16px !important'), 'index.css must enforce 16px base font size for inputs to prevent auto-zoom');
console.log('  [PASS] 16px base input typography enforced');

console.log('\n=== ALL MILESTONE 2 CHECKS PASSED SUCCESSFULLY ===');
