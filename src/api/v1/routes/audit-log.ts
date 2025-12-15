import { Router } from 'express';
import { AuditLogController } from '../controllers/audit-log';
import { AuditLogRepository } from 'repositories/audit-log';
import { AuditLogService } from '@services/audit-log';
import { PrismaWrapper } from '@utils/prisma';
import { Logger } from '@utils/logger';

export function getAuditLogRouter() {
  const auditRouter = Router();

  const prismaClient = PrismaWrapper.getInstance();
  const logger = Logger.getInstance();

  const auditLogRepository = new AuditLogRepository(prismaClient, logger);
  const auditLogService = new AuditLogService(auditLogRepository, logger);
  const auditLogController = new AuditLogController(auditLogService, logger);

  auditRouter.get('/', auditLogController.listLogs.bind(auditLogController));
  auditRouter.get('/:id', auditLogController.getLog.bind(auditLogController));

  return auditRouter;
}
