export type ErrorCode = 'NOT_FOUND' | 'BAD_REQUEST' | 'UNAUTHORIZED' | 'INTERNAL_SERVER_ERROR';

export class AppError extends Error {
  public code?: ErrorCode;
  public cause?: unknown;

  constructor(message: string, options?: { code?: ErrorCode; cause?: unknown }) {
    super(message);
    this.name = 'AppError';
    this.code = options?.code;
    this.cause = options?.cause;
  }
}
