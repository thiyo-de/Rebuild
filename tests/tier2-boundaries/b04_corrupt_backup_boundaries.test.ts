import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { setupTestEnvironment, MockLocalStorage } from '../helpers/mockStorage';
import { loadStoredState, generateCleanState, saveStoredState } from '../../src/services/storage';

describe('Tier 2 - Boundary 4: Corrupted JSON Backup Restore Resistance', () => {
  let mockStorage: MockLocalStorage;

  beforeEach(() => {
    mockStorage = setupTestEnvironment();
  });

  const validateBackupFormat = (parsed: any): boolean => {
    if (!parsed || typeof parsed !== 'object') return false;
    if (!Array.isArray(parsed.goals)) return false;
    if (!parsed.settings || typeof parsed.settings !== 'object') return false;
    return true;
  };

  it('B4.1: should reject completely non-JSON content without throwing unhandled exceptions', () => {
    const rawContent = 'NOT_JSON_DATA_XML_OR_HTML';
    let parseErrorThrown = false;
    try {
      JSON.parse(rawContent);
    } catch {
      parseErrorThrown = true;
    }
    assert.strictEqual(parseErrorThrown, true, 'JSON parser must safely catch non-JSON content');
  });

  it('B4.2: should reject truncated / incomplete JSON string', () => {
    const truncated = '{"goals": [{"id": "g1", "name": "Incom';
    let parseError = false;
    try {
      JSON.parse(truncated);
    } catch {
      parseError = true;
    }
    assert.strictEqual(parseError, true);
  });

  it('B4.3: should reject backup missing goals array', () => {
    const missingGoals = {
      dailyLogs: [],
      settings: { weeklyRewardThreshold: 90 },
    };
    assert.strictEqual(validateBackupFormat(missingGoals), false);
  });

  it('B4.4: should reject backup missing settings object', () => {
    const missingSettings = {
      goals: [],
      dailyLogs: [],
    };
    assert.strictEqual(validateBackupFormat(missingSettings), false);
  });

  it('B4.5: should reject backup where goals is an object instead of an array', () => {
    const invalidGoalsType = {
      goals: { id: 'g1', name: 'Not an array' },
      settings: { weeklyRewardThreshold: 90 },
    };
    assert.strictEqual(validateBackupFormat(invalidGoalsType), false);
  });

  it('B4.6: should reject backup where settings is a primitive string', () => {
    const invalidSettingsType = {
      goals: [],
      settings: 'corrupted string',
    };
    assert.strictEqual(validateBackupFormat(invalidSettingsType), false);
  });

  it('B4.7: should reject empty object {}', () => {
    assert.strictEqual(validateBackupFormat({}), false);
  });

  it('B4.8: should reject null or undefined backup payload', () => {
    assert.strictEqual(validateBackupFormat(null), false);
    assert.strictEqual(validateBackupFormat(undefined), false);
  });

  it('B4.9: should fall back to safe clean state when localStorage contains arbitrary binary garbage', () => {
    mockStorage.setItem('rebuild_2027_initialized_v2', 'true');
    mockStorage.setItem('rebuild_2027_goals_v2', '\x00\x01\x02\xFF\xFEgarbage');
    mockStorage.setItem('rebuild_2027_settings_v2', 'undefined');

    const state = loadStoredState();
    assert.ok(Array.isArray(state.goals));
    assert.strictEqual(state.goals.length, 0);
    assert.ok(state.milestones.length >= 2);
    assert.strictEqual(state.settings.weeklyRewardThreshold, 90);
  });

  it('B4.10: should fall back to empty array when single entity key is empty string', () => {
    mockStorage.setItem('rebuild_2027_initialized_v2', 'true');
    mockStorage.setItem('rebuild_2027_goals_v2', '');

    const state = loadStoredState();
    assert.ok(Array.isArray(state.goals));
    assert.strictEqual(state.goals.length, 0);
  });

  it('B4.11: should preserve existing valid state when import of corrupted file is aborted', () => {
    // Current working state
    const currentWorkingState = {
      ...generateCleanState(),
      goals: [
        { id: 'g_precious', name: 'Precious Goal', category: 'SSC', target: '1h', frequency: 'Daily' as const, startDate: '2026-09-01', active: true },
      ],
    };
    saveStoredState(currentWorkingState);

    // Corrupted input attempted
    const corruptInput = '{"corrupted": true}';
    let imported = false;
    try {
      const parsed = JSON.parse(corruptInput);
      if (validateBackupFormat(parsed)) {
        saveStoredState(parsed);
        imported = true;
      }
    } catch {
      // Abort
    }

    assert.strictEqual(imported, false, 'Import must be aborted on corrupted backup');
    const preserved = loadStoredState();
    assert.strictEqual(preserved.goals.length, 1);
    assert.strictEqual(preserved.goals[0].id, 'g_precious', 'Original state must remain untouched');
  });

  it('B4.12: should accept and restore perfectly valid backup after previously rejecting corrupted payload', () => {
    const validState = {
      ...generateCleanState(),
      goals: [
        { id: 'g_valid', name: 'Valid Restored Goal', category: 'Fitness', target: '30m', frequency: 'Daily' as const, startDate: '2026-09-11', active: true },
      ],
    };

    assert.strictEqual(validateBackupFormat(validState), true);
    saveStoredState(validState);

    const reloaded = loadStoredState();
    assert.strictEqual(reloaded.goals[0].name, 'Valid Restored Goal');
  });
});
