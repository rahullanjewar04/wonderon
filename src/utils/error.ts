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

/**
 * AppError is a custom error class that provides more information
 * about the error.
 *
 * It has the following properties:
 *   - code: The error code. Must be one of the ErrorCodes constants.
 *   - message: The error message.
 *   - details: Optional details about the error.
 */
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

  /**
   * Constructs an AppError instance.
   * @param code - The error code. Must be one of the ErrorCodes constants.
   * @param message - The error message.
   * @param details - Optional details about the error.
   */
  constructor(code: number, message: string, details?: string) {
    super(message);
    /**
     * The name of the error (always "AppError").
     */
    this.name = 'AppError';
    /**
     * The error code. Must be one of the ErrorCodes constants.
     */
    this.code = code;
    /**
     * The error message.
     */
    this.message = message;
    /**
     * Optional details about the error.
     */
    this.details = details;
  }
}
