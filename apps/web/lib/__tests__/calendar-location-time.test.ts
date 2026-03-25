import { formatInTimeZone } from 'date-fns-tz';
import {
  addDaysToIsoDate,
  dayOfWeekSun0InTimeZone,
  expandShiftOccurrencesForCalendar,
} from '../calendar-location-time';

describe('calendar-location-time', () => {
  test('addDaysToIsoDate rolls calendar days in UTC-safe way', () => {
    expect(addDaysToIsoDate('2025-03-31', 1)).toBe('2025-04-01');
    expect(addDaysToIsoDate('2025-01-01', -1)).toBe('2024-12-31');
  });

  test('dayOfWeekSun0InTimeZone matches wall calendar in zone', () => {
    expect(dayOfWeekSun0InTimeZone('2025-03-10', 'America/New_York')).toBe(1);
    expect(dayOfWeekSun0InTimeZone('2025-03-09', 'America/New_York')).toBe(0);
  });

  test('expandShiftOccurrencesForCalendar uses location wall time for instants (overnight)', () => {
    const shift = {
      id: 't1',
      locationId: 'loc',
      startDate: '2025-01-06',
      endDate: '2025-01-06',
      daysOfWeek: [1],
      dailyStartTime: '22:00',
      dailyEndTime: '06:00',
      published: true,
    };
    const occ = expandShiftOccurrencesForCalendar(shift, 'America/New_York');
    expect(occ).toHaveLength(1);
    expect(formatInTimeZone(occ[0].startAt, 'America/New_York', 'yyyy-MM-dd HH:mm')).toBe(
      '2025-01-06 22:00',
    );
    expect(formatInTimeZone(occ[0].endAt, 'America/New_York', 'yyyy-MM-dd HH:mm')).toBe(
      '2025-01-07 06:00',
    );
  });

  test('DST spring forward day: wall time preserved for a valid local slot', () => {
    const shift = {
      id: 'dst',
      locationId: 'loc',
      startDate: '2025-03-09',
      endDate: '2025-03-09',
      daysOfWeek: [0],
      dailyStartTime: '12:00',
      dailyEndTime: '13:00',
      published: true,
    };
    const occ = expandShiftOccurrencesForCalendar(shift, 'America/New_York');
    expect(occ).toHaveLength(1);
    expect(formatInTimeZone(occ[0].startAt, 'America/New_York', 'yyyy-MM-dd HH:mm')).toBe(
      '2025-03-09 12:00',
    );
  });
});
