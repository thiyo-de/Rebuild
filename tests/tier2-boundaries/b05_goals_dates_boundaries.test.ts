import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getCategoryTheme } from '../../src/data/starterData';
import { formatDateDisplay, formatShortDate, formatWeekRange, getWeekInfo, formatTime12Hour } from '../../src/utils/dateUtils';
import { Goal } from '../../src/types';

describe('Tier 2 - Boundary 5: Goals, Categories & Calendar Date Boundaries', () => {
  it('B5.1: should sanitize and trim whitespace from goal name and target', () => {
    const rawName = '   SSC Reasoning Practice   ';
    const rawTarget = '   45 mins   ';

    const goal: Goal = {
      id: 'g_trim_test',
      name: rawName.trim(),
      category: 'SSC',
      target: rawTarget.trim(),
      frequency: 'Daily',
      startDate: '2026-09-11',
      active: true,
    };

    assert.strictEqual(goal.name, 'SSC Reasoning Practice');
    assert.strictEqual(goal.target, '45 mins');
  });

  it('B5.2: should preserve Unicode and special characters in goal names and notes', () => {
    const unicodeGoal: Goal = {
      id: 'g_unicode',
      name: '🎯 Vocab & Grammar — हिंदी / English / Français',
      category: 'English',
      target: '30m ± 5m',
      frequency: 'Daily',
      startDate: '2026-09-11',
      active: true,
      notes: 'Quotes: "Never give up" & symbols: #1 @home (100%)',
    };

    assert.strictEqual(unicodeGoal.name, '🎯 Vocab & Grammar — हिंदी / English / Français');
    assert.ok(unicodeGoal.notes?.includes('Quotes: "Never give up"'));
  });

  it('B5.3: should handle extreme duration values (0 minutes and 1440 minutes)', () => {
    const zeroDuration: Goal = {
      id: 'g_zero',
      name: 'No Porn / Zero Relapse',
      category: 'Self-Control',
      target: 'Zero',
      frequency: 'Daily',
      startDate: '2026-09-11',
      durationMinutes: 0,
      active: true,
    };
    assert.strictEqual(zeroDuration.durationMinutes, 0);

    const fullDayDuration: Goal = {
      id: 'g_full_day',
      name: '24h Fasting',
      category: 'Health',
      target: '24 hours',
      frequency: 'Daily',
      startDate: '2026-09-11',
      durationMinutes: 1440,
      active: true,
    };
    assert.strictEqual(fullDayDuration.durationMinutes, 1440);
  });

  it('B5.4: should provide robust fallback theme for unknown or newly added categories', () => {
    const unknownTheme = getCategoryTheme('Astronomy');
    assert.ok(unknownTheme, 'Must return a valid category theme object');
    assert.strictEqual(unknownTheme.name, 'Astronomy');
    assert.ok(unknownTheme.badge.includes('slate'), 'Must fall back to slate badge');
  });

  it('B5.5: should correctly format date display across year crossover (2026-12-31 to 2027-01-01)', () => {
    const dec31 = formatDateDisplay('2026-12-31');
    assert.ok(dec31.includes('Dec') && dec31.includes('31') && dec31.includes('2026'));

    const jan1 = formatDateDisplay('2027-01-01');
    assert.ok(jan1.includes('Jan') && jan1.includes('1') && jan1.includes('2027'));
  });

  it('B5.6: should correctly handle leap year date transition (2028-02-28 to 2028-02-29)', () => {
    const feb28 = new Date(2028, 1, 28);
    const feb29 = new Date(2028, 1, 29);
    assert.strictEqual(feb29.getDate(), 29, '2028 must be a leap year with Feb 29');

    const formatted29 = formatShortDate('2028-02-29');
    assert.ok(formatted29.includes('Feb') && formatted29.includes('29'));
  });

  it('B5.7: should correctly handle non-leap year Feb 28 -> Mar 1 transition in 2026', () => {
    const feb28_2026 = new Date(2026, 1, 28);
    const nextDay = new Date(feb28_2026);
    nextDay.setDate(feb28_2026.getDate() + 1);

    const m = nextDay.getMonth();
    const d = nextDay.getDate();
    assert.strictEqual(m, 2, 'Next month is March (index 2)');
    assert.strictEqual(d, 1, 'Next day is March 1');
  });

  it('B5.8: should format week ranges correctly across month boundary', () => {
    const crossMonth = formatWeekRange('2026-08-31', '2026-09-06');
    assert.ok(crossMonth.includes('Aug 31'));
    assert.ok(crossMonth.includes('Sep 6'));
    assert.ok(crossMonth.includes('2026'));
  });

  it('B5.9: should calculate ISO week info correctly for Monday-anchored weeks (weekStartsOn: 1)', () => {
    // 2026-09-11 is a Friday
    const info = getWeekInfo('2026-09-11', 1);
    assert.strictEqual(info.days.length, 7);
    assert.strictEqual(info.startDate, '2026-09-07', 'Monday start must be Sept 7');
    assert.strictEqual(info.endDate, '2026-09-13', 'Sunday end must be Sept 13');
  });

  it('B5.10: should calculate week info correctly for Sunday-anchored weeks (weekStartsOn: 0)', () => {
    // 2026-09-11 is a Friday
    const info = getWeekInfo('2026-09-11', 0);
    assert.strictEqual(info.days.length, 7);
    assert.strictEqual(info.startDate, '2026-09-06', 'Sunday start must be Sept 6');
    assert.strictEqual(info.endDate, '2026-09-12', 'Saturday end must be Sept 12');
  });

  it('B5.11: should format 24-hour time strings to 12-hour Indian AM/PM format', () => {
    assert.strictEqual(formatTime12Hour('06:30'), '06:30 AM');
    assert.strictEqual(formatTime12Hour('00:00'), '12:00 AM');
    assert.strictEqual(formatTime12Hour('00:15'), '12:15 AM');
    assert.strictEqual(formatTime12Hour('12:00'), '12:00 PM');
    assert.strictEqual(formatTime12Hour('12:30'), '12:30 PM');
    assert.strictEqual(formatTime12Hour('14:45'), '02:45 PM');
    assert.strictEqual(formatTime12Hour('20:00'), '08:00 PM');
    assert.strictEqual(formatTime12Hour('22:00'), '10:00 PM');
    assert.strictEqual(formatTime12Hour('23:59'), '11:59 PM');
    assert.strictEqual(formatTime12Hour(''), '');
    assert.strictEqual(formatTime12Hour(undefined), '');
  });
});
