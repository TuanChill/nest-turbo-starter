import {
  allMembersBelongToWorkspace,
  canAccessTeam,
  canAccessWorkspace,
  canDeleteTeamRole,
  canManageTeamRole,
  canManageWorkspaceRole,
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

describe('role-based management access', () => {
  it('allows only workspace owners and admins to manage workspace membership', () => {
    expect(canManageWorkspaceRole('Owner')).toBe(true);
    expect(canManageWorkspaceRole('Admin')).toBe(true);
    expect(canManageWorkspaceRole('Member')).toBe(false);
    expect(canManageWorkspaceRole('Guest')).toBe(false);
  });

  it('allows workspace managers and team leads to manage a team', () => {
    expect(canManageTeamRole('Member', 'lead')).toBe(true);
    expect(canManageTeamRole('Admin', 'member')).toBe(true);
    expect(canManageTeamRole('Guest', 'member')).toBe(false);
  });

  it('keeps team deletion restricted to workspace managers', () => {
    expect(canDeleteTeamRole('Owner')).toBe(true);
    expect(canDeleteTeamRole('Admin')).toBe(true);
    expect(canDeleteTeamRole('Member')).toBe(false);
  });
});
