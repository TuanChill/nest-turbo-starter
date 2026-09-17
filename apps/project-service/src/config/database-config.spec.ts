import { readDatabaseValue, readOptionalDatabaseValue } from './database-values';

describe('database configuration defaults', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    delete process.env.PROJECT_SERVICE_DB_SCHEMA;
  });

  it('keeps the safe public schema default in production', () => {
    process.env.NODE_ENV = 'production';

    expect(readOptionalDatabaseValue('PROJECT_SERVICE_DB_SCHEMA', 'public')).toBe(
      'public',
    );
  });

  it('still fails fast for missing production connection values', () => {
    process.env.NODE_ENV = 'production';

    expect(() => readDatabaseValue(['PROJECT_SERVICE_DB_PASSWORD'], 'postgres')).toThrow(
      'Database environment variable PROJECT_SERVICE_DB_PASSWORD is not configured',
    );
  });
});
