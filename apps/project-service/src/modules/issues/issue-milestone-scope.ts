export type IssueMilestoneResolution =
  | { value: string | undefined; error?: undefined }
  | { value?: undefined; error: string };

/**
 * Issue milestones are persisted as their canonical project-milestone name for
 * compatibility with the existing issue schema. The selected project still
 * owns the relation, so a free-form value must never be accepted.
 */
export function resolveIssueMilestone(input: {
  projectId?: string | null;
  milestone?: string | null;
  matchingProjectMilestone?: { projectId: string; name: string } | null;
}): IssueMilestoneResolution {
  const milestone = input.milestone?.trim() ?? '';
  if (!milestone) return { value: undefined };
  if (!input.projectId) {
    return { error: 'An issue milestone requires a project' };
  }
  if (
    !input.matchingProjectMilestone ||
    input.matchingProjectMilestone.projectId !== input.projectId
  ) {
    return { error: 'Issue milestone must belong to the selected project' };
  }
  return { value: input.matchingProjectMilestone.name };
}
