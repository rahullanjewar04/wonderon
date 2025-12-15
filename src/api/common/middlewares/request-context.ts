// middleware/requestContext.ts
import { Request, Response, NextFunction } from 'express';
import { getContext, RequestContext, runWithContext } from '@utils/async-local-storage';
import { randomUUID } from 'node:crypto';
import { Logger } from '@utils/logger';

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction) {
  const ctx: RequestContext = {
    requestId: randomUUID(),
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    method: req.method,
    path: req.path,
    startTime: Date.now(),
  };

  // Add user/session after auth middleware
  runWithContext(ctx, () => {
    res.on('finish', () => {
      const context = getContext();
      if (context) {
        Logger.getInstance().info({
          duration: Date.now() - context.startTime,
          status: res.statusCode,
        });
      }
    });
    next();
  });
}
