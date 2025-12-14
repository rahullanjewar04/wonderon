import { Router } from 'express';
import { userRouter } from './user';
import { bookRouter } from './book';
import { auditRouter } from './audit-log';
import { authRouter } from './auth';

export const v1Router = Router();

v1Router.use('/auth', authRouter);
v1Router.use('/me', userRouter);
v1Router.use('/books', bookRouter);
v1Router.use('/audit', auditRouter);
