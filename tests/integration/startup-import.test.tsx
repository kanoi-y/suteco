import { render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { InitializationProvider } from '@/components/InitializationProvider';
import { defaultDatasets } from '@/lib/datasets';
import { getDb } from '@/lib/db/client';
import { importDataset } from '@/lib/dataset/import';
import { openTestDb } from '../helpers/db';
import type { MunicipalityDataset } from '@/schema/municipality-dataset-schema';

const mockImportDataset = jest.mocked(importDataset);

jest.mock('@/lib/dataset/import', () => {
  const actual = jest.requireActual<typeof import('@/lib/dataset/import')>('@/lib/dataset/import');
  return {
    ...actual,
    importDataset: jest.fn().mockResolvedValue(undefined),
  };
});

jest.mock('@/lib/db/client', () => ({
  ...jest.requireActual<typeof import('@/lib/db/client')>('@/lib/db/client'),
  getDb: jest.fn(),
}));

const mockGetDb = jest.mocked(getDb);

const MainContent = () => <Text>メインコンテンツ</Text>;

describe('初回起動時の import 導線', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockImportDataset.mockResolvedValue(undefined);
  });

  describe('初回起動時', () => {
    it('import が走り、ローディング表示後にメインコンテンツが表示される', async () => {
      const { expoDb, db } = await openTestDb('first_startup');
      mockGetDb.mockReturnValue(db);

      render(
        <InitializationProvider>
          <MainContent />
        </InitializationProvider>
      );

      await waitFor(() => {
        expect(mockImportDataset).toHaveBeenCalledTimes(defaultDatasets.length);
      });

      await waitFor(() => {
        expect(screen.getByText('メインコンテンツ')).toBeTruthy();
      });

      await expoDb.closeAsync();
    });
  });

  describe('初期化失敗時', () => {
    it('getDb が例外を投げる場合、レンダリング時にエラーになる', () => {
      mockGetDb.mockImplementation(() => {
        throw new Error('DB init failed');
      });

      expect(() =>
        render(
          <InitializationProvider>
            <MainContent />
          </InitializationProvider>
        )
      ).toThrow('DB init failed');
    });

    it('importDataset が失敗するとエラー画面が表示され、メインコンテンツは表示されない', async () => {
      const { expoDb, db } = await openTestDb('import_fail');
      mockGetDb.mockReturnValue(db);
      mockImportDataset.mockRejectedValue(new Error('Invalid bundled data'));

      render(
        <InitializationProvider>
          <MainContent />
        </InitializationProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('マイグレーション中...')).toBeTruthy();
      });

      await waitFor(() => {
        expect(screen.getByText('初期設定中...')).toBeTruthy();
      });

      await waitFor(() => {
        expect(screen.getByText('初期化に失敗しました')).toBeTruthy();
      });

      expect(screen.getByText('Invalid bundled data')).toBeTruthy();
      expect(screen.getByRole('button', { name: '再試行' })).toBeTruthy();
      expect(screen.queryByText('メインコンテンツ')).toBeNull();

      await expoDb.closeAsync();
    });
  });

  describe('再起動時', () => {
    it('import が二重投入されず、即座にメインコンテンツが表示される', async () => {
      const { expoDb, db } = await openTestDb('restart');

      const { importDataset: realImportDataset } =
        jest.requireActual<typeof import('@/lib/dataset/import')>('@/lib/dataset/import');
      for (const dataset of defaultDatasets) {
        await realImportDataset(db, dataset);
      }

      mockGetDb.mockReturnValue(db);
      mockImportDataset.mockClear();

      render(
        <InitializationProvider>
          <MainContent />
        </InitializationProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('マイグレーション中...')).toBeTruthy();
      });

      await waitFor(() => {
        expect(screen.getByText('メインコンテンツ')).toBeTruthy();
      });

      expect(mockImportDataset).not.toHaveBeenCalled();
      expect(screen.queryByText('初期設定中...')).toBeNull();

      await expoDb.closeAsync();
    });

    it('municipality.version が同じでも contentDigest が異なれば再インポートされる', async () => {
      const { expoDb, db } = await openTestDb('restart_digest_changed');

      const { importDataset: realImportDataset } =
        jest.requireActual<typeof import('@/lib/dataset/import')>('@/lib/dataset/import');
      for (const dataset of defaultDatasets) {
        await realImportDataset(db, dataset);
      }

      const targetDataset = defaultDatasets[0];
      if (!targetDataset) {
        throw new Error('defaultDatasets が空です');
      }

      expoDb.runSync('UPDATE municipalities SET content_digest = ? WHERE id = ?', [
        'stale_digest',
        targetDataset.municipality.id,
      ]);

      mockGetDb.mockReturnValue(db);
      mockImportDataset.mockClear();

      render(
        <InitializationProvider>
          <MainContent />
        </InitializationProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('メインコンテンツ')).toBeTruthy();
      });

      expect(mockImportDataset).toHaveBeenCalledTimes(1);
      expect(mockImportDataset).toHaveBeenCalledWith(db, targetDataset);

      await expoDb.closeAsync();
    });

    it('既存DBで contentDigest が未保存なら一度だけ再インポートされる', async () => {
      const { expoDb, db } = await openTestDb('restart_digest_missing');

      const { importDataset: realImportDataset } =
        jest.requireActual<typeof import('@/lib/dataset/import')>('@/lib/dataset/import');
      for (const dataset of defaultDatasets) {
        await realImportDataset(db, dataset);
      }

      const targetDataset = defaultDatasets[0];
      if (!targetDataset) {
        throw new Error('defaultDatasets が空です');
      }

      expoDb.runSync('UPDATE municipalities SET content_digest = NULL WHERE id = ?', [
        targetDataset.municipality.id,
      ]);

      mockGetDb.mockReturnValue(db);
      mockImportDataset.mockClear();

      render(
        <InitializationProvider>
          <MainContent />
        </InitializationProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('メインコンテンツ')).toBeTruthy();
      });

      expect(mockImportDataset).toHaveBeenCalledTimes(1);
      expect(mockImportDataset).toHaveBeenCalledWith(db, targetDataset);

      await expoDb.closeAsync();
    });
  });

  describe('同梱削除時の pruning', () => {
    const removedCityDataset: MunicipalityDataset = {
      municipality: {
        id: 'removed-city',
        displayName: '削除された市',
        version: '2025-01-01',
      },
      items: [
        {
          id: 'removed_item',
          displayName: '品目',
          aliases: [],
          keywords: [],
        },
      ],
      rules: [
        {
          municipalityId: 'removed-city',
          itemId: 'removed_item',
          categoryName: '燃やすごみ',
          instructions: '指定袋へ',
        },
      ],
    };

    it('同梱から外れた自治体が起動時に削除される', async () => {
      const { expoDb, db } = await openTestDb('prune_on_startup');

      const { importDataset: realImportDataset } =
        jest.requireActual<typeof import('@/lib/dataset/import')>('@/lib/dataset/import');

      for (const dataset of defaultDatasets) {
        await realImportDataset(db, dataset);
      }
      await realImportDataset(db, removedCityDataset);

      const countBefore =
        expoDb.getAllSync<{ count: number }>('SELECT COUNT(*) as count FROM municipalities')[0]
          ?.count ?? 0;
      expect(countBefore).toBe(defaultDatasets.length + 1);

      const hasRemovedBefore = expoDb
        .getAllSync<{ id: string }>('SELECT id FROM municipalities')
        .some((r) => r.id === 'removed-city');
      expect(hasRemovedBefore).toBe(true);

      mockGetDb.mockReturnValue(db);

      render(
        <InitializationProvider>
          <MainContent />
        </InitializationProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('メインコンテンツ')).toBeTruthy();
      });

      const countAfter =
        expoDb.getAllSync<{ count: number }>('SELECT COUNT(*) as count FROM municipalities')[0]
          ?.count ?? 0;
      expect(countAfter).toBe(defaultDatasets.length);

      const hasRemovedAfter = expoDb
        .getAllSync<{ id: string }>('SELECT id FROM municipalities')
        .some((r) => r.id === 'removed-city');
      expect(hasRemovedAfter).toBe(false);

      await expoDb.closeAsync();
    });
  });
});
