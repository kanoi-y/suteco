/**
 * 候補選択画面の結合テスト
 *
 * 目的: 候補選択導線を先に固定する。
 * 候補選択画面未実装時には、これらのテストが失敗する。
 */
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Candidate } from '@/types/candidate';
import { useClassificationStore } from '@/stores/classification-store';
import { mockRouter } from '../helpers/expo-router-mock';
import CandidatesScreen from '../../app/candidates';

const sampleCandidates: Candidate[] = [
  { itemId: 'item_bottle', label: 'ペットボトル', score: 0.95 },
  { itemId: 'item_can', label: 'アルミ缶', score: 0.8 },
];

const sampleSourceImageUri = 'file:///cache/photo.jpg';

function setupCandidatesStore(overrides?: {
  sourceImageUri?: string | null;
  candidates?: Candidate[];
}): void {
  useClassificationStore.setState({
    sourceImageUri: sampleSourceImageUri,
    candidates: sampleCandidates,
    status: 'success',
    ...overrides,
  });
}

function resetCandidatesStore(): void {
  useClassificationStore.setState({
    sourceImageUri: null,
    candidates: [],
    selectedItemId: null,
    status: 'idle',
    errorMessage: null,
  });
}

describe('候補選択画面', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetCandidatesStore();
  });

  describe('画像サムネイル表示', () => {
    it('sourceImageUri を用いた画像サムネイルが表示される', () => {
      setupCandidatesStore();

      render(<CandidatesScreen />);

      const thumbnail = screen.getByTestId('source-image');
      expect(thumbnail).toBeTruthy();
      expect(thumbnail.props.source).toEqual({ uri: sampleSourceImageUri });
    });
  });

  describe('候補一覧表示', () => {
    it('候補一覧に品目名が表示される', () => {
      setupCandidatesStore();

      render(<CandidatesScreen />);

      expect(screen.getByText('ペットボトル')).toBeTruthy();
      expect(screen.getByText('アルミ缶')).toBeTruthy();
    });
  });

  describe('候補タップで詳細遷移', () => {
    it('候補をタップすると分別詳細画面へ遷移する', () => {
      setupCandidatesStore();

      render(<CandidatesScreen />);

      const firstCandidate = screen.getByText('ペットボトル');
      fireEvent.press(firstCandidate);

      expect(mockRouter.push).toHaveBeenCalledWith('/items/item_bottle');
    });

    it('2番目の候補をタップすると該当 itemId で詳細画面へ遷移する', () => {
      setupCandidatesStore();

      render(<CandidatesScreen />);

      const secondCandidate = screen.getByText('アルミ缶');
      fireEvent.press(secondCandidate);

      expect(mockRouter.push).toHaveBeenCalledWith('/items/item_can');
    });
  });

  describe('テキスト検索導線', () => {
    it('テキストで検索ボタン押下で検索画面へ遷移する', () => {
      setupCandidatesStore();

      render(<CandidatesScreen />);

      const searchButton = screen.getByText('テキストで検索');
      fireEvent.press(searchButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/search');
    });
  });
});
