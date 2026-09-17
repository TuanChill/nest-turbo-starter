import * as dotenv from 'dotenv';
import { NodeEnv } from '@app/common';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { registerAs } from '@nestjs/config';
import * as entities from '../data-access/all.entity';

dotenv.config();

const readDatabaseValue = (name: string, localFallback?: string) => {
  const configured = process.env[name]?.trim();
  if (process.env.NODE_ENV === NodeEnv.Production && !configured) {
    throw new Error(`Database environment variable ${name} is not configured`);
  }
  return configured ?? localFallback;
};

export const readOptionalDatabaseValue = (name: string, fallback: string) =>
  process.env[name]?.trim() || fallback;

const getDatabaseConfig = () => ({
  metadataProvider: ReflectMetadataProvider,
  driver: PostgreSqlDriver,
  dbName: readDatabaseValue('USER_SERVICE_DB_DATABASE', ''),
  host: readDatabaseValue('USER_SERVICE_DB_HOST', 'localhost'),
  port: Number(readDatabaseValue('USER_SERVICE_DB_PORT', '5432')),
  user: readDatabaseValue('USER_SERVICE_DB_USERNAME', ''),
  password: readDatabaseValue('USER_SERVICE_DB_PASSWORD', ''),
  schema: readOptionalDatabaseValue('USER_SERVICE_DB_SCHEMA', 'public'),
  baseDir: __dirname,
  debug: process.env.USER_SERVICE_NODE_ENV === NodeEnv.Production,
  entities: Object.values(entities),
  cache: {
    enabled: false,
  },
});

export const databaseConfig = getDatabaseConfig();

export const dbConfiguration = registerAs('database', getDatabaseConfig);
