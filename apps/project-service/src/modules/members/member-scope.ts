export function filterVisibleTeamIds(
  teamMemberships: Array<{ teamId: string }>,
  visibleTeamIds: Set<string>,
): string[] {
  return teamMemberships
    .filter((membership) => visibleTeamIds.has(membership.teamId))
    .map((membership) => membership.teamId);
}
