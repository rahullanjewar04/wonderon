import pino from 'pino';
import { ExtendedPrismaClient } from '@utils/prisma';

export abstract class BaseRepository {
  protected prismaClient: ExtendedPrismaClient;
  protected logger: pino.Logger;

  constructor(prismaClient: ExtendedPrismaClient, logger: pino.Logger) {
    this.prismaClient = prismaClient;
    this.logger = logger;
  }
}
