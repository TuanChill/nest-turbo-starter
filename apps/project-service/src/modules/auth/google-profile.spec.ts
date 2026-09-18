import { UnauthorizedException } from '@nestjs/common';
import {
  parseVerifiedGoogleProfile,
  parseVerifiedGoogleTokenInfo,
} from './google-profile';

describe('Google profile validation', () => {
  it('requires a verified profile with a real display name', () => {
    expect(
      parseVerifiedGoogleProfile({
        email: 'User@Example.com',
        email_verified: true,
        name: ' User Example ',
        picture: ' https://example.test/avatar.png ',
      }),
    ).toEqual({
      email: 'user@example.com',
      name: 'User Example',
      picture: 'https://example.test/avatar.png',
    });

    expect(() =>
      parseVerifiedGoogleProfile({ email: 'user@example.com', name: 'User' }),
    ).toThrow(UnauthorizedException);
    expect(() =>
      parseVerifiedGoogleProfile({
        email: 'user@example.com',
        email_verified: true,
      }),
    ).toThrow('Google profile name is missing');

    expect(
      parseVerifiedGoogleProfile({
        email: 'user@example.com',
        email_verified: 'true',
        name: 'User',
      }),
    ).toEqual({ email: 'user@example.com', name: 'User', picture: '' });
  });

  it('rejects unverified or incorrectly-audienced access tokens', () => {
    expect(
      parseVerifiedGoogleTokenInfo(
        { aud: 'client-1', email: 'user@example.com', verified_email: true },
        'client-1',
      ),
    ).toEqual({ email: 'user@example.com' });
    expect(
      parseVerifiedGoogleTokenInfo(
        { aud: 'client-1', email: 'user@example.com', email_verified: 'true' },
        'client-1',
      ),
    ).toEqual({ email: 'user@example.com' });

    expect(() =>
      parseVerifiedGoogleTokenInfo(
        { aud: 'other-client', email: 'user@example.com', verified_email: true },
        'client-1',
      ),
    ).toThrow('Google token client ID mismatch');
    expect(() =>
      parseVerifiedGoogleTokenInfo(
        {
          aud: 'other-client',
          azp: 'client-1',
          email: 'user@example.com',
          verified_email: true,
        },
        'client-1',
      ),
    ).toThrow('Google token client ID mismatch');
    expect(() =>
      parseVerifiedGoogleTokenInfo(
        { aud: 'client-1', email: 'user@example.com', verified_email: false },
        'client-1',
      ),
    ).toThrow('Google account email is not verified');
    expect(() =>
      parseVerifiedGoogleTokenInfo(
        { aud: 'client-1', email: 'user@example.com', email_verified: 'false' },
        'client-1',
      ),
    ).toThrow('Google account email is not verified');
  });
});
