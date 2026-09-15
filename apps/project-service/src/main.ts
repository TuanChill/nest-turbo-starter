import {
  getAppCommonConfig,
  getWinstonConfig,
  logBootstrapInfo,
  PayloadValidationPipe,
  setupSwagger,
} from '@app/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import helmet from 'helmet';
import { WinstonModule } from 'nest-winston';
// oxlint-disable-next-line import/no-unassigned-import -- Nest decorators require reflect metadata at bootstrap.
import 'reflect-metadata';
import { getAppConfig } from './config/app.config';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const { appName, appPort } = getAppConfig();
  const { nodeEnv } = getAppCommonConfig();
  const logger = WinstonModule.createLogger(getWinstonConfig(appName, nodeEnv));

  const app = await NestFactory.create(AppModule, {
    logger,
  });

  const reflector = app.get(Reflector);

  app.use(helmet());
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'https://pm.capylabs.io',
    'http://localhost:3000',
  ].filter((origin): origin is string => Boolean(origin));

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.setGlobalPrefix('circle/api');
  app.useGlobalPipes(new PayloadValidationPipe());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  setupSwagger(app, appName, ['/circle']);

  await app.listen(appPort);

  logBootstrapInfo(app, {
    nodeEnv,
    logger,
    appPort,
  });
}

bootstrap();
