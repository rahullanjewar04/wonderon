import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client';

/**
 * A singleton Prisma client
 */
export class PrismaWrapper {
  private static instance: PrismaClient;

  static getInstance(dbUrl?: string) {
    if (!PrismaWrapper.instance) {
      if (!dbUrl) {
        throw new Error('dbUrl is not required to initialize prisma');
      }

      const adapter = new PrismaBetterSqlite3({
        url: dbUrl,
      });
      PrismaWrapper.instance = new PrismaClient({
        adapter,
      });
    }
    return PrismaWrapper.instance;
  }
}
