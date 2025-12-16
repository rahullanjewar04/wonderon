import { UserService } from '@services/user';
import { Logger } from '@utils/logger';
import { PrismaWrapper } from '@utils/prisma';
import { Router } from 'express';
import { UserRepository } from 'repositories/user';
import { UserController } from '../controllers/user';
import { CryptoService } from '@utils/encryption';
import { Jwt } from '@utils/jwt';

export function getAuthRouter() {
  const authRouter = Router();

  const prismaClient = PrismaWrapper.getInstance();
  const logger = Logger.getInstance();

  const userRepository = new UserRepository(prismaClient);
  const userService = new UserService(userRepository);
  const userController = new UserController(userService, CryptoService.getInstance(), Jwt.getInstance());

  authRouter.post('/login', userController.login.bind(userController));
  authRouter.post('/logout', userController.logout.bind(userController));
  authRouter.post('/register', userController.register.bind(userController));

  return authRouter;
}
