export const ISSUE_STATUS_CATEGORIES = [
  'triage',
  'backlog',
  'unstarted',
  'started',
  'completed',
  'canceled',
] as const;

/**
 * Resolve the only safe implicit team for an issue created from a project.
 *
 * The project's primary team is the default when the caller can access it.
 * If that team is not visible, an implicit choice is only safe when exactly
 * one project team remains visible. Returning undefined forces the API caller
 * to choose a team instead of depending on database ordering.
 */
export function resolveDefaultIssueTeamId(input: {
  requestedTeamId?: string;
  primaryTeamId: string;
  projectTeamIds: readonly string[];
  accessibleTeamIds: readonly string[];
}) {
  if (input.requestedTeamId) return input.requestedTeamId;

  const projectTeamIds = new Set(input.projectTeamIds);
  if (
    projectTeamIds.has(input.primaryTeamId) &&
    input.accessibleTeamIds.includes(input.primaryTeamId)
  ) {
    return input.primaryTeamId;
  }

  const visibleProjectTeamIds = [...projectTeamIds].filter((teamId) =>
    input.accessibleTeamIds.includes(teamId),
  );
  return visibleProjectTeamIds.length === 1 ? visibleProjectTeamIds[0] : undefined;
}

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
