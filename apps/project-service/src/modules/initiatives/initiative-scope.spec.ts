import {
  areProjectTeamsInInitiativeWorkspace,
  isProjectInInitiativeWorkspace,
} from './initiative-scope';

describe('isProjectInInitiativeWorkspace', () => {
  it('accepts projects whose team belongs to the initiative workspace', () => {
    expect(isProjectInInitiativeWorkspace('workspace-a', 'workspace-a')).toBe(true);
  });

  it('rejects missing or foreign project workspaces', () => {
    expect(isProjectInInitiativeWorkspace(undefined, 'workspace-a')).toBe(false);
    expect(isProjectInInitiativeWorkspace('workspace-b', 'workspace-a')).toBe(false);
  });
});

describe('areProjectTeamsInInitiativeWorkspace', () => {
  it('rejects a project with a foreign secondary team', () => {
    const workspaces = new Map([
      ['team-a', 'workspace-a'],
      ['team-b', 'workspace-b'],
    ]);
    expect(
      areProjectTeamsInInitiativeWorkspace(
        ['team-a', 'team-b'],
        workspaces,
        'workspace-a',
      ),
    ).toBe(false);
  });

  it('accepts all teams when they belong to the initiative workspace', () => {
    const workspaces = new Map([
      ['team-a', 'workspace-a'],
      ['team-b', 'workspace-a'],
    ]);
    expect(
      areProjectTeamsInInitiativeWorkspace(
        ['team-a', 'team-b'],
        workspaces,
        'workspace-a',
      ),
    ).toBe(true);
  });
});
