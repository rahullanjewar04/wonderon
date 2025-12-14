// ✅ String key → Number value
const ErrorCodes = {
  VALIDATION_ERROR: 101,
  MISSING_FIELDS: 102,
  UNAUTHORIZED: 103,
  FORBIDDEN: 104,
  NOT_FOUND: 105,
  INTERNAL_SERVER_ERROR: 501,
  DATABASE_ERROR: 502,
} as const;

export class AppError extends Error {
  code: number;
  message: string;
  details?: string;

  static VALIDATION_ERROR = ErrorCodes.VALIDATION_ERROR;
  static MISSING_FIELDS = ErrorCodes.MISSING_FIELDS;
  static UNAUTHORIZED = ErrorCodes.UNAUTHORIZED;
  static FORBIDDEN = ErrorCodes.FORBIDDEN;
  static NOT_FOUND = ErrorCodes.NOT_FOUND;
  static INTERNAL_SERVER_ERROR = ErrorCodes.INTERNAL_SERVER_ERROR;
  static DATABASE_ERROR = ErrorCodes.DATABASE_ERROR;

  constructor(code: number, message: string, details?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.message = message;
    this.details = details;
  }
}
