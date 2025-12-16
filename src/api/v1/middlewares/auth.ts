import { Request, Response, NextFunction } from 'express';
import { AppError } from '@utils/error';
import { Jwt } from '@utils/jwt';
import { als } from '@utils/async-local-storage';
import { UserRepository } from 'repositories/user';
import { PrismaWrapper } from '@utils/prisma';

export function getUserAuthMiddleware() {
  const userRepository = new UserRepository(PrismaWrapper.getInstance());

  return async function userAuthMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(AppError.FORBIDDEN, 'Authorization header is missing');
    }

    const token = authHeader.substring(7);
    const user = Jwt.getInstance().validate(token);

    const exists = await userRepository.getById(user.id);

    if (!exists) {
      throw new AppError(AppError.FORBIDDEN, 'User does not exist');
    }

    req.user = user;

    const context = als.getStore();

    if (context) {
      context.userId = user.id;
    }

    next();
  };
}
