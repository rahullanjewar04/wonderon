import { TransportTargetOptions } from 'pino';
import { Config } from '@schema/config';

/**
 * Return a pino transport target for elasticsearch based on the provided log config.
 *
 * @param {Config['log']} log - The log configuration object.
 * @returns {TransportTargetOptions<Record<string, any>>} - The transport target options.
 */
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
