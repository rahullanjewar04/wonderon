import { Router } from 'express';

export function getAuthRouter() {
  const authRouter = Router();

  authRouter.post('/login');
  authRouter.post('/logout');
  authRouter.post('/register');
  return authRouter;
}
