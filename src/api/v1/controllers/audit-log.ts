import { listLogsSchema } from '@schema/audit-log';
import { AuditLogService } from '@services/audit-log';
import { AppError } from '@utils/error';
import { Request, Response } from 'express';
import pino from 'pino';

export class AuditLogController {
  private auditLogService: AuditLogService;
  private logger: pino.Logger;

  constructor(auditLogService: AuditLogService, logger: pino.Logger) {
    this.auditLogService = auditLogService;
    this.logger = logger;
  }

  async listLogs(req: Request, res: Response) {
    const payload = req.query;

    this.logger.info({
      message: '[AuditLogController] List audit logs',
      payload,
    });

    const data = listLogsSchema.parse(payload);

    const result = await this.auditLogService.listLogs(data);

    res.status(200).send({ items: result });
  }

  async getLog(req: Request, res: Response) {
    const id = req.params.id;

    this.logger.info({
      message: '[AuditLogController] Get audit log',
      id,
    });

    const result = await this.auditLogService.getLog(id);

    if (!result) {
      throw new AppError(AppError.NOT_FOUND, 'Audit Log not found');
    }

    res.status(200).send(result);
  }
}
