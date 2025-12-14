import express from 'express';
import { als } from '../../../utils/async-local-storage';
import { AppError } from '../../../utils/error';
import { Logger } from '../../../utils/logger';

export async function errorHandler(
  err: Error,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const context = als.getStore();
  Logger.getInstance().error(err);

  if (err instanceof AppError) {
    return res.status(err.code).json({
      error: {
        code: err.code,
        message: err.message,
        requestId: context?.requestId,
        details: err.message,
      },
    });
  }

  return res.status(500).json({
    error: {
      code: 123,
      message: 'message',
      details: 'details',
      requestId: context?.requestId,
    },
  });
}
