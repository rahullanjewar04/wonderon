import path from 'node:path';
import { TransportTargetOptions } from 'pino';
import { Config } from 'schema/config';

export function getTransport(log: Config['log']): TransportTargetOptions<Record<string, any>> {
  const dir = path.join(process.cwd(), log.file!.destination);
  const file = path.join(dir, `app.log`);

  return {
    target: 'pino-roll',
    options: {
      file,
      frequency: log.file!.frequency,
      mkdir: true,
      size: log.file!.size,
      limit: { count: log.file!.count },
      extension: log.file!.extension,
    },
    level: log.level,
  };
}
