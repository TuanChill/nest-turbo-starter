export function isProjectScopeVisible(
  teamIds: string[],
  workspaceByTeamId: Map<string, string | undefined>,
  accessibleTeamIds: Set<string>,
) {
  const workspaceIds = new Set<string>();
  for (const teamId of teamIds) {
    const workspaceId = workspaceByTeamId.get(teamId);
    if (!workspaceId) return false;
    workspaceIds.add(workspaceId);
  }

  return (
    workspaceIds.size === 1 && teamIds.some((teamId) => accessibleTeamIds.has(teamId))
  );
}
