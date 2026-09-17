import * as dotenv from 'dotenv';
import { NodeEnv } from '@app/common';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { registerAs } from '@nestjs/config';
import { readDatabaseValue, readOptionalDatabaseValue } from './database-values';
import { ALL_ENTITIES } from '../data-access/all.entity';

dotenv.config();

const getDatabaseConfig = () => ({
  metadataProvider: ReflectMetadataProvider,
  driver: PostgreSqlDriver,
  dbName: readDatabaseValue(
    ['PROJECT_SERVICE_DB_DATABASE', 'DEFAULT_PG_DATABASE'],
    'ai-agent',
  ),
  host: readDatabaseValue(['PROJECT_SERVICE_DB_HOST'], 'localhost'),
  port: Number(readDatabaseValue(['PROJECT_SERVICE_DB_PORT', 'DEFAULT_PG_PORT'], '5432')),
  user: readDatabaseValue(['PROJECT_SERVICE_DB_USERNAME', 'DEFAULT_PG_USER'], 'postgres'),
  password: readDatabaseValue(
    ['PROJECT_SERVICE_DB_PASSWORD', 'DEFAULT_PG_PASSWORD'],
    'postgres',
  ),
  schema: readOptionalDatabaseValue('PROJECT_SERVICE_DB_SCHEMA', 'public'),
  baseDir: __dirname,
  debug: process.env.NODE_ENV !== NodeEnv.Production,
  entities: ALL_ENTITIES,
  cache: {
    enabled: false,
  },
});

export const databaseConfig = getDatabaseConfig();

export const dbConfiguration = registerAs('database', getDatabaseConfig);
