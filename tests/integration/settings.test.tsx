/**
 * 設定画面の結合テスト
 *
 * 目的: 設定画面の主要責務を先に固定する。
 * 設定画面未実装時には、これらのテストが失敗する。
 */
import { type MunicipalityState, useMunicipalityStore } from '@/stores/municipality-store';
import { fireEvent, render, screen } from '@testing-library/react-native';
import SettingsScreen from '../../app/settings';
import { mockRouter } from '../helpers/expo-router-mock';

const initialState: MunicipalityState = {
  selectedMunicipalityId: null,
  selectedMunicipalityName: null,
  datasetVersion: null,
  _hasHydrated: false,
};

function resetStore(): void {
  useMunicipalityStore.setState(initialState);
}

describe('設定画面', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  describe('現在の自治体名表示テスト', () => {
    it('選択中の自治体名が表示される', () => {
      useMunicipalityStore.setState({
        selectedMunicipalityId: 'test-city',
        selectedMunicipalityName: 'テスト市',
        datasetVersion: '2025-01-01',
      });

      render(<SettingsScreen />);

      expect(screen.getByText('テスト市')).toBeTruthy();
    });
  });

  describe('データバージョン表示テスト', () => {
    it('データバージョンが表示される', () => {
      useMunicipalityStore.setState({
        selectedMunicipalityId: 'test-city',
        selectedMunicipalityName: 'テスト市',
        datasetVersion: '2025-01-01',
      });

      render(<SettingsScreen />);

      expect(screen.getByText('2025-01-01')).toBeTruthy();
    });
  });

  describe('自治体変更導線テスト', () => {
    it('自治体を変更するボタン押下で自治体選択画面へ遷移する', () => {
      useMunicipalityStore.setState({
        selectedMunicipalityId: 'test-city',
        selectedMunicipalityName: 'テスト市',
        datasetVersion: '2025-01-01',
      });

      render(<SettingsScreen />);

      const changeMunicipalityButton = screen.getByText('自治体を変更する');
      fireEvent.press(changeMunicipalityButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/municipalities');
    });
  });
});
