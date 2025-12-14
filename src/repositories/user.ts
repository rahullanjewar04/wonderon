import pino from 'pino';
import { UserCreateServer, UserUpdateServer } from 'schema/user';
import { PrismaClient } from 'utils/prisma/generated/client';

export class UserRepository {
  private client: PrismaClient;
  private logger: pino.Logger;

  constructor(prismaClient: PrismaClient, logger: pino.Logger) {
    this.client = prismaClient;
    this.logger = logger;
  }

  async create(payload: UserCreateServer) {
    this.logger.debug(`[UserRepository] Creating user, ${payload}`);

    return await this.client.user.create({
      data: payload,
    });
  }

  async update(id: string, payload: UserUpdateServer) {
    this.logger.debug(`[UserRepository] Updating user, ${id}`);

    return await this.client.user.update({
      where: {
        id,
      },
      data: payload,
    });
  }

  async getById(id: string) {
    this.logger.debug(`[UserRepository] Getting user, ${id}`);

    return await this.client.user.findUnique({
      where: {
        id,
      },
    });
  }

  async getByEmail(email: string) {
    this.logger.debug(`[UserRepository] Getting user, ${email}`);

    return await this.client.user.findUnique({
      where: {
        email,
      },
    });
  }

  async exists(email: string): Promise<boolean> {
    this.logger.debug(`[UserRepository] Checking if user exists, ${email}`);

    const exists = await this.client.user.count({
      where: {
        email,
      },
    });

    return exists > 0;
  }
}
