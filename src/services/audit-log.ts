import { als } from 'utils/async-local-storage';
import { deepDiffRight } from '@utils/deep-diff';
import { PrismaClient } from '@utils/prisma/generated/client';

interface AuditConfigDetails {
  track: boolean;
  redact: string[];
  exclude: string[];
}

const auditConfig: Record<string, AuditConfigDetails> = {
  user: { track: true, redact: ['credentials'], exclude: ['credentials'] },
  book: { track: true, redact: [], exclude: ['updatedAt'] },
};

export class AuditService {
  constructor(private client: PrismaClient) {}

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

  private getConfig(model: string) {
    return auditConfig[model.toLowerCase()];
  }

  private maybeSanitize(model: string, data: any) {
    const config = this.getConfig(model);
    return config?.track ? this.sanitizeData(data, config.redact, config.exclude) : data;
  }

  async logCreate(model: string, entityId: string, data: any) {
    const context = als.getStore()!;
    const sanitizedData = this.maybeSanitize(model, data); // Clone + sanitize

    await this.client.auditLog.create({
      data: {
        entity: model,
        entityId,
        action: 'CREATE',
        diff: sanitizedData,
        requestId: context.requestId,
        ip: context.ip,
        actorId: context.userId,
        master: context.userId ? false : true,
      },
    });
  }

  async logUpdate(model: string, entityId: string, oldData: any, newData: any) {
    const context = als.getStore()!;
    const changes = deepDiffRight(oldData, newData);
    const sanitizedChanges = this.maybeSanitize(model, changes);

    await this.client.auditLog.create({
      data: {
        entity: model,
        entityId,
        action: 'UPDATE',
        diff: sanitizedChanges,
        requestId: context.requestId,
        ip: context.ip,
        actorId: context.userId,
        master: context.userId ? false : true,
      },
    });
  }

  async logDelete(model: string, entityId: string) {
    const context = als.getStore()!;

    await this.client.auditLog.create({
      data: {
        entity: model,
        entityId,
        action: 'DELETE',
        requestId: context.requestId,
        ip: context.ip,
        actorId: context.userId,
        master: context.userId ? false : true,
      },
    });
  }
}
