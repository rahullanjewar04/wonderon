import { Router } from 'express';

export const authRouter = Router();

authRouter.post('/login');
authRouter.post('/logout');
authRouter.post('/register');
