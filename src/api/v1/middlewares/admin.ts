import { Request, Response, NextFunction } from 'express';
import { AppError } from '@utils/error';

export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.user.role !== 'admin') {
    throw new AppError(AppError.UNAUTHORIZED, 'Unauthorized');
  }

  next();
}
