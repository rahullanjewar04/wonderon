import pino from 'pino';
import { PrismaClient } from '@utils/prisma/generated/client';

export abstract class BaseRepository {
  protected prismaClient: PrismaClient;
  protected logger: pino.Logger;

  constructor(prismaClient: PrismaClient, logger: pino.Logger) {
    this.prismaClient = prismaClient;
    this.logger = logger;
  }
}
