import { AuditLog, AuditLogList } from '@schema/audit-log';
import { BaseRepository } from './base';
import { AuditLogFindManyArgs, AuditLogModel } from '@utils/prisma/generated/models';
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

    let whereClause = this.buildWhereClause(payload.filters);
    // Need to add id desc, so if we have duplicates for same timestamp we get the most recent one.
    const orderBy = payload.sort ? `${payload.sort.field} ${payload.sort.order.toUpperCase()}, id DESC` : 'id DESC';

    const cursorCondition = payload.nextCursor
      ? `(${payload.sort!.field} ${payload.sort!.order === 'desc' ? '<' : '>'} (SELECT ${payload.sort!.field} FROM audit_logs WHERE id = '${payload.nextCursor}' LIMIT 1))`
      : '';

    if (cursorCondition) {
      if (whereClause) {
        whereClause += ` AND ${cursorCondition}`;
      } else {
        whereClause = `WHERE ${cursorCondition}`;
      }
    }

    return await this.prismaClient.$queryRawUnsafe<AuditLogModel[]>(`
      SELECT * FROM audit_logs
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ${payload.take + 1}
    `);
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

  buildWhereClause(filters: any): string {
    const conditions = [];

    if (filters?.entity) conditions.push(`entity = ${filters.entity}`);
    if (filters?.entityId) conditions.push(`entityId = ${filters.entityId}`);
    if (filters?.action) conditions.push(`action = ${filters.action}`);
    if (filters?.from) conditions.push(`timestamp >= '${filters.from.toISOString()}'`);
    if (filters?.to) conditions.push(`timestamp <= '${filters.to.toISOString()}'`);
    if (filters?.fieldsChanged?.length) {
      conditions.push("action = 'UPDATE'");
      filters.fieldsChanged.forEach((field: string) =>
        conditions.push(`json_extract(diff, '$.${field}.new') IS NOT NULL`),
      );
    }

    return conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  }
}
