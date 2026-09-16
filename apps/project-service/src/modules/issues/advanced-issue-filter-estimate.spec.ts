import {
  matchesAdvancedIssueFilters,
  parseAdvancedIssueFilters,
} from './advanced-issue-filter';

describe('advanced issue estimate filters', () => {
  it('filters persisted estimate values without treating unestimated issues as zero', () => {
    const filters = parseAdvancedIssueFilters(
      JSON.stringify([
        {
          columnId: 'estimate',
          type: 'number',
          operator: 'is greater than or equal to',
          values: [5],
        },
      ]),
    );

    expect(matchesAdvancedIssueFilters({ estimate: 8 }, [], filters)).toBe(true);
    expect(matchesAdvancedIssueFilters({ estimate: undefined }, [], filters)).toBe(false);
  });
});
