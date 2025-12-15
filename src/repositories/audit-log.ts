import { AuditLog, AuditLogList } from '@schema/audit-log';
import { BaseRepository } from './base';
import { AuditLogFindManyArgs } from '@utils/prisma/generated/models';

export class AuditLogRepository extends BaseRepository {
  async create(payload: AuditLog) {
    this.logger.debug(`[AuditLogRepository] Creating audit log, ${payload}`);

    return await this.prismaClient.auditLog.create({
      data: payload,
    });
  }

  async getById(id: string) {
    this.logger.debug(`[AuditLogRepository] Getting audit log, ${id}`);

    return await this.prismaClient.auditLog.findUnique({
      where: {
        id,
      },
    });
  }

  async list(payload: AuditLogList) {
    this.logger.debug(`[AuditLogRepository] Listing audit logs, ${payload}`);

    const args: AuditLogFindManyArgs = {
      where: {},
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

      if (payload.filters.fieldsChanged) {
        args.where!['diff'] = {};
      }
    }

    return await this.prismaClient.auditLog.findMany({
      take: payload.take + 1,
      cursor: { id: payload.cursor },
      where: args.where,
    });
  }

  async delete(id: string) {
    this.logger.debug(`[AuditLogRepository] Deleting audit log, ${id}`);

    return await this.prismaClient.auditLog.delete({
      where: {
        id,
      },
    });
  }
}
