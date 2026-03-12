import { getDb } from '@/lib/db/client';
import type { MunicipalityDataset } from '@/schema/municipality-dataset-schema';
import { type MunicipalityState, useMunicipalityStore } from '@/stores/municipality-store';
/**
 * 自治体選択導線の結合テスト
 *
 * 目的: 自治体選択フローを先に固定する。
 * 画面未実装時には、これらのテストが失敗する。
 */
import {
  fireEventAsync,
  render,
  renderAsync,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Alert } from 'react-native';
import HomeScreen from '../../app/index';
import MunicipalitiesScreen from '../../app/municipalities';
import { openTestDb } from '../helpers/db';
import { mockRouter } from '../helpers/expo-router-mock';

jest.mock('@/lib/db/client', () => ({
  ...jest.requireActual<typeof import('@/lib/db/client')>('@/lib/db/client'),
  getDb: jest.fn(),
}));

const mockGetDb = jest.mocked(getDb);

const initialState: MunicipalityState = {
  selectedMunicipalityId: null,
  selectedMunicipalityName: null,
  datasetVersion: null,
};

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

function resetStore(): void {
  useMunicipalityStore.setState(initialState);
}

describe('自治体選択導線', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  describe('一覧表示テスト', () => {
    it('自治体一覧が表示される', async () => {
      const { expoDb, db } = await openTestDb('municipality_list');
      const dataset = createValidDataset();
      const { importDataset: realImportDataset } =
        jest.requireActual<typeof import('@/lib/dataset/import')>('@/lib/dataset/import');
      await realImportDataset(db, dataset);
      mockGetDb.mockReturnValue(db);

      await renderAsync(<MunicipalitiesScreen />);

      expect(screen.getByText('テスト市')).toBeTruthy();

      await expoDb.closeAsync();
    });
  });

  describe('タップ選択テスト', () => {
    it('自治体をタップすると選択状態になる（または確認ダイアログが発火する）', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      const { expoDb, db } = await openTestDb('municipality_tap');
      const dataset = createValidDataset();
      const { importDataset: realImportDataset } =
        jest.requireActual<typeof import('@/lib/dataset/import')>('@/lib/dataset/import');
      await realImportDataset(db, dataset);
      mockGetDb.mockReturnValue(db);

      await renderAsync(<MunicipalitiesScreen />);

      expect(screen.getByText('テスト市')).toBeTruthy();

      const municipalityItem = screen.getByText('テスト市');
      await fireEventAsync.press(municipalityItem);

      await waitFor(() => {
        const state = useMunicipalityStore.getState();
        const alertCalled = alertSpy.mock.calls.length > 0;
        expect(state.selectedMunicipalityId === 'test-city' || alertCalled).toBe(true);
      });

      alertSpy.mockRestore();
      await expoDb.closeAsync();
    });
  });

  describe('保存確認テスト', () => {
    it('選択後、保存確認ダイアログが表示され、保存するとストアに保存されて戻る', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { expoDb, db } = await openTestDb('municipality_save');
      const dataset = createValidDataset();
      const { importDataset: realImportDataset } =
        jest.requireActual<typeof import('@/lib/dataset/import')>('@/lib/dataset/import');
      await realImportDataset(db, dataset);
      mockGetDb.mockReturnValue(db);

      await renderAsync(<MunicipalitiesScreen />);

      expect(screen.getByText('テスト市')).toBeTruthy();

      const municipalityItem = screen.getByText('テスト市');
      await fireEventAsync.press(municipalityItem);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });

      const callArgs = alertSpy.mock.calls[0];
      const buttons = (callArgs?.[2] ?? []) as Array<{
        text?: string;
        onPress?: () => void;
      }>;
      const confirmButton = buttons.find(
        (b) => b.text === 'はい' || b.text === 'OK' || b.text === '保存'
      );
      if (confirmButton && typeof confirmButton.onPress === 'function') {
        confirmButton.onPress();
      }

      await waitFor(() => {
        const state = useMunicipalityStore.getState();
        expect(state.selectedMunicipalityId).toBe('test-city');
        expect(state.selectedMunicipalityName).toBe('テスト市');
      });

      expect(mockRouter.replace).toHaveBeenCalledWith('/');

      alertSpy.mockRestore();
      await expoDb.closeAsync();
    });
  });

  describe('初回未選択ガードテスト', () => {
    it('初回起動時に未選択の場合、トップ画面から自治体選択画面へ遷移する', () => {
      resetStore();
      const state = useMunicipalityStore.getState();
      expect(state.selectedMunicipalityId).toBeNull();
      expect(state.selectedMunicipalityName).toBeNull();

      render(<HomeScreen />);

      expect(mockRouter.replace).toHaveBeenCalledWith('/municipalities');
    });
  });
});
