import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  requestId: string;
  userId?: string;
  sessionId?: string;
  ip: string;
  method: string;
  path: string;
  startTime: number;
}

export const als = new AsyncLocalStorage<RequestContext>();

export function runWithContext(ctx: RequestContext, fn: () => Promise<any> | any) {
  return als.run(ctx, fn);
}

export function getContext(): RequestContext | undefined {
  return als.getStore();
}
