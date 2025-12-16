// config/AppConfig.ts
import { readFileSync } from 'node:fs';
import { Config, schema } from '@schema/config';
import path from 'node:path';

export class AppConfig {
  private static instance: Config | null = null;

  private constructor() {
    // Private constructor prevents direct instantiation
  }

  static getInstance(): Config {
    if (!AppConfig.instance) {
      AppConfig.instance = AppConfig.loadConfig();
    }
    return AppConfig.instance;
  }

  /**
   * Loads the application configuration from a JSON file and environment variables.
   *
   * The configuration is validated against the schema defined in @schema/config.
   * If the configuration is invalid, an error is thrown.
   *
   * @throws {Error} if the configuration is invalid
   * @returns {Config} the validated configuration
   */
  private static loadConfig(): Config {
    try {
      const env = process.env as any;
      const configFile = readFileSync(path.join(process.cwd(), 'config.json'), 'utf-8');
      const appConfig = JSON.parse(configFile);

      // Override configuration with environment variables
      // NODE_ENV is used to determine the environment (dev, staging, prod)
      appConfig.env = env.NODE_ENV || appConfig.env;

      // DB_URL is used to determine the database URL
      appConfig.dbUrl = env.DB_URL || appConfig.dbUrl;

      // ENCRYPTION_KEY is used to determine the encryption key
      appConfig.encryptionKey = env.ENCRYPTION_KEY || appConfig.encryptionKey;

      // JWT_SECRET is used to determine the JWT secret key
      appConfig.jwt = {
        secret: env.JWT_SECRET || appConfig.jwt.secret,
      };

      // REDIS_ variables are used to determine the Redis URL
      appConfig.redis = {
        url:
          env.REDIS_USERNAME && env.REDIS_PASSWORD
            ? `redis://${env.REDIS_USERNAME}:${env.REDIS_PASSWORD}@${appConfig.redis.host}`
            : `redis://${appConfig.redis.host}`,
      };

      // Validate the configuration against the schema
      const data = schema.parse(appConfig);
      return data;
    } catch (e) {
      console.error('Error loading config:', e);
      throw new Error(`Config validation failed: ${(e as Error).message}`);
    }
  }
}
