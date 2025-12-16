import { BaseController } from './base';
import { UserService } from '@services/user';
import { Request, Response } from 'express';
import { loginSchema, userCreateClient, userCreateServer } from '@schema/user';
import { cloneDeep } from 'lodash';
import { CryptoService } from '@utils/encryption';
import { CreateJwtPayload, Jwt } from '@utils/jwt';
import { AppError } from '@utils/error';
import { Prisma } from '@utils/prisma/generated/client';
import { Logger } from '@utils/logger';

export class UserController extends BaseController {
  private userService: UserService;
  private cryptoService: CryptoService;
  private jwtService: Jwt;

  constructor(userService: UserService, cryptoService: CryptoService, jwtService: Jwt) {
    super();
    this.userService = userService;
    this.cryptoService = cryptoService;
    this.jwtService = jwtService;
  }

  /**
   * Register a new user.
   * @param {Request} req - The HTTP request.
   * @param {Response} res - The HTTP response.
   * @throws AppError - If the user data is invalid
   */
  async register(req: Request, res: Response) {
    const payload = req.body;

    Logger.getInstance().info({
      message: '[UserController] register user',
      payload,
    });

    // Validate the provided user data
    const clientData = userCreateClient.parse(payload);

    // Clone the validated user data to create a server version
    const serverData = cloneDeep(clientData);

    // Encrypt the credentials before storing them in the database
    serverData.credentials = this.cryptoService.encrypt(clientData.credentials);

    // Validate the server version of the user data
    const data = userCreateServer.parse(serverData);

    // Create the user in the database
    await this.userService.create(data);

    // No need to send back any user details
    res.status(201).send({});
  }

  /**
   * Log in a user with the provided credentials.
   * @param {Request} req - The HTTP request.
   * @param {Response} res - The HTTP response.
   * @throws AppError - If the user is not found or the credentials are invalid
   */
  async login(req: Request, res: Response) {
    const payload = req.body;

    Logger.getInstance().info({
      message: '[UserController] login user',
      payload,
    });

    // Validate the provided credentials
    const clientData = loginSchema.parse(payload);

    // Get the user data from the database
    const serverUser = await this.userService.getByEmail(clientData.email);

    if (!serverUser) {
      throw new AppError(AppError.NOT_FOUND, 'User not found');
    }

    // Decrypt the stored credentials
    const credentials = this.cryptoService.decrypt(serverUser.credentials);

    // Check if the provided credentials match the stored ones
    if (credentials !== clientData.credentials) {
      throw new AppError(AppError.UNAUTHORIZED, 'Invalid credentials');
    }

    // Create a JWT payload
    const jwtPayload: CreateJwtPayload = {
      id: serverUser.id,
      name: serverUser.name,
      email: serverUser.email,
      role: serverUser.role,
    };

    // Create a JWT token
    const token = this.jwtService.createToken(jwtPayload);

    // Return the JWT token
    res.status(200).send({ token });
  }

  async logout(req: Request, res: Response) {
    // TODO: Implement logout
    res.status(200).send({});
  }

  /**
   * Get the user data of the user making the request.
   * @param {Request} req - The HTTP request.
   * @param {Response} res - The HTTP response.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  async me(req: Request, res: Response) {
    const id = req.user.id;

    Logger.getInstance().info({
      message: '[UserController] Get user',
      id,
    });

    // Get the user from the database
    const serviceResult = await this.userService.getById(id);

    if (!serviceResult) {
      // If the user is not found, throw an error
      throw new AppError(AppError.NOT_FOUND, 'User not found');
    }

    // Create a new object that excludes the credentials field
    const getUserResult: Omit<Prisma.UserModel, 'credentials'> = {
      id: serviceResult.id,
      name: serviceResult.name,
      email: serviceResult.email,
      role: serviceResult.role,
      createdAt: serviceResult.createdAt,
      updatedAt: serviceResult.updatedAt,
    };

    // Send the response
    res.status(200).send(getUserResult);
  }
}
