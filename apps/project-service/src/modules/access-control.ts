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

export function canManageWorkspaceRole(role: string | null | undefined) {
  return role === 'Owner' || role === 'Admin';
}

export function canManageTeamRole(
  workspaceRole: string | null | undefined,
  teamRole: string | null | undefined,
) {
  return (
    canManageWorkspaceRole(workspaceRole) || teamRole === 'lead' || teamRole === 'admin'
  );
}

export function canDeleteTeamRole(role: string | null | undefined) {
  return canManageWorkspaceRole(role);
}

export function allMembersBelongToWorkspace(
  workspaceMemberIds: string[],
  memberIds: string[],
) {
  const validMemberIds = new Set(workspaceMemberIds);
  return memberIds.every((memberId) => validMemberIds.has(memberId));
}
