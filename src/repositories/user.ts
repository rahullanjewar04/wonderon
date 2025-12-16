import { UserCreateServer, UserUpdateServer } from '@schema/user';
import { BaseRepository } from './base';
import { Logger } from '@utils/logger';

export class UserRepository extends BaseRepository {
  async create(payload: UserCreateServer) {
    Logger.getInstance().debug({
      message: '[UserRepository] Creating user',
      payload,
    });

    return await this.prismaClient.user.create({
      data: payload,
    });
  }

  async update(id: string, payload: UserUpdateServer) {
    Logger.getInstance().debug({
      message: '[UserRepository] Updating user',
      id,
      payload,
    });

    return await this.prismaClient.user.update({
      where: {
        id,
      },
      data: payload,
    });
  }

  async getById(id: string) {
    Logger.getInstance().debug({
      message: '[UserRepository] Getting user',
      id,
    });

    return await this.prismaClient.user.findUnique({
      where: {
        id,
      },
    });
  }

  async getByEmail(email: string) {
    Logger.getInstance().debug({
      message: '[UserRepository] Getting user',
      email,
    });

    return await this.prismaClient.user.findUnique({
      where: {
        email,
      },
    });
  }

  async exists(email: string): Promise<boolean> {
    Logger.getInstance().debug({
      message: '[UserRepository] Checking if user exists',
      email,
    });

    const exists = await this.prismaClient.user.count({
      where: {
        email,
      },
    });

    return exists > 0;
  }
}
