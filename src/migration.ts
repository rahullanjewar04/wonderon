import { PrismaWrapper } from '@utils/prisma';
import { AppConfig } from '@utils/config';
import { Logger } from '@utils/logger';
import { CryptoService } from '@utils/encryption';
import { Jwt } from '@utils/jwt';
import { seed } from './migrations/seed';

void (async () => {
  const config = AppConfig.getInstance();

  Logger.getInstance(config.log);
  CryptoService.getInstance(config.encryptionKey);
  Jwt.getInstance(config.jwt.secret);

  // Initialize Prisma, we do audit logging at prisma
  PrismaWrapper.getInstance(config.dbUrl);

  // Seed the database with dummy data
  await seed();

  // Run other migrations
  process.exit();
})();
