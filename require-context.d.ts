/**
 * Metro/Webpack の require.context 用 ambient 型定義。
 * NodeRequire には context が含まれないため、リポジトリ内で明示する。
 */
declare global {
  interface NodeRequire {
    context: (
      directory: string,
      useSubdirectories: boolean,
      regExp: RegExp
    ) => {
      keys: () => string[];
      (key: string): unknown;
    };
  }
}

export {};
