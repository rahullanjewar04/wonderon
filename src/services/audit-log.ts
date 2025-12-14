// services/auditService.ts

import { als } from '../utils/async-local-storage';
import { deepDiffRight } from '../utils/deep-diff';
import { PrismaClient } from '../utils/prisma/generated/client';

export class AuditService {
  constructor(private client: PrismaClient) {}

  async logCreate(model: string, entityId: string, data: any) {
    const context = als.getStore()!;
    await this.client.auditLog.create({
      data: {
        entity: model,
        entityId,
        action: 'CREATE',
        diff: data,
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

    await this.client.auditLog.create({
      data: {
        entity: model,
        entityId,
        action: 'UPDATE',
        diff: changes,
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

  getTableName(model: string): string {
    const modelMap: Record<string, string> = {
      User: 'user',
      Book: 'book',
      Settings: 'settings',
      AuditLog: 'auditLogs',
    };
    return modelMap[model] || model.toLowerCase();
  }
}
