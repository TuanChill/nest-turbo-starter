import { isRelationInIssueTeam } from './relation-scope';

const currentIssue = { identifier: 'ENG-1', teamId: 'ENG' };

function endpoints(...issues: Array<{ identifier: string; teamId: string }>) {
  return new Map(issues.map((issue) => [issue.identifier, issue]));
}

describe('isRelationInIssueTeam', () => {
  it('accepts a relation whose endpoints are both in the current team', () => {
    expect(
      isRelationInIssueTeam(
        { sourceIdentifier: 'ENG-1', targetIdentifier: 'ENG-2' },
        currentIssue,
        endpoints(currentIssue, { identifier: 'ENG-2', teamId: 'ENG' }),
      ),
    ).toBe(true);
  });

  it('rejects a relation with a foreign-team endpoint', () => {
    expect(
      isRelationInIssueTeam(
        { sourceIdentifier: 'ENG-1', targetIdentifier: 'OPS-2' },
        currentIssue,
        endpoints(currentIssue, { identifier: 'OPS-2', teamId: 'OPS' }),
      ),
    ).toBe(false);
  });

  it('rejects stale relations whose endpoint no longer exists', () => {
    expect(
      isRelationInIssueTeam(
        { sourceIdentifier: 'ENG-1', targetIdentifier: 'ENG-404' },
        currentIssue,
        endpoints(currentIssue),
      ),
    ).toBe(false);
  });
});
