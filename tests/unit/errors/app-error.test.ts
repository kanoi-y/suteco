import { AppError } from '@/lib/errors/app-error';

describe('AppError', () => {
  it('メッセージを指定してエラーを生成できること', () => {
    const error = new AppError('An unexpected error occurred');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('An unexpected error occurred');
    expect(error.name).toBe('AppError');
  });

  it('エラーコード(code)を保持できること', () => {
    const error = new AppError('Not Found', { code: 'NOT_FOUND' });
    expect(error.code).toBe('NOT_FOUND');
  });

  it('原因となったエラー(cause)を保持できること', () => {
    const originalError = new Error('Database connection failed');
    const error = new AppError('Failed to fetch data', { cause: originalError });

    expect(error.cause).toBe(originalError);
  });
});
