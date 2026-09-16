import {
  estimateEffort,
  getEstimateValues,
  validateIssueEstimate,
} from './issue-estimates';

const fibonacci = {
  enabled: true,
  scale: 'fibonacci' as const,
  extended: false,
  allowZero: false,
  unestimatedAsOne: true,
};

describe('issue estimates', () => {
  it('returns configured base and extended scale values', () => {
    expect(getEstimateValues(fibonacci)).toEqual([1, 2, 3, 5, 8]);
    expect(getEstimateValues({ ...fibonacci, extended: true, allowZero: true })).toEqual([
      0, 1, 2, 3, 5, 8, 13, 21,
    ]);
  });

  it('rejects estimates that are disabled or outside the team scale', () => {
    expect(validateIssueEstimate(3, { ...fibonacci, enabled: false })).toContain(
      'not enabled',
    );
    expect(validateIssueEstimate(4, fibonacci)).toContain('one of');
    expect(validateIssueEstimate(0, fibonacci)).toContain('one of');
    expect(validateIssueEstimate(0, { ...fibonacci, allowZero: true })).toBeUndefined();
  });

  it('treats an unestimated issue according to the team analytics setting', () => {
    expect(estimateEffort(undefined, fibonacci)).toBe(1);
    expect(estimateEffort(null, { ...fibonacci, unestimatedAsOne: false })).toBe(0);
    expect(estimateEffort(5, fibonacci)).toBe(5);
  });
});
