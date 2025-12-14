import express, { Router } from 'express';
import { v1Router } from './v1/routes/router';

export const apiRouter = Router();

apiRouter.use(express.json());

apiRouter.use('/v1', v1Router);
