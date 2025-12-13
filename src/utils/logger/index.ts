import pino, { TransportMultiOptions, TransportTargetOptions } from 'pino';
import { Config } from '../schema/config';
import { getLogTailTransport } from './transports/logtail';
import { getFileTransport } from './transports/file';

export class Logger {
  static instance: pino.Logger;

  static getInstance(log?: Config['log']) {
    if (!Logger.instance) {
      if (!log) {
        throw new Error('Logger is not initialized');
      }

      Logger.instance = this.createLogger(log);
    }
    return Logger.instance;
  }

  static createLogger(log: Config['log']) {
    const targets: TransportTargetOptions<Record<string, any>>[] = [
      {
        target: 'pino/file',
        options: { destination: 1 }, // 1 = stdout/console (JSON by default)
        level: log.level,
      },
    ];

    if (log.transport === 'file') {
      targets.push(getFileTransport(log));
    }

    if (log.transport === 'logtail') {
      targets.push(getLogTailTransport(log.logtail!.sourceToken));
    }

    const logger = pino({
      transport: {
        targets,
      },
    });

    return logger;
  }
}
