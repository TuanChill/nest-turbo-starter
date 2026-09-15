import { canAssignIssueToMember } from './assignee-scope';

describe('canAssignIssueToMember', () => {
  const valid = {
    memberExists: true,
    teamExists: true,
    teamMembershipExists: true,
    workspaceMembershipExists: true,
  };

  it('requires membership in both the issue team and its workspace', () => {
    expect(canAssignIssueToMember(valid)).toBe(true);
    expect(canAssignIssueToMember({ ...valid, teamMembershipExists: false })).toBe(false);
    expect(canAssignIssueToMember({ ...valid, workspaceMembershipExists: false })).toBe(
      false,
    );
  });

  it('rejects missing members or teams', () => {
    expect(canAssignIssueToMember({ ...valid, memberExists: false })).toBe(false);
    expect(canAssignIssueToMember({ ...valid, teamExists: false })).toBe(false);
  });
});
