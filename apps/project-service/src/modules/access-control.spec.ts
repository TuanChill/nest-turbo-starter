import {
  allMembersBelongToWorkspace,
  canAccessTeam,
  canAccessWorkspace,
} from './access-control';

describe('access-control predicates', () => {
  it('allows workspace members and owners only', () => {
    expect(
      canAccessWorkspace(['workspace-a'], 'workspace-a', 'owner-a', 'member-b'),
    ).toBe(true);
    expect(canAccessWorkspace([], 'workspace-a', 'owner-a', 'owner-a')).toBe(true);
    expect(canAccessWorkspace([], 'workspace-a', 'owner-a', 'member-b')).toBe(false);
  });

  it('allows only teams visible through the workspace/team memberships', () => {
    expect(canAccessTeam(['team-a'], 'team-a')).toBe(true);
    expect(canAccessTeam(['team-a'], 'team-b')).toBe(false);
  });

  it('rejects initial team members outside the workspace', () => {
    expect(allMembersBelongToWorkspace(['member-a', 'member-b'], ['member-a'])).toBe(
      true,
    );
    expect(allMembersBelongToWorkspace(['member-a'], ['member-a', 'member-b'])).toBe(
      false,
    );
  });
});
