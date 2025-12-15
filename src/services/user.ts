import { UserRepository } from 'repositories/user';
import { BaseService } from './base';
import pino from 'pino';
import { UserCreateServer } from '@schema/user';

export class UserService extends BaseService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository, logger: pino.Logger) {
    super(logger);
    this.userRepository = userRepository;
  }

  async create(payload: UserCreateServer) {
    this.logger.debug(`[UserService] Creating user, ${payload}`);

    return await this.userRepository.create(payload);
  }

  async getByEmail(email: string) {
    this.logger.debug(`[UserService] Getting user, ${email}`);

    return await this.userRepository.getByEmail(email);
  }

  async getById(id: string) {
    this.logger.debug(`[UserService] Getting user, ${id}`);

    return await this.userRepository.getById(id);
  }

  async exists(email: string): Promise<boolean> {
    this.logger.debug(`[UserService] Checking if user exists, ${email}`);

    return await this.userRepository.exists(email);
  }
}
