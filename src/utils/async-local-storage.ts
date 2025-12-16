import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * RequestContext is a simple data structure that holds information about the
 * current HTTP request. We use it to pass information from the request
 * context to downstream code that may need to access request metadata.
 *
 * This context is used to:
 * - Initialize the logger with request-aware information
 * - Populate audit logs with request metadata
 * - Pass request information to downstream services
 */
export interface RequestContext {
  /**
   * Unique id used to correlate logs and traces for this request
   */
  requestId: string;

  /**
   * User ID associated with the request. Available only after authentication
   * middleware has run.
   */
  userId?: string;

  /**
   * Session ID associated with the request. Available only after authentication
   * middleware has run.
   */
  sessionId?: string;

  /**
   * IP address of the client that made the request
   */
  ip: string;

  /**
   * HTTP method associated with the request
   */
  method: string;

  /**
   * Path associated with the request
   */
  path: string;

  /**
   * Timestamp for when the request started
   */
  startTime: number;

  /**
   * Optional old data used when computing diffs for audit logs
   */
  oldData?: any;
}

export const als = new AsyncLocalStorage<RequestContext>();

/**
 * Run a function within the context of the provided RequestContext.
 * @param ctx RequestContext to associate with the function execution
 * @param fn Function to execute within the RequestContext
 * @returns Result of the function execution
 */
export function runWithContext(ctx: RequestContext, fn: () => Promise<any> | any): Promise<any> {
  return als.run(ctx, fn);
}

/**
 * Retrieves the RequestContext associated with the current execution context.
 * @returns RequestContext if set, undefined otherwise
 */
export function getContext(): RequestContext | undefined {
  /**
   * ALS (AsyncLocalStorage) is a mechanism to store data that is
   * accessible only within the current async context. We use it to store
   * request metadata, such as the request ID, IP, method, path, and
   * startTime.
   */
  return als.getStore();
}
