import {
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
});
