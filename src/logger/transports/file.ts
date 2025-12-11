import path from 'node:path';
import pino from 'pino';
import { Config } from '../../schema/config';

export function getFileTransport(log: Config['log']) {
  return pino.transport({
    target: 'pino-roll',
    options: {
      file: path.join(process.cwd(), log.file!.path), // Base filename
      frequency: log.file!.frequency, // or 'hourly', '10m'
      mkdir: true, // Auto-create directories
      size: log.file!.size, // Rotate if file exceeds size
      limit: { count: log.file!.limit }, // Keep last 7 files
      extension: log.file!.extension, // Optional file extension
    },
  });
}
