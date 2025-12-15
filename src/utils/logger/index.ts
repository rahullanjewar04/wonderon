import pino, { TransportTargetOptions } from 'pino';
import { getTransport as getLogtailTransport } from './transports/logtail';
import { getTransport as getFileTransport } from './transports/file';
import { getTransport as getElasticSearchTransport } from './transports/elastic-search';
import { Config } from '@schema/config';
import { getContext } from '../async-local-storage';
import { auditConfig } from '@utils/audit';

export class Logger {
  private static instance: pino.Logger;

  private static buildTargets(log: Config['log']) {
    // Always write to console by default.
    const targets: TransportTargetOptions<Record<string, any>>[] = [
      {
        target: 'pino/file',
        options: { destination: 1 }, // 1 = stdout/console (JSON by default)
        level: log.level,
      },
    ];

    // Add more transports, as per config
    log.transports.forEach((transport) => {
      let target: TransportTargetOptions<Record<string, any>> | undefined;

      switch (transport) {
        case 'file':
          target = getFileTransport(log);
          break;
        case 'logtail':
          target = getLogtailTransport(log.logtail!.sourceToken);
          break;
        // Shouldn't reach here as we have zod validations but adding default just in case.
        case 'elasticsearch':
          target = getElasticSearchTransport(log);
          break;
        default:
          throw new Error('Invalid logger transport');
      }

      // Only add transport if defined
      if (target) {
        targets.push(target);
      }
    });

    return targets;
  }

  private static createLogger(log: Config['log']) {
    const auditConfigDetails = Object.values(auditConfig);
    const redactPaths: string[] = [];
    const excludePaths: string[] = [];

    auditConfigDetails.forEach((config) => {
      if (!config.track) {
        return;
      }

      redactPaths.push(...config.redact);
      excludePaths.push(...config.exclude);
    });

    const logger = pino({
      level: log.level,
      base: { service: 'book-app', version: '1.0.0' },
      timestamp: pino.stdTimeFunctions.isoTime,
      transport: {
        targets: this.buildTargets(log),
      },
      redact: {
        // Paths to redact
        paths: redactPaths,
        // TODO: implement paths to exclude, pino currently doesn't support this
      },
    });

    logger.info(`Created logger with transports ${log.transports}`);
    return logger;
  }

  public static getInstance(log?: Config['log']) {
    if (!Logger.instance) {
      if (!log) {
        throw new Error('Logger is not initialized');
      }

      Logger.instance = this.createLogger(log);
    }

    const context = getContext();

    if (!context) {
      return Logger.instance;
    }

    return Logger.instance.child(context);
  }
}
