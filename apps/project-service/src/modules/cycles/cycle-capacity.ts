/**
 * Estimate how full a cycle is relative to the team's recent throughput.
 *
 * Linear uses the previous three completed cycles as the velocity baseline and
 * falls back to team size when there is no completed-cycle history. The caller
 * supplies either issue scope or validated team-configured estimate effort.
 */
export function estimateCycleCapacity(
  scope: number,
  previousCompletedScopes: number[],
  teamMemberCount: number,
): number {
  const recentScopes = previousCompletedScopes
    .filter((value) => Number.isFinite(value) && value >= 0)
    .slice(0, 3);
  const baseline = recentScopes.length
    ? recentScopes.reduce((total, value) => total + value, 0) / recentScopes.length
    : teamMemberCount;

  if (baseline <= 0 || !Number.isFinite(scope) || scope <= 0) return 0;
  return Math.min(100, Math.round((scope / baseline) * 100));
}
