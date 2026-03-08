import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

function loadCLI(): { main: (argv: string[]) => void } {
  try {
    const mod = require('../../scripts/validate-dataset') as {
      main?: (argv: string[]) => void;
    };
    if (typeof mod.main !== 'function') {
      throw new Error(
        'scripts/validate-dataset.ts に main 関数がエクスポートされていません。',
      );
    }
    return { main: mod.main };
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : String(err);
    throw new Error(
      `dataset 検証 CLI が未実装です。scripts/validate-dataset.ts を作成し main 関数をエクスポートしてください。原因: ${msg}`,
    );
  }
}

function createValidDatasetJson(): string {
  return JSON.stringify({
    municipality: {
      id: 'akita-yokote',
      displayName: '秋田県横手市',
      version: '2026-03-01',
    },
    items: [
      {
        id: 'mobile_battery',
        displayName: 'モバイルバッテリー',
        aliases: ['充電池', 'バッテリー'],
        keywords: ['モバイルバッテリー', 'リチウムイオン電池'],
      },
      {
        id: 'plastic_bottle',
        displayName: 'ペットボトル',
        aliases: ['PETボトル'],
        keywords: ['ペットボトル', 'プラスチック'],
      },
    ],
    rules: [
      {
        municipalityId: 'akita-yokote',
        itemId: 'mobile_battery',
        categoryName: '拠点回収',
        instructions: '端子を絶縁して指定回収拠点に持ち込んでください。',
      },
      {
        municipalityId: 'akita-yokote',
        itemId: 'plastic_bottle',
        categoryName: '資源ごみ',
        instructions: '中をすすぎ、ラベルを外して出してください。',
      },
    ],
  });
}

function createInvalidDatasetJson(): string {
  return JSON.stringify({
    municipality: {
      id: 'test',
      displayName: 'テスト',
      version: '1.0',
    },
    items: [{ id: 'item1', displayName: '品目1', aliases: [], keywords: [] }],
    rules: [
      {
        municipalityId: 'test',
        itemId: 'unknown_item',
        categoryName: '不燃ごみ',
        instructions: 'テスト',
      },
    ],
  });
}

describe('validate-dataset CLI', () => {
  let tempDir: string;
  let validFilePath: string;
  let invalidFilePath: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-dataset-cli-'));
    validFilePath = path.join(tempDir, 'valid.json');
    invalidFilePath = path.join(tempDir, 'invalid.json');
    fs.writeFileSync(validFilePath, createValidDatasetJson());
    fs.writeFileSync(invalidFilePath, createInvalidDatasetJson());
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true });
  });

  let exitSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
      throw new Error(`process.exit(${code ?? 0})`);
    });
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe('loadCLI', () => {
    it('CLI 実装時に loadCLI が main 関数を返す', () => {
      const { main } = loadCLI();
      expect(typeof main).toBe('function');
    });
  });

  describe('正常終了', () => {
    it('正常な JSON を渡すと process.exit が呼ばれず成功メッセージが出力される', () => {
      const { main } = loadCLI();
      main(['node', 'validate-dataset', validFilePath]);
      expect(exitSpy).not.toHaveBeenCalled();
      const logOutput = logSpy.mock.calls.flat().join(' ');
      expect(logOutput).toMatch(/成功|valid|OK|完了/i);
    });
  });

  describe('異常終了', () => {
    it('スキーマ違反の JSON を渡すと process.exit(1) が呼ばれる', () => {
      const { main } = loadCLI();
      expect(() => main(['node', 'validate-dataset', invalidFilePath])).toThrow(
        /process\.exit\(1\)/,
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('エラーメッセージ出力', () => {
    it('異常データ時に console.error で検証失敗内容が出力される', () => {
      const { main } = loadCLI();
      try {
        main(['node', 'validate-dataset', invalidFilePath]);
      } catch {
        // process.exit のモックで throw するため
      }
      expect(errorSpy).toHaveBeenCalled();
      const errorOutput = errorSpy.mock.calls.flat().join(' ');
      expect(errorOutput).toMatch(
        /items\.id|rules\.itemId|Required|検証|エラー|失敗/i,
      );
    });
  });

  describe('引数エラー', () => {
    it('ファイルパス未指定時に process.exit(1) と使用方法が出力される', () => {
      const { main } = loadCLI();
      expect(() => main(['node', 'validate-dataset'])).toThrow(
        /process\.exit\(1\)/,
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
      const errorOutput = errorSpy.mock.calls.flat().join(' ');
      expect(errorOutput).toMatch(/使用方法|usage|引数|Usage|ファイル/i);
    });
  });

  describe('ファイル存在エラー', () => {
    it('存在しないファイルパス指定時に process.exit(1) とエラーメッセージが出力される', () => {
      const { main } = loadCLI();
      const notExistPath = path.join(tempDir, 'not-exist.json');
      expect(() => main(['node', 'validate-dataset', notExistPath])).toThrow(
        /process\.exit\(1\)/,
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(errorSpy).toHaveBeenCalled();
      const errorOutput = errorSpy.mock.calls.flat().join(' ');
      expect(errorOutput).toMatch(/存在|not found|ENOENT|ファイル|読み込め/i);
    });
  });
});
