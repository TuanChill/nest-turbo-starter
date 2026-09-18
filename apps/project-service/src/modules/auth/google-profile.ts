import { UnauthorizedException } from '@nestjs/common';

export interface GoogleIdentityPayload {
  email?: string;
  name?: string;
  picture?: string;
  email_verified?: boolean | string;
}

export interface GoogleTokenInfo {
  aud?: string;
  azp?: string;
  email?: string;
  email_verified?: boolean | string;
  verified_email?: boolean | string;
}

export interface VerifiedGoogleProfile {
  email: string;
  name: string;
  picture: string;
}

function isGoogleEmailVerified(value: unknown): boolean {
  return (
    value === true || (typeof value === 'string' && value.trim().toLowerCase() === 'true')
  );
}

export function parseVerifiedGoogleProfile(
  payload: GoogleIdentityPayload | null | undefined,
): VerifiedGoogleProfile {
  const email = payload?.email?.trim().toLowerCase();
  const name = payload?.name?.trim();
  if (!email || !isGoogleEmailVerified(payload?.email_verified)) {
    throw new UnauthorizedException('Google account email is not verified');
  }
  if (!name) {
    throw new UnauthorizedException('Google profile name is missing');
  }
  return { email, name, picture: payload?.picture?.trim() || '' };
}

export function parseVerifiedGoogleTokenInfo(
  tokenInfo: GoogleTokenInfo,
  clientId: string,
): { email: string } {
  if (tokenInfo.aud !== clientId) {
    throw new UnauthorizedException('Google token client ID mismatch');
  }
  const email = tokenInfo.email?.trim().toLowerCase();
  const emailVerified = tokenInfo.email_verified ?? tokenInfo.verified_email;
  if (!email || !isGoogleEmailVerified(emailVerified)) {
    throw new UnauthorizedException('Google account email is not verified');
  }
  return { email };
}
