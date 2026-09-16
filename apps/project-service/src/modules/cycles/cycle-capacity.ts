/**
 * Estimate how full a cycle is relative to the team's recent throughput.
 *
 * Linear uses the previous three completed cycles as the velocity baseline and
 * falls back to team size when there is no completed-cycle history. Circle
 * currently has no persisted issue-point estimate, so this contract uses
 * issue scope as the effort unit until estimates are implemented separately.
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
