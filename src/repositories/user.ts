import { UserCreateServer, UserUpdateServer } from '@schema/user';
import { BaseRepository } from './base';

export class UserRepository extends BaseRepository {
  async create(payload: UserCreateServer) {
    this.logger.debug(`[UserRepository] Creating user, ${payload}`);

    return await this.prismaClient.user.create({
      data: payload,
    });
  }

  async update(id: string, payload: UserUpdateServer) {
    this.logger.debug(`[UserRepository] Updating user, ${id}`);

    return await this.prismaClient.user.update({
      where: {
        id,
      },
      data: payload,
    });
  }

  async getById(id: string) {
    this.logger.debug(`[UserRepository] Getting user, ${id}`);

    return await this.prismaClient.user.findUnique({
      where: {
        id,
      },
    });
  }

  async getByEmail(email: string) {
    this.logger.debug(`[UserRepository] Getting user, ${email}`);

    return await this.prismaClient.user.findUnique({
      where: {
        email,
      },
    });
  }

  async exists(email: string): Promise<boolean> {
    this.logger.debug(`[UserRepository] Checking if user exists, ${email}`);

    const exists = await this.prismaClient.user.count({
      where: {
        email,
      },
    });

    return exists > 0;
  }
}
