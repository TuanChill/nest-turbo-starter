import { getIssuePropertyValidationError } from './issue-rules';

const statuses = {
  'to-do': { category: 'unstarted' },
  done: { category: 'completed' },
};
const priorities = { 'no-priority': {}, high: {} };

describe('issue property rules', () => {
  it('accepts known status, category, and priority values', () => {
    expect(
      getIssuePropertyValidationError({
        statusId: 'done',
        statusCategory: 'completed',
        priorityId: 'high',
        knownStatuses: statuses,
        knownPriorities: priorities,
      }),
    ).toBeUndefined();
  });

  it('rejects unknown values and mismatched status categories', () => {
    expect(
      getIssuePropertyValidationError({
        statusId: 'missing',
        knownStatuses: statuses,
        knownPriorities: priorities,
      }),
    ).toBe('Unknown issue status missing');
    expect(
      getIssuePropertyValidationError({
        statusId: 'done',
        statusCategory: 'started',
        knownStatuses: statuses,
        knownPriorities: priorities,
      }),
    ).toBe('Issue status done does not belong to category started');
    expect(
      getIssuePropertyValidationError({
        priorityId: 'missing',
        knownStatuses: statuses,
        knownPriorities: priorities,
      }),
    ).toBe('Unknown issue priority missing');
  });
});
