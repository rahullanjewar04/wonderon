import { AuditLogList, listLogsSchema, AuditLogListSortKeys } from '@schema/audit-log';
import { AuditLogService } from '@services/audit-log';
import { AppError } from '@utils/error';
import { Request, Response } from 'express';
import { BaseController } from './base';
import { Logger } from '@utils/logger';
import { DEFAULT_TAKE } from '@schema/common';

export class AuditLogController extends BaseController {
  private auditLogService: AuditLogService;

  /**
   * Constructor for AuditLogController.
   * @param {AuditLogService} auditLogService - injected AuditLogService instance.
   */
  constructor(auditLogService: AuditLogService) {
    super();
    this.auditLogService = auditLogService;
  }

  /**
   * Retrieves a single audit log entry by ID.
   * @param {Request} req - The HTTP request.
   * @param {Response} res - The HTTP response.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  async getLog(req: Request, res: Response) {
    const id = req.params.id;

    // Log the request and include the ID
    Logger.getInstance().info({
      message: '[AuditLogController] Get audit log',
      id,
    });

    // Attempt to retrieve the audit log entry
    const result = await this.auditLogService.getLog(id);

    if (!result) {
      // If the audit log entry is not found, throw an error
      throw new AppError(AppError.NOT_FOUND, 'Audit Log not found');
    }

    // Return the result
    res.status(200).send(result);
  }

  /**
   * Lists audit logs.
   * @param {Request} req - The HTTP request.
   * @param {Response} res - The HTTP response.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   * @description
   *   This method lists audit logs based on the provided parameters.
   *   The parameters include the filters, the number of audit logs to take, the cursor to start from, and the sort order.
   */
  async listLogs(req: Request, res: Response) {
    const payload = this.parseQueryParams(req.query);

    // Normalize date filters: convert strings to Date objects if applicable
    let filters = this.normalizeDateFilters(payload.filters);

    // Normalize fields changed filters: convert strings to arrays of strings if applicable
    filters = this.normalizeFieldsChangedFilters(filters);

    const clientPayload: AuditLogList = {
      // The filters for the audit logs
      filters,
      // The number of audit logs to take
      take: payload.limit,
      // The sort order
      sort: payload.sort as { field: AuditLogListSortKeys; order: 'asc' | 'desc' },
    };

    // If a cursor is provided, add it to the client payload
    if (payload.cursor) {
      clientPayload.cursor = payload.cursor;
    }

    // Log the request
    Logger.getInstance().info({
      message: '[AuditLogController] List audit logs',
      clientPayload,
    });

    // Parse the client payload using the listLogsSchema
    const data = listLogsSchema.parse(clientPayload);

    // List the audit logs
    const result = await this.auditLogService.listLogs(data);

    // Send the response
    res.status(200).send(result);
  }

  /**
   * Normalize date filters in the given filters object.
   *
   * Date filters are strings that represent dates in the ISO 8601 format.
   * This function takes those strings and converts them to Date objects.
   *
   * @param filters - The filters object to normalize.
   * @returns The normalized filters object.
   */
  normalizeDateFilters(filters: Record<string, any>): Record<string, any> {
    const normalized = { ...filters };

    /**
     * If the filter has a 'from' date, convert it from a string to a Date object.
     */
    if (filters.from) normalized.from = new Date(filters.from);

    /**
     * If the filter has a 'to' date, convert it from a string to a Date object.
     */
    if (filters.to) normalized.to = new Date(filters.to);

    return normalized;
  }

  /**
   * Normalize the fieldsChanged filter in the given filters object.
   *
   * The fieldsChanged filter is a string that contains a comma-separated list of field names.
   * This function takes that string and converts it to an array of field names.
   *
   * @param filters - The filters object to normalize.
   * @returns The normalized filters object.
   */
  normalizeFieldsChangedFilters(filters: Record<string, any>): Record<string, any> {
    const normalized = { ...filters };

    /**
     * If the filter has a fieldsChanged property, convert it from a string to an array of field names.
     */
    if (filters.fieldsChanged) normalized.fieldsChanged = filters.fieldsChanged.split(',');

    return normalized;
  }
}
