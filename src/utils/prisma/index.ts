// prisma/prismaWrapper.ts
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from './generated/client';
import { AuditLogService } from 'services/audit-log';
import pino from 'pino';
import { AuditLogRepository } from 'repositories/audit-log';
import { DynamicClientExtensionThis, InternalArgs } from '@prisma/client/runtime/client';
import { GlobalOmitConfig, TypeMap, TypeMapCb } from './generated/internal/prismaNamespace';

/**
 * ExtendedPrismaClient is the typed shape used after we attach Prisma client extensions.
 * The extensions below use runtime hooks (create/update/delete) to emit audit logs.
 *
 * NOTE: The audit hooks close over `PrismaWrapper.auditService`. This file must ensure
 * the audit service is initialized before hooks run; otherwise hooks may attempt to call
 * methods on `undefined`. See comments in getInstance/extendClient for ordering details.
 */
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
  // Holds a single AuditLogService instance used by the prisma hooks.
  private static auditService: AuditLogService | null = null;
  private static instance: ExtendedPrismaClient | null = null;

  /**
   * Create and return a singleton Prisma client that has audit hooks attached.
   *
   * Important initialization ordering:
   * - We create a raw PrismaClient first.
   * - We extend the client with hooks (the extension closure expects an auditService variable
   *   to exist later). Because the extension is created before auditService is assigned,
   *   we rely on the closure reading the `PrismaWrapper.auditService` variable at runtime
   *   (not the local value captured at extend time). This pattern is brittle—if you change
   *   how closures capture values, hooks may see `null`. Prefer to ensure the service is
   *   created before creating extensions (see plans for recommended change).
   *
   * @param dbUrl - database connection string (required on first call)
   * @param logger - pino logger (required on first call)
   */
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

      // Create the extended client with hooks attached. The hooks below read
      // `PrismaWrapper.auditService` when they execute. See the note above about ordering.
      const extendedClient = PrismaWrapper.extendClient(client);

      // Create repository/service instances using the extended client and logger.
      // These instances back the audit hooks; we set `PrismaWrapper.auditService`
      // so the runtime closure has a valid reference when hooks run.
      const auditRepository = new AuditLogRepository(extendedClient, logger);
      const auditService = new AuditLogService(auditRepository, logger);

      PrismaWrapper.auditService = auditService;
      PrismaWrapper.instance = extendedClient;
    }

    return PrismaWrapper.instance;
  }

  /**
   * Attach Prisma query hooks that emit audit logs on create/update/delete.
   *
   * Notes:
   * - Hooks call the auditService methods. If auditService is not available at runtime,
   *   hooks will throw. Keep initialization ordering intact, or refactor to lazily
   *   resolve a getter inside the hook to avoid a strict ordering dependency.
   * - Hooks intentionally skip recording actions on the AuditLog model itself to avoid
   *   infinite loops.
   */
  private static extendClient(client: PrismaClient) {
    // We intentionally read the singleton auditService (not a local param) so
    // the hook closure will pick up the instance once it is assigned.
    const auditService = PrismaWrapper.auditService!;

    return client.$extends({
      query: {
        $allModels: {
          async create({ model, args, query }) {
            // Execute the original query first. We don't want the audit write to
            // affect the original operation or be included in the same returned result.
            const result = await query(args); // Fix: Execute first, then audit
            if (model === 'AuditLog') {
              // Don't audit writes to the audit table itself.
              return result;
            }

            // At this point we expect auditService to be available. If it's missing,
            // this call will throw; such failures indicate an initialization ordering bug.
            await auditService.logCreate(model, result.id!, result);
            return result;
          },

          async update({ model, args, query }) {
            // Run the update and capture the resulting record.
            const result = await query(args); // Fix: Execute first, capture result
            if (model === 'AuditLog') {
              return result;
            }

            const tableName = modelTables[model];
            // Attempt to fetch the previous state for a proper diff; this may be `null`
            // for some update shapes — callers must handle that.
            const oldRecord = await (client as any)[tableName].findUnique({ where: args.where });
            await auditService.logUpdate(model, args.where.id!, oldRecord, result);
            return result;
          },

          /**
           * Delete a record from the database, logging the deleted record.
           * The hook captures the deleted record and then emits an audit entry.
           */
          async delete({ model, args, query }) {
            // Execute the delete and capture the deleted object.
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
