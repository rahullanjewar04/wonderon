import pino from 'pino';

export function getLogTailTransport(sourceToken: string) {
  return pino.transport({
    target: '@logtail/pino',
    options: {
      sourceToken,
    },
  });
}
