import express from 'express';
import { als } from '@utils/async-local-storage';
import { AppError } from '@utils/error';
import { Logger } from '@utils/logger';
import z from 'zod';

export async function errorHandler(
  err: Error,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const context = als.getStore();
  Logger.getInstance().error(err);

  // Handle zod errors
  if (err instanceof z.ZodError) {
    const e = err as z.ZodError;
    return res.status(400).json({
      error: {
        code: AppError.VALIDATION_ERROR,
        message: e.message,
        details: e.flatten(),
        requestId: context?.requestId,
      },
    });
  }

  // Handle app errors
  if (err instanceof AppError) {
    const e = err as AppError;
    return res.status(err.code).json({
      error: {
        code: e.code,
        message: e.message,
        details: e.details,
        requestId: context?.requestId,
      },
    });
  }

  return res.status(500).json({
    error: {
      code: 500,
      message: 'Internal Server Error',
      requestId: context?.requestId,
    },
  });
}
