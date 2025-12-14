import { readFileSync } from 'node:fs';
import { Config, schema } from '../../schema/config';
import path from 'node:path';

export class AppConfig {
  static config: Config;

  static getInstance() {
    if (!AppConfig.config) {
      AppConfig.config = this.loadConfig();
    }
    return AppConfig.config;
  }

  static loadConfig(): Config {
    try {
      const env = process.env as any;
      const configFile = readFileSync(path.join(process.cwd(), 'config.example.json'), 'utf-8');
      const appConfig = JSON.parse(configFile);

      appConfig.env = env.NODE_ENV;
      appConfig.dbUrl = env.DB_URL;
      appConfig.jwt = {
        secret: env.JWT_SECRET,
      };
      appConfig.redis = {
        url: `redis://${env.REDIS_USERNAME}:${env.REDIS_PASSWORD}@${appConfig.redis.host}`,
      };

      // Validate
      const data = schema.parse(appConfig);

      return data;
    } catch (e) {
      console.error('Error loading config', e);
      throw e;
    }
  }
}
