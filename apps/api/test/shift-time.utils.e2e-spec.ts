import { expandShiftToIntervals } from '../src/common/shift-time.utils';

describe('shift-time.utils (expandShiftToIntervals)', () => {
  test('filters generated intervals by daysOfWeek', () => {
    const shift = {
      startDate: '2026-01-05',
      endDate: '2026-01-11',
      dailyStartTime: '09:00',
      dailyEndTime: '17:00',
      daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
    };

    const intervals = expandShiftToIntervals(shift as any);
    const expectedSet = new Set<number>(shift.daysOfWeek);

    const start = new Date(`${shift.startDate}T00:00:00Z`);
    const end = new Date(`${shift.endDate}T00:00:00Z`);
    const expectedDays: string[] = [];
    let cursor = new Date(start);
    while (cursor.getTime() <= end.getTime()) {
      const weekdayUtc = cursor.getUTCDay();
      if (expectedSet.has(weekdayUtc)) {
        expectedDays.push(cursor.toISOString().slice(0, 10));
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    expect(intervals).toHaveLength(expectedDays.length);
    expect(intervals.map((it) => it.start.toISOString().slice(0, 10))).toEqual(expectedDays);

    for (const it of intervals) {
      const hours = (it.end.getTime() - it.start.getTime()) / 3600000;
      expect(hours).toBeCloseTo(8, 5);
    }
  });

  test('handles overnight intervals (dailyEndTime <= dailyStartTime)', () => {
    const startDate = '2026-01-05';
    const startDow = new Date(`${startDate}T00:00:00Z`).getUTCDay(); // 0=Sun..6=Sat

    const shift = {
      startDate,
      endDate: startDate, // only one selected day
      dailyStartTime: '22:00',
      dailyEndTime: '03:00', // overnight
      daysOfWeek: [startDow],
    };

    const intervals = expandShiftToIntervals(shift as any);
    expect(intervals).toHaveLength(1);

    const [it] = intervals;
    expect(it.start.toISOString().slice(0, 10)).toBe(startDate);

    const expectedEndDate = new Date(`${startDate}T00:00:00Z`);
    expectedEndDate.setUTCDate(expectedEndDate.getUTCDate() + 1);
    expect(it.end.toISOString().slice(0, 10)).toBe(expectedEndDate.toISOString().slice(0, 10));

    const hours = (it.end.getTime() - it.start.getTime()) / 3600000;
    expect(hours).toBeCloseTo(5, 5);
  });
});

