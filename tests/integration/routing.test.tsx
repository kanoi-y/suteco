/**
 * 主要画面ルーティングの結合テスト
 *
 * 目的: 主要画面が存在し、遷移可能であることを定義する。
 * 画面ファイルが未実装の場合、静的インポート時にモジュール解決エラーで失敗する。
 */
import { fireEvent, render, screen } from '@testing-library/react-native';
import { mockRouter } from '../helpers/expo-router-mock';
import CameraScreen from '../../app/camera';
import CandidatesScreen from '../../app/candidates';
import ItemDetailScreen from '../../app/items/[id]';
import HomeScreen from '../../app/index';
import MunicipalitiesScreen from '../../app/municipalities';
import SearchScreen from '../../app/search';
import SettingsScreen from '../../app/settings';

jest.mock('@/lib/db/client', () => ({
  ...jest.requireActual<typeof import('@/lib/db/client')>('@/lib/db/client'),
  getDb: jest.fn(() => ({})),
}));

jest.mock('@/lib/repositories/municipality-repository', () => ({
  MunicipalityRepository: class {
    async findAll() {
      return [];
    }
  },
}));

describe('主要ルートのレンダリング', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('トップ画面がレンダリングされる', () => {
    render(<HomeScreen />);
    expect(screen.getByText('Suteco')).toBeTruthy();
  });

  it('検索画面がレンダリングされる', () => {
    render(<SearchScreen />);
    expect(screen.getByText('検索画面')).toBeTruthy();
  });

  it('カメラ画面がレンダリングされる', () => {
    render(<CameraScreen />);
    expect(screen.getByText('カメラ画面')).toBeTruthy();
  });

  it('候補選択画面がレンダリングされる', () => {
    render(<CandidatesScreen />);
    expect(screen.getByText('候補選択画面')).toBeTruthy();
  });

  it('分別詳細画面がレンダリングされる', () => {
    render(<ItemDetailScreen />);
    expect(screen.getByText('分別詳細画面')).toBeTruthy();
  });

  it('自治体選択画面がレンダリングされる', () => {
    render(<MunicipalitiesScreen />);
    expect(screen.getByText('自治体を選択')).toBeTruthy();
  });

  it('設定画面がレンダリングされる', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('設定画面')).toBeTruthy();
  });
});

describe('基本遷移', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('トップ画面からテキスト検索ボタン押下で検索画面へ遷移する', () => {
    render(<HomeScreen />);

    const searchButton = screen.getByText('テキストで検索');
    fireEvent.press(searchButton);

    expect(mockRouter.push).toHaveBeenCalledWith('/search');
  });
});
