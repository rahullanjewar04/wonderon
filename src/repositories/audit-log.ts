import { AuditLog, AuditLogList } from '@schema/audit-log';
import { BaseRepository } from './base';
import { AuditLogFindManyArgs } from '@utils/prisma/generated/models';
import { Logger } from '@utils/logger';

export class AuditLogRepository extends BaseRepository {
  async create(payload: AuditLog) {
    Logger.getInstance().debug({
      message: '[AuditLogRepository] Creating audit log',
      payload,
    });

    return await this.prismaClient.auditLog.create({
      data: payload,
    });
  }

  async getById(id: string) {
    Logger.getInstance().debug({
      message: '[AuditLogRepository] Getting audit log',
      id,
    });

    return await this.prismaClient.auditLog.findUnique({
      where: {
        id,
      },
    });
  }

  async list(payload: AuditLogList) {
    Logger.getInstance().debug({
      message: '[AuditLogRepository] Listing audit logs',
      payload,
    });

    const args: AuditLogFindManyArgs = {
      where: {},
      take: payload.take + 1,
      cursor: payload.cursor ? { id: payload.cursor } : undefined,
      orderBy: payload.sort
        ? {
            [payload.sort.field]: payload.sort.order,
          }
        : {},
    };

    if (payload.filters) {
      if (payload.filters.entity) args.where!['entity'] = payload.filters.entity;
      if (payload.filters.entityId) args.where!['entityId'] = payload.filters.entityId;
      if (payload.filters.action) args.where!['action'] = payload.filters.action;
      if (payload.filters.requestId) args.where!['requestId'] = payload.filters.requestId;
      if (payload.filters.ip) args.where!['ip'] = payload.filters.ip;
      if (payload.filters.master) args.where!['master'] = payload.filters.master;
      if (payload.filters.actorId) args.where!['actorId'] = payload.filters.actorId;
      if (payload.filters.from || payload.filters.to) {
        args.where!['timestamp'] = {};

        if (payload.filters.from) args.where!['timestamp'].gte = payload.filters.from;
        if (payload.filters.to) args.where!['timestamp'].lte = payload.filters.to;
      }
    }

    return await this.prismaClient.auditLog.findMany(args);
  }

  async delete(id: string) {
    Logger.getInstance().debug({
      message: '[AuditLogRepository] Deleting audit log',
      id,
    });

    return await this.prismaClient.auditLog.delete({
      where: {
        id,
      },
    });
  }
}
