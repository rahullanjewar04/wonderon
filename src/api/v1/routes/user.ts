import { UserService } from '@services/user';
import { Logger } from '@utils/logger';
import { PrismaWrapper } from '@utils/prisma';
import { Router } from 'express';
import { UserRepository } from 'repositories/user';
import { UserController } from '../controllers/user';
import { CryptoService } from '@utils/encryption';
import { Jwt } from '@utils/jwt';

export function getUserRouter() {
  const userRouter = Router();

  const prismaClient = PrismaWrapper.getInstance();
  const logger = Logger.getInstance();

  const userRepository = new UserRepository(prismaClient, logger);
  const userService = new UserService(userRepository, logger);
  const userController = new UserController(userService, logger, CryptoService.getInstance(), Jwt.getInstance());

  userRouter.get('/me', userController.me.bind(userController));

  return userRouter;
}
