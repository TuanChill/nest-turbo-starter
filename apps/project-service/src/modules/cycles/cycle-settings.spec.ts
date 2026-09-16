import {
  calendarDateInTimeZone,
  cycleEndDate,
  getCycleSettingsValidationError,
  nextCycleStart,
  nextStartOnWeekday,
} from './cycle-settings';

describe('cycle settings', () => {
  it('enforces Linear cadence bounds', () => {
    expect(
      getCycleSettingsValidationError({
        enabled: true,
        durationWeeks: 1,
        startDayOfWeek: 1,
        cooldownDays: 0,
        upcomingCycleCount: 15,
        autoAddActiveIssues: false,
      }),
    ).toBeUndefined();
    expect(
      getCycleSettingsValidationError({
        enabled: true,
        durationWeeks: 9,
        startDayOfWeek: 1,
        cooldownDays: 0,
        upcomingCycleCount: 3,
        autoAddActiveIssues: false,
      }),
    ).toBe('Cycle duration must be between 1 and 8 weeks');
    expect(
      getCycleSettingsValidationError({
        enabled: true,
        durationWeeks: 2,
        startDayOfWeek: 1,
        cooldownDays: 0,
        upcomingCycleCount: 16,
        autoAddActiveIssues: false,
      }),
    ).toBe('Upcoming cycle count must be between 0 and 15');
  });

  it('calculates weekday starts, inclusive cycle ends, and cooldown gaps', () => {
    const monday = nextStartOnWeekday(new Date('2026-09-16T00:00:00.000Z'), 1);
    expect(monday.toISOString().slice(0, 10)).toBe('2026-09-21');
    expect(cycleEndDate(monday, 2).toISOString().slice(0, 10)).toBe('2026-10-04');
    expect(
      nextCycleStart(new Date('2026-10-04T00:00:00.000Z'), 2).toISOString().slice(0, 10),
    ).toBe('2026-10-07');
  });

  it('accepts IANA timezones and rejects invalid values', () => {
    expect(
      getCycleSettingsValidationError({
        enabled: true,
        durationWeeks: 2,
        startDayOfWeek: 1,
        timeZone: 'Asia/Ho_Chi_Minh',
        cooldownDays: 0,
        upcomingCycleCount: 3,
        autoAddActiveIssues: false,
      }),
    ).toBeUndefined();
    expect(
      getCycleSettingsValidationError({
        enabled: true,
        durationWeeks: 2,
        startDayOfWeek: 1,
        timeZone: 'Not/AZone',
        cooldownDays: 0,
        upcomingCycleCount: 3,
        autoAddActiveIssues: false,
      }),
    ).toBe('Cycle timezone must be a valid IANA timezone');
  });

  it('uses the configured local calendar day across UTC date boundaries', () => {
    const instant = new Date('2026-09-16T23:30:00.000Z');
    expect(calendarDateInTimeZone(instant, 'Asia/Ho_Chi_Minh').toISOString()).toBe(
      '2026-09-17T00:00:00.000Z',
    );
    expect(calendarDateInTimeZone(instant, 'America/Los_Angeles').toISOString()).toBe(
      '2026-09-16T00:00:00.000Z',
    );
  });
});
