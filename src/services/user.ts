import { UserRepository } from 'repositories/user';
import { BaseService } from './base';
import pino from 'pino';
import { UserCreateServer } from '@schema/user';
import { Logger } from '@utils/logger';

export class UserService extends BaseService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    super();
    this.userRepository = userRepository;
  }

  async create(payload: UserCreateServer) {
    Logger.getInstance().debug({
      message: '[UserService] Creating user',
      payload,
    });

    return await this.userRepository.create(payload);
  }

  async getByEmail(email: string) {
    Logger.getInstance().debug({
      message: '[UserService] Getting user',
      email,
    });

    return await this.userRepository.getByEmail(email);
  }

  async getById(id: string) {
    Logger.getInstance().debug({
      message: '[UserService] Getting user',
      id,
    });

    return await this.userRepository.getById(id);
  }

  async exists(email: string): Promise<boolean> {
    Logger.getInstance().debug({
      message: '[UserService] Checking if user exists',
      email,
    });

    return await this.userRepository.exists(email);
  }
}
