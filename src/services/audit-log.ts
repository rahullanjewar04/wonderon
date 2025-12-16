import { als } from 'utils/async-local-storage';
import { deepDiffRight } from '@utils/deep-diff';
import { auditConfig } from '@utils/audit';
import { BaseService } from './base';
import { AuditLogRepository } from 'repositories/audit-log';
import { Prisma } from '@utils/prisma/generated/client';
import { AuditLogList } from '@schema/audit-log';
import { PaginatedResult } from './types';
import { Logger } from '@utils/logger';

/**
 * AuditLogService
 *
 * Responsible for creating audit log entries. This service intentionally keeps
 * logic small: it sanitizes payloads according to auditConfig, reads per-request
 * context from async-local-storage (als), and delegates persistence to the
 * AuditLogRepository.
 *
 * Notes:
 * - The service depends on a repository and a logger; both are injected here.
 * - sanitizeData is defensive and returns a new object so callers don't mutate
 *   original domain objects when creating audit diffs.
 */
export class AuditLogService extends BaseService {
  private auditLogRepository: AuditLogRepository;

  constructor(auditLogRepository: AuditLogRepository) {
    // The logger is a pino child injected by the caller; keep BaseService behavior.
    super();
    this.auditLogRepository = auditLogRepository;
  }

  // Returns NEW object, doesn't touch original
  // This helper walks the object tree and either redacts or excludes keys based
  // on the configured audit rules. Keeping it local makes tests easier.
  private sanitizeData(data: any, redactKeys: string[], excludeKeys: string[]): any {
    if (data === null || typeof data !== 'object') return data;

    const result: any = Array.isArray(data) ? [] : {};

    for (const key in data) {
      if (excludeKeys.includes(key)) {
        // Skip keys that should not be present in audit logs at all.
        continue; // Skip entirely
      }

      if (redactKeys.includes(key)) {
        // Replace sensitive values with a fixed placeholder.
        result[key] = '***REDACTED***';
      } else if (typeof data[key] === 'object') {
        // Recurse for nested objects/arrays.
        result[key] = this.sanitizeData(data[key], redactKeys, excludeKeys);
      } else {
        result[key] = data[key];
      }
    }
    return result;
  }

  // Lookup audit configuration for a Prisma model by normalizing to lower-case.
  private getConfig(model: Prisma.ModelName) {
    return auditConfig[model.toLowerCase()];
  }

  // Apply sanitization only when the model is configured for tracking.
  private maybeSanitize(model: Prisma.ModelName, data: any) {
    const config = this.getConfig(model);
    return config?.track ? this.sanitizeData(data, config.redact, config.exclude) : data;
  }

  /**
   * logCreate
   *
   * Create a CREATE audit entry. We read request context (requestId, ip, userId)
   * from async-local-storage so callers don't need to pass context explicitly.
   */
  async logCreate(model: Prisma.ModelName, entityId: string, data: any) {
    Logger.getInstance().debug(`[AuditLogService] Logging create, ${model}, ${entityId}`);

    const context = als.getStore();
    const sanitizedData = this.maybeSanitize(model, data); // Clone + sanitize

    await this.auditLogRepository.create({
      entity: model,
      entityId,
      action: 'CREATE',
      diff: sanitizedData,
      requestId: context?.requestId,
      ip: context?.ip,
      actorId: context?.userId,
      // master indicates system-initiated actions when there's no user in context.
      master: context && context.userId ? false : true,
    });
  }

  /**
   * logUpdate
   *
   * Compute the diff between the previous and new record, sanitize it, and
   * persist an UPDATE audit entry. The deep diff util returns a representation
   * suitable for storing in the audit diff JSON column.
   */
  async logUpdate(model: Prisma.ModelName, entityId: string, oldData: any, newData: any) {
    Logger.getInstance().debug({
      message: '[AuditLogService] Logging update',
      model,
      entityId,
    });

    const context = als.getStore();
    const changes = deepDiffRight(oldData, newData);
    const sanitizedChanges = this.maybeSanitize(model, changes);

    await this.auditLogRepository.create({
      entity: model,
      entityId,
      action: 'UPDATE',
      diff: sanitizedChanges,
      requestId: context?.requestId,
      ip: context?.ip,
      actorId: context?.userId,
      master: context && context.userId ? false : true,
    });
  }

  /**
   * logDelete
   *
   * Persist a DELETE audit entry. Note that for deletes you may only have the
   * id available; callers should pass whatever context is needed to identify
   * the deleted record.
   */
  async logDelete(model: Prisma.ModelName, entityId: string) {
    Logger.getInstance().debug({
      message: '[AuditLogService] Logging delete',
      model,
      entityId,
    });

    const context = als.getStore();

    await this.auditLogRepository.create({
      entity: model,
      entityId,
      action: 'DELETE',
      requestId: context?.requestId,
      ip: context?.ip,
      actorId: context?.userId,
      master: context && context.userId ? false : true,
    });
  }

  // Retrieve a single audit log entry by id.
  async getLog(id: string) {
    Logger.getInstance().debug({
      message: '[AuditLogService] Getting audit log',
      id,
    });

    return await this.auditLogRepository.getById(id);
  }

  // List audit logs with pagination; wrap repository result in a small shape.
  async listLogs(payload: AuditLogList): Promise<PaginatedResult<Prisma.AuditLogModel>> {
    Logger.getInstance().debug({
      message: '[AuditLogService] Listing audit logs',
      payload,
    });

    const items = await this.auditLogRepository.list(payload);

    return {
      items: items.slice(0, payload.take),
      nextCursor: items.length > payload.take ? items[items.length - 1].id : undefined,
    };
  }
}
