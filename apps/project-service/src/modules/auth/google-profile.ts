import { UnauthorizedException } from '@nestjs/common';

export interface GoogleIdentityPayload {
  email?: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
}

export interface GoogleTokenInfo {
  aud?: string;
  azp?: string;
  email?: string;
  verified_email?: boolean;
}

export interface VerifiedGoogleProfile {
  email: string;
  name: string;
  picture: string;
}

export function parseVerifiedGoogleProfile(
  payload: GoogleIdentityPayload | null | undefined,
): VerifiedGoogleProfile {
  const email = payload?.email?.trim().toLowerCase();
  const name = payload?.name?.trim();
  if (!email || payload?.email_verified !== true) {
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
  if (!email || tokenInfo.verified_email !== true) {
    throw new UnauthorizedException('Google account email is not verified');
  }
  return { email };
}
