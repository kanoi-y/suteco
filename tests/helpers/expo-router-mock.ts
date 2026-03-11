/**
 * テスト用の expo-router モック。
 * setup.ts の jest.mock で使用し、結合テストから push 等の呼び出しを検証できるようにする。
 */
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};
