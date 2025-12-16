import express from 'express';
import { als } from '@utils/async-local-storage';
import { AppError } from '@utils/error';
import { Logger } from '@utils/logger';
import z from 'zod';

/**
 * Error handler middleware that catches all errors and returns a JSON response
 * with information about the error. The response will include the error code,
 * message, and details if applicable. If the error is an AppError,
 * the response code will be set to the corresponding HTTP status code. If
 * the error is a zod error, the response code will be set to 400.
 * All other errors will return a 500 response.
 *
 * @param {Error} err - The error to handle
 * @param {express.Request} req - The request object
 * @param {express.Response} res - The response object
 * @param {express.NextFunction} next - The next middleware function
 */
export async function errorHandler(
  err: Error,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const context = als.getStore();
  Logger.getInstance().error({ error: err.message, stack: err.stack });

  // Handle zod errors
  if (err instanceof z.ZodError) {
    const e = err as z.ZodError;
    const errors = e.flatten().fieldErrors;

    const message = Object.entries(errors)
      .map(([key, value]) => `${key}: ${(value as any)?.join('; ')}`)
      .join(', ');

    return res.status(400).json({
      error: {
        code: AppError.VALIDATION_ERROR,
        message: message,
        details: e.flatten().fieldErrors,
        requestId: context?.requestId,
      },
    });
  }

  // Handle app errors
  if (err instanceof AppError) {
    const e = err as AppError;
    let httpCode = 400;

    switch (e.code) {
      case AppError.UNAUTHORIZED:
        httpCode = 401;
        break;
      case AppError.FORBIDDEN:
        httpCode = 403;
        break;
      case AppError.NOT_FOUND:
        httpCode = 404;
        break;
      case AppError.VALIDATION_ERROR:
        httpCode = 400;
        break;
      default:
        break;
    }

    return res.status(httpCode).json({
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
