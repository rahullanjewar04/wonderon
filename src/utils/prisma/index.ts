// prisma/prismaWrapper.ts
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from './generated/client';
import { AuditLogService } from 'services/audit-log';
import pino from 'pino';
import { AuditLogRepository } from 'repositories/audit-log';
import { DynamicClientExtensionThis, InternalArgs } from '@prisma/client/runtime/client';
import { GlobalOmitConfig, TypeMap, TypeMapCb } from './generated/internal/prismaNamespace';

export type ExtendedPrismaClient = DynamicClientExtensionThis<
  TypeMap<
    InternalArgs & {
      result: Record<never, never>;
      model: Record<never, never>;
      query: Record<never, never>;
      client: Record<never, never>;
    },
    GlobalOmitConfig | undefined
  >,
  TypeMapCb<GlobalOmitConfig | undefined>,
  {
    result: Record<never, never>;
    model: Record<never, never>;
    query: Record<never, never>;
    client: Record<never, never>;
  }
>;

enum Entity {
  USER = 'user',
  BOOK = 'book',
}

const modelTables: Record<string, string> = {
  User: Entity.USER,
  Book: Entity.BOOK,
};

export class PrismaWrapper {
  private static auditService: AuditLogService | null = null;
  private static instance: ExtendedPrismaClient | null = null;

  static getInstance(dbUrl?: string, logger?: pino.Logger) {
    if (!PrismaWrapper.instance) {
      if (!dbUrl) {
        throw new Error('dbUrl is required for initial Prisma setup');
      }

      if (!logger) {
        throw new Error('logger is required for initial Prisma setup');
      }

      const adapter = new PrismaBetterSqlite3({ url: dbUrl });
      const client = new PrismaClient({ adapter });
      const extendedClient = PrismaWrapper.extendClient(client);

      const auditRepository = new AuditLogRepository(extendedClient, logger);
      const auditService = new AuditLogService(auditRepository, logger);

      PrismaWrapper.auditService = auditService;
      PrismaWrapper.instance = extendedClient;
    }

    return PrismaWrapper.instance;
  }

  private static extendClient(client: PrismaClient) {
    const auditService = PrismaWrapper.auditService!;

    return client.$extends({
      query: {
        $allModels: {
          async create({ model, args, query }) {
            const result = await query(args); // Fix: Execute first, then audit
            if (model === 'AuditLog') {
              return result;
            }

            await auditService.logCreate(model, result.id!, result);
            return result;
          },

          async update({ model, args, query }) {
            const result = await query(args); // Fix: Execute first, capture result
            if (model === 'AuditLog') {
              return result;
            }

            const tableName = modelTables[model];
            const oldRecord = await (client as any)[tableName].findUnique({ where: args.where });
            await auditService.logUpdate(model, args.where.id!, oldRecord, result);
            return result;
          },

          /**
           * Delete a record from the database, logging the deleted record.
           * @param {object} args - The arguments for the delete query.
           * @param {function} query - The delete function to execute.
           * @returns {Promise<object>} - The deleted record.
           */
          async delete({ model, args, query }) {
            const result = await query(args); // Fix: Capture deleted record
            if (model === 'AuditLog') {
              return result;
            }

            const tableName = modelTables[model];
            const oldRecord = await (client as any)[tableName].findUnique({ where: args.where });
            await auditService.logDelete(model, oldRecord!.id!); // Fix: Use oldRecord.id
            return result;
          },
        },
      },
    });
  }
}
