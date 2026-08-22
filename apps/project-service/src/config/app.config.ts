import { MicroserviceName } from '@app/core';
import { registerAs } from '@nestjs/config';

export const getAppConfig = () => ({
  appName: process.env.PROJECT_SERVICE_APP_NAME || 'Project Service',
  appPort: +process.env.PROJECT_SERVICE_APP_PORT || 3304,
  cacheTtlInSeconds: +process.env.PROJECT_SERVICE_APP_CACHE_TTL_SECONDS || 6 * 60,
  microserviceName: MicroserviceName.ProjectService,
});

export const appConfiguration = registerAs('app', getAppConfig);
