/**
 * テキスト検索から詳細表示までの結合テスト
 *
 * 目的: 検索導線を先に固定する。
 * 画面未実装時には、これらのテストが失敗する。
 */
import { getDb } from '@/lib/db/client';
import type { MunicipalityDataset } from '@/schema/municipality-dataset-schema';
import { useMunicipalityStore } from '@/stores/municipality-store';
import {
  fireEvent,
  fireEventAsync,
  render,
  renderAsync,
  screen,
  waitFor,
} from '@testing-library/react-native';
import SearchScreen from '../../app/search';
import { openTestDb } from '../helpers/db';
import { mockRouter } from '../helpers/expo-router-mock';

jest.mock('@/lib/db/client', () => ({
  ...jest.requireActual<typeof import('@/lib/db/client')>('@/lib/db/client'),
  getDb: jest.fn(),
}));

const mockGetDb = jest.mocked(getDb);

function createSearchDataset(): MunicipalityDataset {
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
    ],
    rules: [
      {
        municipalityId: 'test-city',
        itemId: 'item_plastic',
        categoryName: '資源物',
        instructions: '洗って出してください。',
      },
    ],
  };
}

describe('テキスト検索導線', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMunicipalityStore.setState({ selectedMunicipalityId: 'test-city' });
  });

  describe('入力で検索されるテスト', () => {
    it('検索入力欄に入力すると検索が実行される', async () => {
      const { expoDb, db } = await openTestDb('search_input');
      const dataset = createSearchDataset();
      const { importDataset: realImportDataset } =
        jest.requireActual<typeof import('@/lib/dataset/import')>('@/lib/dataset/import');
      await realImportDataset(db, dataset);
      mockGetDb.mockReturnValue(db);

      await renderAsync(<SearchScreen />);

      const searchInput = screen.getByPlaceholderText('検索...');
      await fireEventAsync.changeText(searchInput, 'プラ');

      await waitFor(() => {
        expect(screen.getByText('プラスチック')).toBeTruthy();
      });

      await expoDb.closeAsync();
    });
  });

  describe('結果タップで詳細遷移するテスト', () => {
    it('検索結果をタップすると詳細画面へ遷移する', async () => {
      const { expoDb, db } = await openTestDb('search_detail_nav');
      const dataset = createSearchDataset();
      const { importDataset: realImportDataset } =
        jest.requireActual<typeof import('@/lib/dataset/import')>('@/lib/dataset/import');
      await realImportDataset(db, dataset);
      mockGetDb.mockReturnValue(db);

      await renderAsync(<SearchScreen />);

      const searchInput = screen.getByPlaceholderText('検索...');
      await fireEventAsync.changeText(searchInput, 'プラ');

      await waitFor(() => {
        expect(screen.getByText('プラスチック')).toBeTruthy();
      });

      const resultItem = screen.getByText('プラスチック');
      fireEvent.press(resultItem);

      expect(mockRouter.push).toHaveBeenCalledWith('/items/item_plastic');

      await expoDb.closeAsync();
    });
  });

  describe('結果0件時の表示テスト', () => {
    it('検索結果が0件の場合、該当メッセージが表示される', async () => {
      const { expoDb, db } = await openTestDb('search_zero');
      const dataset = createSearchDataset();
      const { importDataset: realImportDataset } =
        jest.requireActual<typeof import('@/lib/dataset/import')>('@/lib/dataset/import');
      await realImportDataset(db, dataset);
      mockGetDb.mockReturnValue(db);

      await renderAsync(<SearchScreen />);

      const searchInput = screen.getByPlaceholderText('検索...');
      await fireEventAsync.changeText(searchInput, '存在しない品目');

      await waitFor(() => {
        expect(screen.getByText(/見つかりませんでした/)).toBeTruthy();
      });

      await expoDb.closeAsync();
    });
  });
});
