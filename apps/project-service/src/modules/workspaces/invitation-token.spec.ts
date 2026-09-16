import {
  createInvitationToken,
  createWorkspaceInviteCode,
  hashInvitationToken,
} from './invitation-token';

describe('workspace invitation security helpers', () => {
  it('creates a human-shareable workspace code in the persisted format', () => {
    const code = createWorkspaceInviteCode();

    expect(code).toMatch(/^CIR-[A-HJ-NP-Z2-9]{6}$/);
  });

  it('returns a token and a one-way hash for email invitations', () => {
    const invitation = createInvitationToken();

    expect(invitation.token).toHaveLength(64);
    expect(invitation.tokenHash).toBe(hashInvitationToken(invitation.token));
    expect(invitation.tokenHash).not.toBe(invitation.token);
  });
});
