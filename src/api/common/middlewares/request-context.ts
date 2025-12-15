// middleware/requestContext.ts
// This middleware creates a per-request context and installs it into an
// async-local-storage scope so other parts of the application can access
// request metadata (requestId, ip, method, path, startTime) without threading
// it through every function call.
import { Request, Response, NextFunction } from 'express';
import { getContext, RequestContext, runWithContext } from '@utils/async-local-storage';
import { randomUUID } from 'node:crypto';
import { Logger } from '@utils/logger';

/**
 * requestContextMiddleware
 *
 * - Generates a lightweight RequestContext and runs the rest of the request
 *   lifecycle inside the ALS scope so downstream code can call getContext().
 * - Registers a 'finish' handler to log a short summary (duration + status)
 *   once the response completes. Keep that handler cheap — it runs on the
 *   event loop after the response is sent.
 *
 * Notes:
 * - Authentication middleware that runs after this middleware can enrich the
 *   context (e.g., add userId) by mutating the same ctx object.
 * - Avoid performing heavy work in the finish handler; prefer background jobs
 *   or metrics exporters for longer-running operations.
 */
export function requestContextMiddleware(req: Request, res: Response, next: NextFunction) {
  const ctx: RequestContext = {
    // Unique id used to correlate logs and traces for this request
    requestId: randomUUID(),
    // Use req.ip where possible; fall back to socket address when needed
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    method: req.method,
    path: req.path,
    // Used to compute request duration for logging/metrics
    startTime: Date.now(),
  };

  // Create an ALS scope now. Later middleware (auth, etc.) can add session/user
  // information by mutating the same object (ctx.userId = ...).
  runWithContext(ctx, () => {
    // When response finishes, log a compact summary. Use the global Logger
    // so this message is captured by configured transports.
    res.on('finish', () => {
      const context = getContext();
      if (context) {
        Logger.getInstance().info({
          duration: Date.now() - context.startTime,
          status: res.statusCode,
        });
      }
    });

    // Continue middleware chain inside the ALS scope.
    next();
  });
}
