import { NotFoundException } from '@nestjs/common';
import { assertReviewIssueScope } from './review-scope';

describe('assertReviewIssueScope', () => {
  it('accepts an issue in the review workspace and visible team', () => {
    expect(() =>
      assertReviewIssueScope(
        'ENG-1',
        'team-a',
        'workspace-a',
        'workspace-a',
        new Set(['team-a']),
      ),
    ).not.toThrow();
  });

  it.each([
    ['a different workspace', 'workspace-b', new Set(['team-a'])],
    ['an inaccessible team', 'workspace-a', new Set<string>()],
  ])('rejects an issue from %s', (_reason, issueWorkspaceId, teamIds) => {
    expect(() =>
      assertReviewIssueScope('ENG-1', 'team-a', issueWorkspaceId, 'workspace-a', teamIds),
    ).toThrow(NotFoundException);
  });
});
