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

  private static loadConfig(): Config {
    try {
      const env = process.env as any;
      const configFile = readFileSync(path.join(process.cwd(), 'config.json'), 'utf-8');
      const appConfig = JSON.parse(configFile);

      // Override with environment variables
      appConfig.env = env.NODE_ENV || appConfig.env;
      appConfig.dbUrl = env.DB_URL || appConfig.dbUrl;
      appConfig.encryptionKey = env.ENCRYPTION_KEY || appConfig.encryptionKey;
      appConfig.jwt = {
        secret: env.JWT_SECRET || appConfig.jwt.secret,
      };

      appConfig.redis = {
        url:
          env.REDIS_USERNAME && env.REDIS_PASSWORD
            ? `redis://${env.REDIS_USERNAME}:${env.REDIS_PASSWORD}@${appConfig.redis.host}`
            : `redis://${appConfig.redis.host}`,
      };

      // Validate the config
      const data = schema.parse(appConfig);
      return data;
    } catch (e) {
      console.error('Error loading config:', e);
      throw new Error(`Config validation failed: ${(e as Error).message}`);
    }
  }
}
