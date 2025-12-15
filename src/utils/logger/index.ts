import pino, { TransportTargetOptions } from 'pino';
import { getTransport as getLogtailTransport } from './transports/logtail';
import { getTransport as getFileTransport } from './transports/file';
import { getTransport as getElasticSearchTransport } from './transports/elastic-search';
import { Config } from '@schema/config';
import { getContext } from '../async-local-storage';
import { auditConfig } from '@utils/audit';

/**
 * Logger
 *
 * Thin wrapper around pino to centralize logger creation and ensure consumers
 * get a request-aware child logger when async-local-storage context exists.
 *
 * Notes for maintainers:
 * - The logger is created once via `getInstance(log)` and cached. Subsequent
 *   calls return the same instance (or a child with request context).
 * - `createLogger` collects redaction paths from the audit config and builds
 *   transport targets. If you add transports, update `buildTargets`.
 * - We intentionally return a child logger when a request context exists so
 *   that logs automatically include requestId, ip, etc.
 */
export class Logger {
  private static instance: pino.Logger;

  /**
   * buildTargets
   *
   * Build transport targets for pino based on provided config. Keep this small
   * and deterministic to make logging behavior predictable across environments.
   */
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
          // Logtail requires a source token available in config; the transport
          // builder is responsible for creating the proper pino transport target.
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

  /**
   * createLogger
   *
   * Create the pino logger instance. We derive a list of redaction paths from
   * audit configuration so PII doesn't leak into logs by mistake.
   *
   * Keep formatting and transport decisions here so they are easy to find.
   */
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

  /**
   * getInstance
   *
   * Public accessor for the singleton logger. On first call it requires a
   * configuration object; subsequent calls return the cached instance. If a
   * per-request context exists (via async-local-storage), return a child logger
   * tied to that context so logs include request-specific fields.
   */
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

    // Return a child logger bound to request context (requestId, ip, etc.)
    return Logger.instance.child(context);
  }
}
