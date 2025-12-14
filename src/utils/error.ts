// ✅ String key → Number value
const ErrorCodes = {
  VALIDATION_ERROR: 1001,
  MISSING_FIELDS: 1002,
  UNAUTHORIZED: 1003,
  FORBIDDEN: 1004,
  NOT_FOUND: 1005,
  INTERNAL_SERVER_ERROR: 5001,
  DATABASE_ERROR: 5002,
} as const;

export class AppError extends Error {
  code: number;
  message: string;

  static VALIDATION_ERROR = ErrorCodes.VALIDATION_ERROR;
  static MISSING_FIELDS = ErrorCodes.MISSING_FIELDS;
  static UNAUTHORIZED = ErrorCodes.UNAUTHORIZED;
  static FORBIDDEN = ErrorCodes.FORBIDDEN;
  static NOT_FOUND = ErrorCodes.NOT_FOUND;
  static INTERNAL_SERVER_ERROR = ErrorCodes.INTERNAL_SERVER_ERROR;
  static DATABASE_ERROR = ErrorCodes.DATABASE_ERROR;

  constructor(code: number, message: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.message = message;
  }
}
