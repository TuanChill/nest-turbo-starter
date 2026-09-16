export interface CycleSettingsInput {
  enabled: boolean;
  durationWeeks: number;
  startDayOfWeek: number;
  timeZone?: string;
  cooldownDays: number;
  upcomingCycleCount: number;
  autoAddActiveIssues: boolean;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

export function getCycleSettingsValidationError(input: CycleSettingsInput) {
  if (input.timeZone !== undefined && !isValidTimeZone(input.timeZone)) {
    return 'Cycle timezone must be a valid IANA timezone';
  }
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

/** Return the current calendar day represented as a UTC-midnight date label. */
export function calendarDateInTimeZone(date: Date, timeZone = 'UTC'): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter(
        (part) => part.type === 'year' || part.type === 'month' || part.type === 'day',
      )
      .map((part) => [part.type, Number(part.value)]),
  );
  return new Date(Date.UTC(values.year, values.month - 1, values.day));
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
