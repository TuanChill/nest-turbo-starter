import { validationSchema } from '../../../../libs/common/src/config/config.validation';

describe('runtime configuration validation', () => {
  it('allows local development without optional providers', () => {
    const result = validationSchema.validate({ NODE_ENV: 'local' });

    expect(result.error).toBeUndefined();
  });

  it('requires the frontend origin and JWT secret in production', () => {
    const result = validationSchema.validate(
      { NODE_ENV: 'production' },
      { abortEarly: false },
    );

    expect(result.error?.details.map((detail) => detail.path.join('.'))).toEqual(
      expect.arrayContaining(['FRONTEND_URL', 'JWT_SECRET']),
    );
  });

  it('does not require disabled provider integrations', () => {
    const result = validationSchema.validate({
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://pm.capylabs.io',
      JWT_SECRET: 'a-production-secret-that-is-long-enough',
    });

    expect(result.error).toBeUndefined();
  });
});
