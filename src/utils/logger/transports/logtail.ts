import pino, { TransportTargetOptions } from 'pino';

/**
 * Returns a pino transport target for Logtail.
 *
 * @param sourceToken The Logtail source token.
 * @returns A pino transport target for Logtail.
 */
export function getTransport(sourceToken: string): TransportTargetOptions<Record<string, any>> {
  return pino.transport({
    // The target is the @logtail/pino package
    target: '@logtail/pino',
    // The options are the source token
    options: {
      // The source token is required
      sourceToken,
    },
  });
}
