export function isProjectInInitiativeWorkspace(
  projectWorkspaceId: string | undefined,
  initiativeWorkspaceId: string,
) {
  return projectWorkspaceId === initiativeWorkspaceId;
}

export function areProjectTeamsInInitiativeWorkspace(
  teamIds: string[],
  workspaceByTeamId: Map<string, string | undefined>,
  initiativeWorkspaceId: string,
) {
  return (
    teamIds.length > 0 &&
    teamIds.every((teamId) => workspaceByTeamId.get(teamId) === initiativeWorkspaceId)
  );
}
