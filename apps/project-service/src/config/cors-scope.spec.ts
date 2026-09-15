import { getAllowedCorsOrigins } from '../../../../libs/common/src/config/cors.config';

describe('getAllowedCorsOrigins', () => {
  it('keeps production and local development origins available', () => {
    expect(getAllowedCorsOrigins('https://pm.capylabs.io')).toEqual([
      'https://pm.capylabs.io',
      'http://localhost:3000',
      'http://localhost:3001',
    ]);
  });

  it('does not trust arbitrary FRONTEND_URL values', () => {
    expect(getAllowedCorsOrigins('https://evil.example')).toEqual([
      'https://pm.capylabs.io',
      'http://localhost:3000',
      'http://localhost:3001',
    ]);
  });

  it('allows a localhost development port without allowing a remote origin', () => {
    expect(getAllowedCorsOrigins('http://localhost:3002')).toContain(
      'http://localhost:3002',
    );
    expect(getAllowedCorsOrigins('https://preview.pm.capylabs.io')).not.toContain(
      'https://preview.pm.capylabs.io',
    );
  });
});
