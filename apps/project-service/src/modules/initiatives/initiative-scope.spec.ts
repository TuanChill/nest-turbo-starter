import { isProjectInInitiativeWorkspace } from './initiative-scope';

describe('isProjectInInitiativeWorkspace', () => {
  it('accepts projects whose team belongs to the initiative workspace', () => {
    expect(isProjectInInitiativeWorkspace('workspace-a', 'workspace-a')).toBe(true);
  });

  it('rejects missing or foreign project workspaces', () => {
    expect(isProjectInInitiativeWorkspace(undefined, 'workspace-a')).toBe(false);
    expect(isProjectInInitiativeWorkspace('workspace-b', 'workspace-a')).toBe(false);
  });
});
