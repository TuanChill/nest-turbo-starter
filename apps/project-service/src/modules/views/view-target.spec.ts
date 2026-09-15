import { NotFoundException } from '@nestjs/common';
import { assertProjectTargetReferences } from './view-target';

describe('assertProjectTargetReferences', () => {
  const workspaces = new Map([
    ['team-a', 'workspace-a'],
    ['team-b', 'workspace-a'],
  ]);

  it('accepts a project in the workspace and selected team', () => {
    expect(() =>
      assertProjectTargetReferences(
        'project-1',
        ['team-a', 'team-b'],
        workspaces,
        'workspace-a',
        'team-b',
      ),
    ).not.toThrow();
  });

  it('rejects a project whose team is in another workspace', () => {
    expect(() =>
      assertProjectTargetReferences(
        'project-1',
        ['team-a', 'team-c'],
        new Map([
          ['team-a', 'workspace-a'],
          ['team-c', 'workspace-b'],
        ]),
        'workspace-a',
      ),
    ).toThrow(NotFoundException);
  });

  it('rejects a selected team that is not attached to the project', () => {
    expect(() =>
      assertProjectTargetReferences(
        'project-1',
        ['team-a'],
        new Map([['team-a', 'workspace-a']]),
        'workspace-a',
        'team-b',
      ),
    ).toThrow(NotFoundException);
  });
});
