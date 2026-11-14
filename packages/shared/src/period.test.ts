import { describe, expect, it } from 'vitest';

import { isInPeriod, occurrenceDate, periodFor, shiftPeriod, yearPeriod } from './period';

describe('periodFor', () => {
  it('calendar month when start day is 1', () => {
    expect(periodFor('2026-11-14', 1)).toEqual({ start: '2026-11-01', end: '2026-11-30' });
    expect(periodFor('2026-11-01', 1)).toEqual({ start: '2026-11-01', end: '2026-11-30' });
    expect(periodFor('2026-11-30', 1)).toEqual({ start: '2026-11-01', end: '2026-11-30' });
    expect(periodFor('2024-02-29', 1)).toEqual({ start: '2024-02-01', end: '2024-02-29' });
  });
  it('custom start day, like the reference app (10/11 - 09/12)', () => {
    expect(periodFor('2026-11-12', 10)).toEqual({ start: '2026-11-10', end: '2026-12-09' });
    expect(periodFor('2026-11-10', 10)).toEqual({ start: '2026-11-10', end: '2026-12-09' });
    expect(periodFor('2026-11-09', 10)).toEqual({ start: '2026-10-10', end: '2026-11-09' });
  });
  it('crosses the year', () => {
    expect(periodFor('2027-01-05', 10)).toEqual({ start: '2026-12-10', end: '2027-01-09' });
    expect(periodFor('2026-12-25', 10)).toEqual({ start: '2026-12-10', end: '2027-01-09' });
  });
  it('start day past the end of a short month uses the last day', () => {
    expect(periodFor('2026-02-15', 31)).toEqual({ start: '2026-01-31', end: '2026-02-27' });
    expect(periodFor('2026-02-28', 31)).toEqual({ start: '2026-02-28', end: '2026-03-30' });
    expect(periodFor('2026-03-31', 31)).toEqual({ start: '2026-03-31', end: '2026-04-29' });
    expect(periodFor('2026-04-30', 31)).toEqual({ start: '2026-04-30', end: '2026-05-30' });
    expect(periodFor('2024-02-29', 30)).toEqual({ start: '2024-02-29', end: '2024-03-29' });
    expect(periodFor('2026-02-28', 29)).toEqual({ start: '2026-02-28', end: '2026-03-28' });
  });
  it('every day of two years lands in exactly one period, with no gaps', () => {
    for (const startDay of [1, 10, 15, 28, 29, 30, 31]) {
      let previous = periodFor('2026-01-01', startDay);
      const d = new Date(2026, 0, 1);
      for (let i = 0; i < 731; i += 1) {
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const p = periodFor(iso, startDay);
        expect(isInPeriod(iso, p)).toBe(true);
        if (p.start !== previous.start) {
          // a new period starts the day after the previous one ended
          expect(shiftPeriod(previous, 1, startDay)).toEqual(p);
          expect(iso).toBe(p.start);
        }
        previous = p;
        d.setDate(d.getDate() + 1);
      }
    }
  });
  it('rejects a bad start day', () => {
    expect(() => periodFor('2026-01-01', 0)).toThrow();
    expect(() => periodFor('2026-01-01', 32)).toThrow();
  });
});

describe('shiftPeriod', () => {
  it('moves by whole budget months', () => {
    const p = periodFor('2026-11-14', 1);
    expect(shiftPeriod(p, -1, 1)).toEqual({ start: '2026-10-01', end: '2026-10-31' });
    expect(shiftPeriod(p, 2, 1)).toEqual({ start: '2027-01-01', end: '2027-01-31' });
    const q = periodFor('2026-01-31', 31);
    expect(shiftPeriod(q, 1, 31)).toEqual({ start: '2026-02-28', end: '2026-03-30' });
    expect(shiftPeriod(q, 2, 31)).toEqual({ start: '2026-03-31', end: '2026-04-29' });
  });
});

describe('yearPeriod', () => {
  it('is the calendar year', () => {
    expect(yearPeriod(2026)).toEqual({ start: '2026-01-01', end: '2026-12-31' });
  });
});

describe('occurrenceDate', () => {
  it('monthly from the 31st stays on month ends without drifting', () => {
    expect(occurrenceDate('2026-01-31', 'monthly', 1)).toBe('2026-02-28');
    expect(occurrenceDate('2026-01-31', 'monthly', 2)).toBe('2026-03-31');
    expect(occurrenceDate('2026-01-31', 'monthly', 3)).toBe('2026-04-30');
    expect(occurrenceDate('2026-11-14', 'monthly', 2)).toBe('2027-01-14');
  });
  it('weekly and yearly', () => {
    expect(occurrenceDate('2026-11-14', 'weekly', 3)).toBe('2026-12-05');
    expect(occurrenceDate('2024-02-29', 'yearly', 1)).toBe('2025-02-28');
    expect(occurrenceDate('2026-11-14', 'monthly', 0)).toBe('2026-11-14');
  });
});
