export function canAssignIssueToMember(input: {
  memberExists: boolean;
  teamExists: boolean;
  teamMembershipExists: boolean;
  workspaceMembershipExists: boolean;
}) {
  return Boolean(
    input.memberExists &&
      input.teamExists &&
      input.teamMembershipExists &&
      input.workspaceMembershipExists,
  );
}
