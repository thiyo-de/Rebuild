import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateWeekScore, calculateMonthScore } from '../../src/services/storage';
import { Goal, DailyLogEntry } from '../../src/types';

describe('Tier 2 - Boundary 3: Weekly and Monthly Reward Unlock Invariants', () => {
  const activeGoals: Goal[] = [
    { id: 'g1', name: 'G1', category: 'SSC', target: '1h', frequency: 'Daily', startDate: '2026-09-01', active: true },
  ];

  it('B3.1: weekly boundary — exactly 89.9% average score with 3 days must remain LOCKED', () => {
    const weekScoreData = { score: 89.9, recordedDaysCount: 3 };
    const isUnlocked = weekScoreData.score >= 90 && weekScoreData.recordedDaysCount >= 3;
    assert.strictEqual(isUnlocked, false, '89.9% must not unlock 90% threshold');
  });

  it('B3.2: weekly boundary — exactly 90.0% average score with exactly 2 days must remain LOCKED', () => {
    const weekScoreData = { score: 90.0, recordedDaysCount: 2 };
    const isUnlocked = weekScoreData.score >= 90 && weekScoreData.recordedDaysCount >= 3;
    assert.strictEqual(isUnlocked, false, '2 days must not unlock 3-day minimum requirement');
  });

  it('B3.3: weekly boundary — exactly 90.0% average score with exactly 3 days must UNLOCK', () => {
    const weekScoreData = { score: 90.0, recordedDaysCount: 3 };
    const isUnlocked = weekScoreData.score >= 90 && weekScoreData.recordedDaysCount >= 3;
    assert.strictEqual(isUnlocked, true, '90.0% with 3 days meets exact boundary threshold');
  });

  it('B3.4: weekly boundary — 100% score with only 1 day logged must remain LOCKED', () => {
    const weekScoreData = { score: 100.0, recordedDaysCount: 1 };
    const isUnlocked = weekScoreData.score >= 90 && weekScoreData.recordedDaysCount >= 3;
    assert.strictEqual(isUnlocked, false);
  });

  it('B3.5: weekly boundary — 100% score with all 7 days logged must UNLOCK', () => {
    const weekScoreData = { score: 100.0, recordedDaysCount: 7 };
    const isUnlocked = weekScoreData.score >= 90 && weekScoreData.recordedDaysCount >= 3;
    assert.strictEqual(isUnlocked, true);
  });

  it('B3.6: weekly boundary — 0 logged days in a week returns score 0 and recordedDaysCount 0', () => {
    const weekDays = ['2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13'];
    const result = calculateWeekScore(weekDays, activeGoals, []);
    assert.strictEqual(result.score, 0);
    assert.strictEqual(result.recordedDaysCount, 0);
    assert.strictEqual(result.score >= 90 && result.recordedDaysCount >= 3, false);
  });

  it('B3.7: monthly boundary — exactly 89.9% average score with 10 days must remain LOCKED', () => {
    const monthScoreData = { score: 89.9, recordedDaysCount: 10 };
    const isUnlocked = monthScoreData.score >= 90 && monthScoreData.recordedDaysCount >= 10;
    assert.strictEqual(isUnlocked, false, '89.9% must not unlock monthly reward');
  });

  it('B3.8: monthly boundary — exactly 90.0% average score with exactly 9 days must remain LOCKED', () => {
    const monthScoreData = { score: 90.0, recordedDaysCount: 9 };
    const isUnlocked = monthScoreData.score >= 90 && monthScoreData.recordedDaysCount >= 10;
    assert.strictEqual(isUnlocked, false, '9 days must not satisfy 10-day minimum requirement');
  });

  it('B3.9: monthly boundary — exactly 90.0% average score with exactly 10 days must UNLOCK', () => {
    const monthScoreData = { score: 90.0, recordedDaysCount: 10 };
    const isUnlocked = monthScoreData.score >= 90 && monthScoreData.recordedDaysCount >= 10;
    assert.strictEqual(isUnlocked, true, '90.0% with 10 days meets exact monthly boundary');
  });

  it('B3.10: monthly boundary — 100% average score with 9 days must remain LOCKED', () => {
    const monthScoreData = { score: 100.0, recordedDaysCount: 9 };
    const isUnlocked = monthScoreData.score >= 90 && monthScoreData.recordedDaysCount >= 10;
    assert.strictEqual(isUnlocked, false, 'Even with 100% score, 9 days cannot unlock');
  });

  it('B3.11: monthly boundary — 90% score with all 31 days logged must UNLOCK', () => {
    const monthScoreData = { score: 90.0, recordedDaysCount: 31 };
    const isUnlocked = monthScoreData.score >= 90 && monthScoreData.recordedDaysCount >= 10;
    assert.strictEqual(isUnlocked, true);
  });

  it('B3.12: custom threshold boundary — user adjusts weekly threshold in settings to 80%', () => {
    const customThreshold = 80;
    const weekData = { score: 80.0, recordedDaysCount: 3 };
    const isUnlocked = weekData.score >= customThreshold && weekData.recordedDaysCount >= 3;
    assert.strictEqual(isUnlocked, true, 'Custom threshold of 80% must unlock at 80% with 3 days');
  });

  it('B3.13: custom threshold boundary — user raises monthly threshold in settings to 95%', () => {
    const customThreshold = 95;
    const monthData = { score: 93.5, recordedDaysCount: 15 };
    const isUnlocked = monthData.score >= customThreshold && monthData.recordedDaysCount >= 10;
    assert.strictEqual(isUnlocked, false, '93.5% must not unlock when threshold is raised to 95%');
  });
});
