import { Config } from '@schema/config';
import { Handler } from 'express';
import pino from 'pino';
import { RateLimiterRedis, RateLimiterRes, RLWrapperBlackAndWhite } from 'rate-limiter-flexible';
import * as redis from 'redis';

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
