import { als } from 'utils/async-local-storage';
import { deepDiffRight } from '@utils/deep-diff';
import { auditConfig } from '@utils/audit';
import { BaseService } from './base';
import { AuditLogRepository } from 'repositories/audit-log';
import { Prisma } from '@utils/prisma/generated/client';
import { AuditLogList } from '@schema/audit-log';
import pino from 'pino';

export class AuditLogService extends BaseService {
  private auditLogRepository: AuditLogRepository;

  constructor(auditLogRepository: AuditLogRepository, logger: pino.Logger) {
    super(logger);
    this.auditLogRepository = auditLogRepository;
  }

  // Returns NEW object, doesn't touch original
  private sanitizeData(data: any, redactKeys: string[], excludeKeys: string[]): any {
    if (data === null || typeof data !== 'object') return data;

    const result: any = Array.isArray(data) ? [] : {};

    for (const key in data) {
      if (excludeKeys.includes(key)) {
        continue; // Skip entirely
      }

      if (redactKeys.includes(key)) {
        result[key] = '***REDACTED***';
      } else if (typeof data[key] === 'object') {
        result[key] = this.sanitizeData(data[key], redactKeys, excludeKeys);
      } else {
        result[key] = data[key];
      }
    }
    return result;
  }

  private getConfig(model: Prisma.ModelName) {
    return auditConfig[model.toLowerCase()];
  }

  private maybeSanitize(model: Prisma.ModelName, data: any) {
    const config = this.getConfig(model);
    return config?.track ? this.sanitizeData(data, config.redact, config.exclude) : data;
  }

  async logCreate(model: Prisma.ModelName, entityId: string, data: any) {
    const context = als.getStore()!;
    const sanitizedData = this.maybeSanitize(model, data); // Clone + sanitize

    await this.auditLogRepository.create({
      entity: model,
      entityId,
      action: 'CREATE',
      diff: sanitizedData,
      requestId: context.requestId,
      ip: context.ip,
      actorId: context.userId,
      master: context.userId ? false : true,
    });
  }

  async logUpdate(model: Prisma.ModelName, entityId: string, oldData: any, newData: any) {
    const context = als.getStore()!;
    const changes = deepDiffRight(oldData, newData);
    const sanitizedChanges = this.maybeSanitize(model, changes);

    await this.auditLogRepository.create({
      entity: model,
      entityId,
      action: 'UPDATE',
      diff: sanitizedChanges,
      requestId: context.requestId,
      ip: context.ip,
      actorId: context.userId,
      master: context.userId ? false : true,
    });
  }

  async logDelete(model: Prisma.ModelName, entityId: string) {
    const context = als.getStore()!;

    await this.auditLogRepository.create({
      entity: model,
      entityId,
      action: 'DELETE',
      requestId: context.requestId,
      ip: context.ip,
      actorId: context.userId,
      master: context.userId ? false : true,
    });
  }

  async getLog(id: string) {
    return await this.auditLogRepository.getById(id);
  }

  async listLogs(payload: AuditLogList) {
    return await this.auditLogRepository.list(payload);
  }
}
