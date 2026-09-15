export function canAccessWorkspace(
  accessibleWorkspaceIds: string[],
  workspaceId: string,
  ownerId: string | null | undefined,
  memberId: string,
) {
  return ownerId === memberId || accessibleWorkspaceIds.includes(workspaceId);
}

export function canAccessTeam(accessibleTeamIds: string[], teamId: string) {
  return accessibleTeamIds.includes(teamId);
}

export function allMembersBelongToWorkspace(
  workspaceMemberIds: string[],
  memberIds: string[],
) {
  const validMemberIds = new Set(workspaceMemberIds);
  return memberIds.every((memberId) => validMemberIds.has(memberId));
}
