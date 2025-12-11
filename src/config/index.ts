import { Config, schema } from '../schema/config';

export class AppConfig {
  static config: Config;

  static getInstance() {
    if (!AppConfig.config) {
      AppConfig.config = this.loadConfig();
    }
    return AppConfig.config;
  }

  static loadConfig(): Config {
    const env = process.env as any;

    const config = {
      port: ~~env.PORT,
      env: env.NODE_ENV,
      jwt: {
        secret: env.JWT_SECRET,
      },
      log: {
        level: env.LOG_LEVEL,
        transport: env.LOG_TRANSPORT,
        file:
          env.LOG_TRANSPORT === 'file'
            ? {
                frequency: env.LOG_FILE_FREQUENCY,
                path: env.LOG_FILE_PATH,
                size: env.LOG_FILE_SIZE,
                limit: ~~env.LOG_FILE_LIMIT,
                extension: env.LOG_FILE_EXTENSION,
              }
            : undefined,
        logtail:
          env.LOG_TRANSPORT === 'logtail'
            ? {
                sourceToken: env.LOG_LOGTAIL_SOURCE_TOKEN,
              }
            : undefined,
      },
      dbUrl: env.DB_URL,
    };

    // Validate
    const data = schema.parse(config);

    return data;
  }
}
