import { createHash, randomBytes, randomInt } from 'node:crypto';

const WORKSPACE_INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function createInvitationToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('hex');
  return { token, tokenHash: hashInvitationToken(token) };
}

export function hashInvitationToken(token: string): string {
  return createHash('sha256').update(token.trim()).digest('hex');
}

/** Generate a short human-shareable code without relying on Math.random(). */
export function createWorkspaceInviteCode(): string {
  let code = 'CIR-';
  for (let index = 0; index < 6; index += 1) {
    code += WORKSPACE_INVITE_CODE_CHARS[randomInt(WORKSPACE_INVITE_CODE_CHARS.length)];
  }
  return code;
}
