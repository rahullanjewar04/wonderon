// prisma/prismaWrapper.ts
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from './generated/client';
import { AuditService } from 'services/audit-log';

enum Entity {
  USER = 'user',
  BOOK = 'book',
}

const modelTables: Record<string, string> = {
  User: Entity.USER,
  Book: Entity.BOOK,
};

export class PrismaWrapper {
  private static instance: PrismaClient | null = null;
  private static auditService: AuditService | null = null;

  static getInstance(dbUrl?: string) {
    if (!PrismaWrapper.instance) {
      if (!dbUrl) {
        throw new Error('dbUrl is required for initial Prisma setup');
      }

      const adapter = new PrismaBetterSqlite3({ url: dbUrl });
      const client = new PrismaClient({ adapter });

      PrismaWrapper.instance = client;
      PrismaWrapper.auditService = new AuditService(client);

      PrismaWrapper.extendClient(client); // Fix: Use class name, not 'this'
    }

    return PrismaWrapper.instance!;
  }

  private static extendClient(client: PrismaClient) {
    const auditService = PrismaWrapper.auditService!;

    client.$extends({
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
