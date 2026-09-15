import { isProjectScopeVisible } from './project-scope';

describe('isProjectScopeVisible', () => {
  const workspaces = new Map([
    ['team-a', 'workspace-a'],
    ['team-b', 'workspace-a'],
    ['team-c', 'workspace-b'],
  ]);

  it('allows a project whose teams share one workspace and one is accessible', () => {
    expect(
      isProjectScopeVisible(['team-a', 'team-b'], workspaces, new Set(['team-b'])),
    ).toBe(true);
  });

  it('rejects projects spanning workspaces', () => {
    expect(
      isProjectScopeVisible(['team-a', 'team-c'], workspaces, new Set(['team-a'])),
    ).toBe(false);
  });

  it('rejects projects with missing team metadata', () => {
    expect(
      isProjectScopeVisible(['team-a', 'team-missing'], workspaces, new Set(['team-a'])),
    ).toBe(false);
  });

  it('rejects projects with no accessible team', () => {
    expect(isProjectScopeVisible(['team-a'], workspaces, new Set())).toBe(false);
  });
});
