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
  Logger.getInstance();

  const userRepository = new UserRepository(prismaClient);
  const userService = new UserService(userRepository);
  const userController = new UserController(userService, CryptoService.getInstance(), Jwt.getInstance());

  userRouter.get('/', userController.me.bind(userController));

  return userRouter;
}
