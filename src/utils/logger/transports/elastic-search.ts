import path from 'node:path';
import { TransportTargetOptions } from 'pino';
import { Config } from '../../../schema/config';

export function getTransport(log: Config['log']): TransportTargetOptions<Record<string, any>> {
  return {
    target: 'pino-elasticsearch',
    options: {
      index: log.elasticSearch!.index,
      node: log.elasticSearch!.node,
      esVersion: log.elasticSearch!.esVersion,
      flushBytes: log.elasticSearch!.flushBytes,
    },
    level: log.level,
  };
}
