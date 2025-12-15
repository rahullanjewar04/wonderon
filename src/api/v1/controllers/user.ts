import { BaseController } from './base';
import pino from 'pino';
import { UserService } from '@services/user';
import { Request, Response } from 'express';
import {  loginSchema, userCreateClient, userCreateServer } from '@schema/user';
import { cloneDeep } from 'lodash';
import { CryptoService } from '@utils/encryption';
import { CreateJwtPayload, Jwt } from '@utils/jwt';
import { AppError } from '@utils/error';
import { Prisma } from '@utils/prisma/generated/client';

export class UserController extends BaseController {
  private userService: UserService;
  private cryptoService: CryptoService;
  private jwtService: Jwt;

  constructor(userService: UserService, logger: pino.Logger, cryptoService: CryptoService, jwtService: Jwt) {
    super(logger);
    this.userService = userService;
    this.cryptoService = cryptoService;
    this.jwtService = jwtService;
  }

  async register(req: Request, res: Response) {
    const payload = req.body;

    this.logger.info({
      message: '[UserController] register user',
      payload,
    });

    const clientData = userCreateClient.parse(payload);

    const serverData = cloneDeep(clientData);
    serverData.credentials = this.cryptoService.encrypt(clientData.credentials);
    const data = userCreateServer.parse(serverData);

    await this.userService.create(data);

    // No need to send back any user details
    res.status(201).send({});
  }

  async login(req: Request, res: Response) {
    const payload = req.body;

    this.logger.info({
      message: '[UserController] login user',
      payload,
    });

    const clientData = loginSchema.parse(payload);

    const serverUser = await this.userService.getByEmail(clientData.email);

    if (!serverUser) {
      throw new AppError(AppError.NOT_FOUND, 'User not found');
    }

    const credentials = this.cryptoService.decrypt(serverUser.credentials);

    if (credentials !== clientData.credentials) {
      throw new AppError(AppError.UNAUTHORIZED, 'Invalid credentials');
    }

    const jwtPayload: CreateJwtPayload = {
      id: serverUser.id,
      name: serverUser.name,
      email: serverUser.email,
      role: serverUser.role,
    };

    const token = this.jwtService.createToken(jwtPayload);
    res.status(200).send({ token });
  }

  async logout(req: Request, res: Response) {
    // TODO: Implement logout
    res.status(200).send({});
  }

  async me(req: Request, res: Response) {
    const id = req.user.id;

    this.logger.info({
      message: '[UserController] Get user',
      id,
    });

    const serviceResult = await this.userService.getById(id);

    if (!serviceResult) {
      throw new AppError(AppError.NOT_FOUND, 'User not found');
    }

    const getUserResult: Omit<Prisma.UserModel, 'credentials'> = {
      id: serviceResult.id,
      name: serviceResult.name,
      email: serviceResult.email,
      role: serviceResult.role,
      createdAt: serviceResult.createdAt,
      updatedAt: serviceResult.updatedAt,
    };

    res.status(200).send(getUserResult);
  }
}
