import { Router } from 'express';
import { getUserRouter } from './user';
import { getBookRouter } from './book';
import { getAuditLogRouter } from './audit-log';
import { getAuthRouter } from './auth';
import { userAuthMiddleware } from '../middlewares/auth';
import { adminAuthMiddleware } from '../middlewares/admin';

export function getV1Router() {
  const v1Router = Router();

  // Open routes
  v1Router.use('/auth', getAuthRouter());

  // Protected routes
  v1Router.use(userAuthMiddleware);
  v1Router.use('/me', getUserRouter());
  v1Router.use('/books', getBookRouter());

  // Admin routes
  v1Router.use(adminAuthMiddleware);
  v1Router.use('/audit', getAuditLogRouter);

  return v1Router;
}
