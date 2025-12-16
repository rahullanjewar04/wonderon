import { Router } from 'express';
import { AuditLogController } from '../controllers/audit-log';
import { AuditLogRepository } from 'repositories/audit-log';
import { AuditLogService } from '@services/audit-log';
import { PrismaWrapper } from '@utils/prisma';
import { Logger } from '@utils/logger';

export function getAuditLogRouter() {
  const auditRouter = Router();

  const prismaClient = PrismaWrapper.getInstance();
  Logger.getInstance();

  const auditLogRepository = new AuditLogRepository(prismaClient);
  const auditLogService = new AuditLogService(auditLogRepository);
  const auditLogController = new AuditLogController(auditLogService);

  auditRouter.get('/', auditLogController.listLogs.bind(auditLogController));
  auditRouter.get('/:id', auditLogController.getLog.bind(auditLogController));

  return auditRouter;
}
