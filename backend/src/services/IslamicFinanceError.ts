/**
 * Custom error class for Islamic Finance operations
 * Shared by all Islamic finance services
 */

export class IslamicFinanceError extends Error {
  public code: string;
  public statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'IslamicFinanceError';
  }
}
