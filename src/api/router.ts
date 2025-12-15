import express, { Router } from 'express';
import { getV1Router } from './v1/routes/router';

export function getApiRouter() {
  const apiRouter = Router();

  apiRouter.use(express.json());
  apiRouter.use('/v1', getV1Router());

  return apiRouter;
}
