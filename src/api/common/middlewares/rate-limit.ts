import { Config } from '@schema/config';
import { Handler } from 'express';
import pino from 'pino';
import { RateLimiterRedis, RateLimiterRes, RLWrapperBlackAndWhite } from 'rate-limiter-flexible';
import * as redis from 'redis';

/**
 * Returns a middleware that applies a rate limit to incoming requests.
 *
 * The returned middleware uses a Redis-backed rate limiter to track the
 * number of requests from each IP address. If the rate limit is exceeded,
 * the middleware will return a 429 response with a Retry-After header.
 *
 * @param {string} redisUrl - The URL of the Redis server to use for rate limiting
 * @param {Config['ratelimit']} rateLimit - The rate limit configuration
 * @param {pino.Logger} logger - The logger to use for warning messages
 * @returns {Handler} A middleware that applies rate limiting to incoming requests
 */
export async function getRateLimiterMiddleware(redisUrl: string, rateLimit: Config['ratelimit'], logger: pino.Logger) {
  const redisClient = redis.createClient({
    url: `${redisUrl}/1`,
    disableOfflineQueue: true,
  });
  await redisClient.connect();

  const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    points: 600,
    duration: 30,
  });

  const limiterWrapped = new RLWrapperBlackAndWhite({
    limiter: rateLimiter,
    isWhiteListed: (ip: string) => {
      if (/^(::ffff:)?10\.[12]?\d{1,2}\..+$/.test(ip) || ip === '::ffff:127.0.0.1') return true;

      return rateLimit.whitelist.some((whitelistedIP) => {
        return ip === whitelistedIP;
      });
    },
    runActionAnyway: false,
  });

  const rateLimiterMiddleware: Handler = (req, res, next) => {
    limiterWrapped

      .consume(req.ip!)
      .then((rateLimiterRes: RateLimiterRes) => {
        res.set({
          'X-RateLimit-Limit': rateLimiter.points,
          'X-RateLimit-Remaining': rateLimiterRes.remainingPoints,
          'X-RateLimit-Reset': new Date(Date.now() + rateLimiterRes.msBeforeNext),
        });
        next();
      })
      .catch((rateLimiterRes: RateLimiterRes) => {
        logger.warn(`Rate limit reached for IP: ${req.ip}`);
        res.set({
          'Retry-After': rateLimiterRes.msBeforeNext / 1000,
          'X-RateLimit-Limit': rateLimiter.points,
          'X-RateLimit-Remaining': rateLimiterRes.remainingPoints,
          'X-RateLimit-Reset': new Date(Date.now() + rateLimiterRes.msBeforeNext),
        });
        res.status(429).send('Too Many Requests');
      });
  };

  return rateLimiterMiddleware;
}
