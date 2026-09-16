import * as Joi from 'joi';
import { JwtAlgorithm, NodeEnv } from '../enums';

/**
 * Validate only configuration that every production service must have.
 *
 * Provider integrations (Google, SES, S3, Kafka, and RabbitMQ) are optional
 * features and are validated by the feature when it is enabled. Requiring
 * every provider here made the old schema unusable for both local development
 * and deployments that intentionally do not configure those providers.
 */
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid(...Object.values(NodeEnv))
    .default(NodeEnv.Local),
  FRONTEND_URL: Joi.string()
    .uri({ allowRelative: false })
    .allow('')
    .when('NODE_ENV', {
      is: NodeEnv.Production,
      then: Joi.string().uri({ allowRelative: false }).required(),
    }),
  JWT_SECRET: Joi.string()
    .min(16)
    .when('NODE_ENV', {
      is: NodeEnv.Production,
      then: Joi.string().min(16).required(),
    }),
  JWT_ALGORITHM: Joi.string()
    .valid(...Object.values(JwtAlgorithm))
    .default(JwtAlgorithm.HS256),
  JWT_ACCESS_TOKEN_EXPIRES_IN: Joi.string().optional(),
  JWT_REFRESH_TOKEN_EXPIRES_IN: Joi.string().optional(),
}).unknown(true);
