export interface CycleSettingsInput {
  enabled: boolean;
  durationWeeks: number;
  startDayOfWeek: number;
  cooldownDays: number;
  upcomingCycleCount: number;
  autoAddActiveIssues: boolean;
}

export function getCycleSettingsValidationError(input: CycleSettingsInput) {
  if (
    !Number.isInteger(input.durationWeeks) ||
    input.durationWeeks < 1 ||
    input.durationWeeks > 8
  ) {
    return 'Cycle duration must be between 1 and 8 weeks';
  }
  if (
    !Number.isInteger(input.startDayOfWeek) ||
    input.startDayOfWeek < 0 ||
    input.startDayOfWeek > 6
  ) {
    return 'Cycle start day must be between Sunday and Saturday';
  }
  if (
    !Number.isInteger(input.cooldownDays) ||
    input.cooldownDays < 0 ||
    input.cooldownDays > 30
  ) {
    return 'Cycle cooldown must be between 0 and 30 days';
  }
  if (
    !Number.isInteger(input.upcomingCycleCount) ||
    input.upcomingCycleCount < 0 ||
    input.upcomingCycleCount > 15
  ) {
    return 'Upcoming cycle count must be between 0 and 15';
  }
  return undefined;
}

export function addCalendarDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function nextStartOnWeekday(date: Date, startDayOfWeek: number): Date {
  const result = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const delta = (startDayOfWeek - result.getUTCDay() + 7) % 7;
  return addCalendarDays(result, delta);
}

export function nextCycleStart(previousEndDate: Date, cooldownDays: number): Date {
  // The cooldown is the gap after the previous cycle; the next cycle starts
  // on the following day after that gap.
  return addCalendarDays(previousEndDate, cooldownDays + 1);
}

export function cycleEndDate(startDate: Date, durationWeeks: number): Date {
  return addCalendarDays(startDate, durationWeeks * 7 - 1);
}
