const assert = require('assert');

console.log('=== Verifying Back Stack & Modal Dismissal Simulation ===\n');

// Mock window and document environment
global.window = {};
global.document = {
  elements: [],
  querySelectorAll(selector) {
    return this.elements;
  }
};

let exited = false;
let activeTab = 'settings';

const CapApp = {
  exitApp: () => {
    exited = true;
  }
};

// Simulation of App.tsx logic
const dismissActiveModalOrSheet = () => {
  const win = global.window;
  if (win.__REBUILD_BACK_STACK__ && win.__REBUILD_BACK_STACK__.length > 0) {
    const handler = win.__REBUILD_BACK_STACK__.pop();
    if (handler && handler()) {
      return true;
    }
  }

  const modalOverlays = global.document.querySelectorAll('.fixed.inset-0.z-50');
  if (modalOverlays.length > 0) {
    const topModal = modalOverlays[modalOverlays.length - 1];
    if (topModal.closeBtn) {
      topModal.closeBtn.clicked = true;
      return true;
    }
  }

  return false;
};

const handleHardwareBack = () => {
  if (dismissActiveModalOrSheet()) {
    return;
  }

  if (activeTab !== 'today') {
    activeTab = 'today';
    return;
  }

  CapApp.exitApp();
};

// Test 1: Programmatic back stack dismisses first
let modal1Dismissed = false;
global.window.__REBUILD_BACK_STACK__ = [() => { modal1Dismissed = true; return true; }];
handleHardwareBack();
assert.strictEqual(modal1Dismissed, true, 'Top modal handler should be invoked');
assert.strictEqual(activeTab, 'settings', 'Active tab should remain settings while modal is open');
assert.strictEqual(exited, false, 'App should not exit when modal is dismissed');
console.log('  [PASS] Test 1: Programmatic modal dismissal prioritizes modal over tab change and exit');

// Test 2: DOM-based modal dismissal when no programmatic handler
let domBtnClicked = false;
global.document.elements = [{
  closeBtn: {
    clicked: false
  }
}];
handleHardwareBack();
assert.strictEqual(global.document.elements[0].closeBtn.clicked, true, 'DOM close button clicked');
assert.strictEqual(activeTab, 'settings', 'Active tab should remain settings');
assert.strictEqual(exited, false, 'App should not exit');
console.log('  [PASS] Test 2: DOM fallback modal dismissal works cleanly');

// Test 3: Tab navigation when no modals are open
global.document.elements = [];
handleHardwareBack();
assert.strictEqual(activeTab, 'today', 'Should navigate back to today tab');
assert.strictEqual(exited, false, 'App should not exit on secondary tab');
console.log('  [PASS] Test 3: When no modal open, navigates secondary tab to today tab');

// Test 4: Exit app when on today tab and no modal open
handleHardwareBack();
assert.strictEqual(activeTab, 'today', 'Tab stays today');
assert.strictEqual(exited, true, 'Should exit app when on today tab');
console.log('  [PASS] Test 4: When on today tab and no modal open, calls exitApp()');

console.log('\n=== ALL BEHAVIORAL SIMULATION TESTS PASSED ===');
