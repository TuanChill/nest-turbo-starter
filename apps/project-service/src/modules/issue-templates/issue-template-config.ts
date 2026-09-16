import type { IssueTemplateConfig } from '../../data-access';

export function normalizeIssueTemplateConfig(
  config?: IssueTemplateConfig,
): IssueTemplateConfig {
  const source = config ?? {};
  return {
    title: source.title?.trim(),
    description: source.description,
    descriptionBlocks: Array.isArray(source.descriptionBlocks)
      ? source.descriptionBlocks
      : undefined,
    statusId: source.statusId,
    statusCategory: source.statusCategory,
    priorityId: source.priorityId,
    assigneeId: source.assigneeId,
    labelIds: source.labelIds ? [...new Set(source.labelIds)] : undefined,
    projectId: source.projectId,
    cycleId: source.cycleId,
    dueDate: source.dueDate,
    parentIssueId: source.parentIssueId?.trim(),
    milestone: source.milestone?.trim(),
  };
}

export function issueTemplateReferencesSameTeam(
  projectTeamId?: string,
  cycleTeamId?: string,
): boolean {
  return !projectTeamId || !cycleTeamId || projectTeamId === cycleTeamId;
}

export function issueTemplateParentReferencesSameTeam(
  parentTeamId?: string,
  templateTeamId?: string,
): boolean {
  return !parentTeamId || Boolean(templateTeamId && parentTeamId === templateTeamId);
}
