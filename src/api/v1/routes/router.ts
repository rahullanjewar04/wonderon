import { Router } from 'express';
import { userRouter } from './user';
import { bookRouter } from './book';
import { auditRouter } from './audit-log';
import { authRouter } from './auth';
import { userAuthMiddleware } from '../middlewares/auth';
import { adminAuthMiddleware } from '../middlewares/admin';

export const v1Router = Router();

// Open routes
v1Router.use('/auth', authRouter);

// Protected routes
v1Router.use(userAuthMiddleware);
v1Router.use('/me', userRouter);
v1Router.use('/books', bookRouter);

// Admin routes
v1Router.use(adminAuthMiddleware);
v1Router.use('/audit', auditRouter);
