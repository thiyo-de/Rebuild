import { describe, it } from 'node:test';
import assert from 'node:assert';
import { setupTestEnvironment } from './helpers/mockStorage';

describe('Test Environment Health & Runner Verification', () => {
  it('should verify Node test runner operates with TypeScript imports', () => {
    assert.strictEqual(typeof describe, 'function');
    assert.strictEqual(typeof it, 'function');
  });

  it('should initialize and isolate in-memory MockLocalStorage', () => {
    const storage = setupTestEnvironment();
    storage.setItem('rebuild_test_key', 'pass');
    assert.strictEqual(storage.getItem('rebuild_test_key'), 'pass');
    storage.clear();
    assert.strictEqual(storage.getItem('rebuild_test_key'), null);
  });
});
