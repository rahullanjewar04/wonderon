import { ExtendedPrismaClient } from '@utils/prisma';

export abstract class BaseRepository {
  protected prismaClient: ExtendedPrismaClient;

  constructor(prismaClient: ExtendedPrismaClient) {
    this.prismaClient = prismaClient;
  }
}
