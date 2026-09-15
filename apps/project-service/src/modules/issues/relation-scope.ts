type IssueEndpoint = { identifier: string; teamId: string };

type RelationEndpoint = {
  sourceIdentifier: string;
  targetIdentifier: string;
};

/**
 * Relation rows predate foreign keys in some installations. Only expose a
 * relation when both persisted endpoints still resolve to the current team.
 */
export function isRelationInIssueTeam(
  relation: RelationEndpoint,
  currentIssue: IssueEndpoint,
  endpointsByIdentifier: Map<string, IssueEndpoint>,
) {
  const source = endpointsByIdentifier.get(relation.sourceIdentifier);
  const target = endpointsByIdentifier.get(relation.targetIdentifier);
  return Boolean(
    source &&
      target &&
      source.teamId === currentIssue.teamId &&
      target.teamId === currentIssue.teamId &&
      (source.identifier === currentIssue.identifier ||
        target.identifier === currentIssue.identifier),
  );
}
