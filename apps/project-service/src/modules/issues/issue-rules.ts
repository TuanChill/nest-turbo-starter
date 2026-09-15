export const ISSUE_STATUS_CATEGORIES = [
  'triage',
  'backlog',
  'unstarted',
  'started',
  'completed',
  'canceled',
] as const;

export function getIssuePropertyValidationError(input: {
  statusId?: string;
  statusCategory?: string;
  priorityId?: string;
  knownStatuses: Readonly<Record<string, { category: string }>>;
  knownPriorities: Readonly<Record<string, unknown>>;
}) {
  if (input.statusId !== undefined && !input.knownStatuses[input.statusId]) {
    return `Unknown issue status ${input.statusId}`;
  }
  if (
    input.statusCategory !== undefined &&
    !ISSUE_STATUS_CATEGORIES.includes(
      input.statusCategory as (typeof ISSUE_STATUS_CATEGORIES)[number],
    )
  ) {
    return `Unknown issue status category ${input.statusCategory}`;
  }
  if (
    input.statusId !== undefined &&
    input.statusCategory !== undefined &&
    input.knownStatuses[input.statusId]?.category !== input.statusCategory
  ) {
    return `Issue status ${input.statusId} does not belong to category ${input.statusCategory}`;
  }
  if (input.priorityId !== undefined && !input.knownPriorities[input.priorityId]) {
    return `Unknown issue priority ${input.priorityId}`;
  }
  return undefined;
}
