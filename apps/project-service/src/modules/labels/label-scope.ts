/** A workspace label is available to every team; a team label is not portable. */
export function isLabelAvailableForTeam(
  labelTeamId: string | undefined,
  targetTeamId: string | undefined,
): boolean {
  return !labelTeamId || labelTeamId === targetTeamId;
}
