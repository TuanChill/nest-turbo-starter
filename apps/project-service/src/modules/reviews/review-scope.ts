import { NotFoundException } from '@nestjs/common';

export function assertReviewIssueScope(
  identifier: string,
  issueTeamId: string,
  issueWorkspaceId: string | undefined,
  reviewWorkspaceId: string,
  accessibleTeamIds: Set<string>,
) {
  if (
    !issueWorkspaceId ||
    issueWorkspaceId !== reviewWorkspaceId ||
    !accessibleTeamIds.has(issueTeamId)
  ) {
    throw new NotFoundException(`Issue ${identifier} not found`);
  }
}
