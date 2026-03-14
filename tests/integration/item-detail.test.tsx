/**
 * 分別詳細画面の結合テスト
 *
 * 目的: 分別詳細表示の責務を先に固定する。
 * 画面未実装時には、これらのテストが失敗する。
 */
import { getDb } from '@/lib/db/client';
import type { MunicipalityDataset } from '@/schema/municipality-dataset-schema';
import { type MunicipalityState, useMunicipalityStore } from '@/stores/municipality-store';
import { renderAsync, screen, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import ItemDetailScreen from '../../app/items/[id]';
import { openTestDb } from '../helpers/db';

jest.mock('@/lib/db/client', () => ({
  ...jest.requireActual<typeof import('@/lib/db/client')>('@/lib/db/client'),
  getDb: jest.fn(),
}));

const mockGetDb = jest.mocked(getDb);

const initialState: MunicipalityState = {
  selectedMunicipalityId: null,
  selectedMunicipalityName: null,
  datasetVersion: null,
  _hasHydrated: false,
};

function createDetailDataset(): MunicipalityDataset {
  return {
    municipality: {
      id: 'test-city',
      displayName: 'テスト市',
      version: '2025-01-01',
    },
    items: [
      {
        id: 'item_plastic',
        displayName: 'プラスチック',
        aliases: ['プラ'],
        keywords: ['ペットボトル', '容器'],
      },
      {
        id: 'item_unknown',
        displayName: '未登録品目',
        aliases: [],
        keywords: [],
      },
    ],
    rules: [
      {
        municipalityId: 'test-city',
        itemId: 'item_plastic',
        categoryName: '資源物',
        instructions: '洗って出してください。',
        notes: 'キャップは別に分別してください。',
      },
    ],
  };
}

function resetStore(): void {
  useMunicipalityStore.setState(initialState);
}

describe('分別詳細画面', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'item_plastic' });
  });

  describe('品目名表示テスト', () => {
    it('品目名が表示される', async () => {
      const { expoDb, db } = await openTestDb('item_detail_name');
      const dataset = createDetailDataset();
      const { importDataset: realImportDataset } =
        jest.requireActual<typeof import('@/lib/dataset/import')>('@/lib/dataset/import');
      await realImportDataset(db, dataset);
      mockGetDb.mockReturnValue(db);
      useMunicipalityStore.setState({
        selectedMunicipalityId: 'test-city',
        selectedMunicipalityName: 'テスト市',
        datasetVersion: '2025-01-01',
        _hasHydrated: true,
      });

      await renderAsync(<ItemDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('プラスチック')).toBeTruthy();
      });

      await expoDb.closeAsync();
    });
  });

  describe('分別区分表示テスト', () => {
    it('分別区分が表示される', async () => {
      const { expoDb, db } = await openTestDb('item_detail_category');
      const dataset = createDetailDataset();
      const { importDataset: realImportDataset } =
        jest.requireActual<typeof import('@/lib/dataset/import')>('@/lib/dataset/import');
      await realImportDataset(db, dataset);
      mockGetDb.mockReturnValue(db);
      useMunicipalityStore.setState({
        selectedMunicipalityId: 'test-city',
        selectedMunicipalityName: 'テスト市',
        datasetVersion: '2025-01-01',
        _hasHydrated: true,
      });

      await renderAsync(<ItemDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('資源物')).toBeTruthy();
      });

      await expoDb.closeAsync();
    });
  });

  describe('出し方表示テスト', () => {
    it('出し方が表示される', async () => {
      const { expoDb, db } = await openTestDb('item_detail_instructions');
      const dataset = createDetailDataset();
      const { importDataset: realImportDataset } =
        jest.requireActual<typeof import('@/lib/dataset/import')>('@/lib/dataset/import');
      await realImportDataset(db, dataset);
      mockGetDb.mockReturnValue(db);
      useMunicipalityStore.setState({
        selectedMunicipalityId: 'test-city',
        selectedMunicipalityName: 'テスト市',
        datasetVersion: '2025-01-01',
        _hasHydrated: true,
      });

      await renderAsync(<ItemDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('洗って出してください。')).toBeTruthy();
      });

      await expoDb.closeAsync();
    });
  });

  describe('注意事項表示テスト', () => {
    it('注意事項が表示される', async () => {
      const { expoDb, db } = await openTestDb('item_detail_notes');
      const dataset = createDetailDataset();
      const { importDataset: realImportDataset } =
        jest.requireActual<typeof import('@/lib/dataset/import')>('@/lib/dataset/import');
      await realImportDataset(db, dataset);
      mockGetDb.mockReturnValue(db);
      useMunicipalityStore.setState({
        selectedMunicipalityId: 'test-city',
        selectedMunicipalityName: 'テスト市',
        datasetVersion: '2025-01-01',
        _hasHydrated: true,
      });

      await renderAsync(<ItemDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('キャップは別に分別してください。')).toBeTruthy();
      });

      await expoDb.closeAsync();
    });
  });

  describe('未対応メッセージ表示テスト', () => {
    it('分別ルールが存在しない場合、未対応メッセージが表示される', async () => {
      const { expoDb, db } = await openTestDb('item_detail_unsupported');
      const dataset = createDetailDataset();
      const { importDataset: realImportDataset } =
        jest.requireActual<typeof import('@/lib/dataset/import')>('@/lib/dataset/import');
      await realImportDataset(db, dataset);
      mockGetDb.mockReturnValue(db);
      useMunicipalityStore.setState({
        selectedMunicipalityId: 'test-city',
        selectedMunicipalityName: 'テスト市',
        datasetVersion: '2025-01-01',
        _hasHydrated: true,
      });
      (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'item_unknown' });

      await renderAsync(<ItemDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText(/この自治体では分別ルールが登録されていません/)).toBeTruthy();
      });

      await expoDb.closeAsync();
    });
  });
});
