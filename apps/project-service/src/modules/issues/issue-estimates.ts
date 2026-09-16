export type EstimateScale = 'exponential' | 'fibonacci' | 'linear' | 't-shirt';

export interface IssueEstimateSettings {
  enabled: boolean;
  scale: EstimateScale;
  extended: boolean;
  allowZero: boolean;
  unestimatedAsOne: boolean;
}

const BASE_SCALE_VALUES: Record<EstimateScale, number[]> = {
  exponential: [1, 2, 4, 8, 16],
  fibonacci: [1, 2, 3, 5, 8],
  linear: [1, 2, 3, 4, 5],
  // T-shirt values use their Fibonacci numeric equivalents for analytics.
  't-shirt': [1, 2, 3, 5, 8],
};

const EXTENDED_SCALE_VALUES: Record<EstimateScale, number[]> = {
  exponential: [32, 64],
  fibonacci: [13, 21],
  linear: [6, 7],
  't-shirt': [13, 21],
};

export function getEstimateValues(settings: IssueEstimateSettings): number[] {
  if (!settings.enabled) return [];
  const values = [...BASE_SCALE_VALUES[settings.scale]];
  if (settings.extended) values.push(...EXTENDED_SCALE_VALUES[settings.scale]);
  if (settings.allowZero) values.unshift(0);
  return values;
}

export function validateIssueEstimate(
  estimate: number | null | undefined,
  settings: IssueEstimateSettings,
): string | undefined {
  if (estimate === undefined || estimate === null) return undefined;
  if (!Number.isInteger(estimate) || estimate < 0) {
    return 'Estimate must be a non-negative integer';
  }
  if (!settings.enabled) return 'Estimates are not enabled for this team';
  if (!getEstimateValues(settings).includes(estimate)) {
    return `Estimate must be one of: ${getEstimateValues(settings).join(', ')}`;
  }
  return undefined;
}

export function estimateEffort(
  estimate: number | null | undefined,
  settings: IssueEstimateSettings,
): number {
  if (estimate !== undefined && estimate !== null) return estimate;
  return settings.unestimatedAsOne ? 1 : 0;
}
