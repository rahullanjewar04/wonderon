import { Request, Response, NextFunction } from 'express';
import { AppError } from 'utils/error';
import { Jwt } from 'utils/jwt';

export function userAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(AppError.FORBIDDEN, 'Authorization header is missing');
  }

  const token = authHeader.substring(7);
  const user = Jwt.getInstance().validate(token);

  req.user = user;
  next();
}
