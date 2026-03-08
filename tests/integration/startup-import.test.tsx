import { render, screen, waitFor } from '@testing-library/react-native';
import * as SQLite from 'expo-sqlite';
import { Text } from 'react-native';
import { InitializationProvider } from '@/components/InitializationProvider';
import { getDbClient } from '@/lib/db/client';
import { importDataset } from '@/lib/dataset/import';
import { initDatabase } from '@/lib/db/schema';
import type { MunicipalityDataset } from '@/schema/municipality-dataset-schema';

const mockImportDataset = jest.mocked(importDataset);

jest.mock('@/lib/dataset/import', () => ({
  importDataset: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/db/client', () => ({
  getDbClient: jest.fn(),
}));

const mockGetDbClient = jest.mocked(getDbClient);

function createValidDataset(): MunicipalityDataset {
  return {
    municipality: {
      id: 'test-city',
      displayName: 'テスト市',
      version: '2025-01-01',
    },
    items: [
      {
        id: 'item_a',
        displayName: '品目A',
        aliases: ['エイリアスA'],
        keywords: ['キーワードA'],
      },
    ],
    rules: [
      {
        municipalityId: 'test-city',
        itemId: 'item_a',
        categoryName: '資源物',
        instructions: '洗って出してください。',
      },
    ],
  };
}

async function openTestDb(name: string): Promise<SQLite.SQLiteDatabase> {
  const dbName = `startup_import_test_${name}_${process.env.JEST_WORKER_ID ?? 0}_${Date.now()}`;
  const db = await SQLite.openDatabaseAsync(dbName);
  await initDatabase(db);
  return db;
}

const MainContent = () => <Text>メインコンテンツ</Text>;

describe('初回起動時の import 導線', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('初回起動時', () => {
    it('import が走り、ローディング表示後にメインコンテンツが表示される', async () => {
      const db = await openTestDb('first_startup');
      mockGetDbClient.mockResolvedValue(db);

      render(
        <InitializationProvider>
          <MainContent />
        </InitializationProvider>
      );

      expect(screen.getByText('初期設定中...')).toBeTruthy();

      await waitFor(() => {
        expect(mockImportDataset).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(screen.getByText('メインコンテンツ')).toBeTruthy();
      });

      expect(screen.queryByText('初期設定中...')).toBeNull();

      await db.closeAsync();
    });
  });

  describe('初期化失敗時', () => {
    it('getDbClient が失敗するとエラー画面が表示され、メインコンテンツは表示されない', async () => {
      const err = new Error('SQLite open failed');
      mockGetDbClient.mockRejectedValue(err);

      render(
        <InitializationProvider>
          <MainContent />
        </InitializationProvider>
      );

      expect(screen.getByText('初期設定中...')).toBeTruthy();

      await waitFor(() => {
        expect(screen.getByText('初期化に失敗しました')).toBeTruthy();
      });

      expect(screen.getByText(err.message)).toBeTruthy();
      expect(screen.getByRole('button', { name: '再試行' })).toBeTruthy();
      expect(screen.queryByText('メインコンテンツ')).toBeNull();
    });

    it('importDataset が失敗するとエラー画面が表示され、メインコンテンツは表示されない', async () => {
      const db = await openTestDb('import_fail');
      mockGetDbClient.mockResolvedValue(db);
      mockImportDataset.mockRejectedValue(new Error('Invalid bundled data'));

      render(
        <InitializationProvider>
          <MainContent />
        </InitializationProvider>
      );

      expect(screen.getByText('初期設定中...')).toBeTruthy();

      await waitFor(() => {
        expect(screen.getByText('初期化に失敗しました')).toBeTruthy();
      });

      expect(screen.getByText('Invalid bundled data')).toBeTruthy();
      expect(screen.getByRole('button', { name: '再試行' })).toBeTruthy();
      expect(screen.queryByText('メインコンテンツ')).toBeNull();

      await db.closeAsync();
    });
  });

  describe('再起動時', () => {
    it('import が二重投入されず、即座にメインコンテンツが表示される', async () => {
      const db = await openTestDb('restart');
      const dataset = createValidDataset();

      const { importDataset: realImportDataset } = jest.requireActual<typeof import('@/lib/dataset/import')>(
        '@/lib/dataset/import'
      );
      await realImportDataset(db, dataset);

      mockGetDbClient.mockResolvedValue(db);
      mockImportDataset.mockClear();

      render(
        <InitializationProvider>
          <MainContent />
        </InitializationProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('メインコンテンツ')).toBeTruthy();
      });

      expect(mockImportDataset).not.toHaveBeenCalled();
      expect(screen.queryByText('初期設定中...')).toBeNull();

      await db.closeAsync();
    });
  });
});
