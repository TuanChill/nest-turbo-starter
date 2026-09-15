import { NotFoundException } from '@nestjs/common';

export function assertProjectTargetReferences(
  projectId: string,
  projectTeamIds: string[],
  teamWorkspaceIds: Map<string, string>,
  workspaceId: string,
  teamId?: string,
) {
  if (
    teamWorkspaceIds.size !== projectTeamIds.length ||
    projectTeamIds.some(
      (projectTeamId) => teamWorkspaceIds.get(projectTeamId) !== workspaceId,
    ) ||
    (teamId !== undefined && !projectTeamIds.includes(teamId))
  ) {
    throw new NotFoundException(`Project ${projectId} not found`);
  }
}
