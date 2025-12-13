import pino, { TransportTargetOptions } from 'pino';

export function getTransport(sourceToken: string): TransportTargetOptions<Record<string, any>> {
  return pino.transport({
    target: '@logtail/pino',
    options: {
      sourceToken,
    },
  });
}
