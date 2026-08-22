import * as dotenv from 'dotenv';
import { NodeEnv } from '@app/common';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { registerAs } from '@nestjs/config';
import { ALL_ENTITIES } from '../data-access/all.entity';

dotenv.config();

export const databaseConfig = {
  metadataProvider: ReflectMetadataProvider,
  driver: PostgreSqlDriver,
  dbName: process.env.PROJECT_SERVICE_DB_DATABASE || process.env.DEFAULT_PG_DATABASE || 'ai-agent',
  host: process.env.PROJECT_SERVICE_DB_HOST || 'localhost',
  port: process.env.PROJECT_SERVICE_DB_PORT
    ? Number(process.env.PROJECT_SERVICE_DB_PORT)
    : process.env.DEFAULT_PG_PORT
      ? Number(process.env.DEFAULT_PG_PORT)
      : 5432,
  user: process.env.PROJECT_SERVICE_DB_USERNAME || process.env.DEFAULT_PG_USER || 'postgres',
  password: process.env.PROJECT_SERVICE_DB_PASSWORD || process.env.DEFAULT_PG_PASSWORD || 'postgres',
  schema: process.env.PROJECT_SERVICE_DB_SCHEMA || 'public',
  baseDir: __dirname,
  debug: process.env.NODE_ENV !== NodeEnv.Production,
  entities: ALL_ENTITIES,
  cache: {
    enabled: false,
  },
};

export const dbConfiguration = registerAs('database', () => databaseConfig);
