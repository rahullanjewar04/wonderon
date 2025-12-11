import path from 'node:path';
import { TransportTargetOptions } from 'pino';
import { Config } from '../../schema/config';

export function getFileTransport(log: Config['log']): TransportTargetOptions<Record<string, any>> {
  return {
    target: 'pino-roll',
    options: {
      file: path.join(process.cwd(), log.file!.path),
      frequency: log.file!.frequency,
      mkdir: true,
      size: log.file!.size,
      limit: { count: log.file!.limit },
      extension: log.file!.extension,
    },
    level: log.level,
  };
}
