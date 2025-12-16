import { AuditLogListSortKeys } from '@schema/audit-log';
import { BookListSortKeys } from '@schema/book';
import { DEFAULT_TAKE } from '@schema/common';

// Types for clarity
export interface ParsedQueryParams {
  limit: number;
  cursor?: string;
  sort: { field: AuditLogListSortKeys | BookListSortKeys; order: 'asc' | 'desc' };
  filters: Record<string, any>;
}

export class BaseController {
  // protected logger: pino.Logger;
  // constructor(logger: pino.Logger) {
  //   this.logger = logger;
  // }

  /**
   * parseQueryParams
   *
   * Takes a query object and returns a normalized version with default values.
   * Default values are:
   * - limit: DEFAULT_TAKE
   * - cursor: undefined
   * - sort: { field: 'timestamp', order: 'desc' }
   *
   * @param query - Query object (e.g. from Express)
   * @returns Normalized query parameters
   */
  parseQueryParams(query: any): ParsedQueryParams {
    const { limit, cursor, sort, order, ...filters } = query ?? {};

    return {
      /**
       * Limit of results to return. Defaults to DEFAULT_TAKE.
       */
      limit: limit ? Number(limit) : DEFAULT_TAKE,

      /**
       * Cursor for pagination. No default value.
       */
      cursor: cursor as string | undefined,

      /**
       * Sort options. Defaults to { field: 'timestamp', order: 'desc' }.
       */
      sort: sort
        ? {
            /**
             * Field to sort by. Must be one of AuditLogListSortKeys or BookListSortKeys.
             */
            field: sort as AuditLogListSortKeys,
            /**
             * Sort order. Must be one of 'asc' or 'desc'.
             */
            order: (order ?? 'asc') as 'asc' | 'desc',
          }
        : { field: 'timestamp', order: 'desc' },

      /**
       * Filter options. No default value.
       */
      filters,
    };
  }
}
