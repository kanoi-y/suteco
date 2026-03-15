/**
 * カメラ画面の結合テスト
 *
 * 目的: カメラ画面の責務を先に固定する。
 * カメラ画面未実装時には、これらのテストが失敗する。
 */
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import type { RecognitionResult } from '@/lib/services/recognizer/types';
import { useClassificationStore } from '@/stores/classification-store';
import { mockRouter } from '../helpers/expo-router-mock';
import type { ClassificationState } from '@/stores/classification-store';
import CameraScreen from '../../app/camera';

const mockTakePictureAsync = jest.fn();

const mockLaunchImageLibraryAsync = jest.fn();

const mockUseCameraPermissions = jest.fn();

const mockRecognize = jest.fn();
const mockCreateRecognizer = jest.fn(() => ({
  recognize: mockRecognize,
}));

jest.mock('@/lib/services/recognizer', () => ({
  createRecognizer: () => mockCreateRecognizer(),
}));

const initialState: ClassificationState = {
  sourceImageUri: null,
  candidates: [],
  selectedItemId: null,
  status: 'idle',
  errorMessage: null,
};

function resetClassificationStore(): void {
  useClassificationStore.setState(initialState);
}
const mockRequestPermission = jest.fn();
const mockGetPermission = jest.fn();

jest.mock('expo-camera', () => {
  const { View } = require('react-native');
  const React = require('react');

  return {
    useCameraPermissions: () => mockUseCameraPermissions(),
    CameraView: React.forwardRef(
      (
        { children, ...props }: { children?: React.ReactNode },
        ref: React.Ref<{ takePictureAsync: jest.Mock }>,
      ) => {
        React.useImperativeHandle(ref, () => ({
          takePictureAsync: mockTakePictureAsync,
        }));
        return (
          <View testID="camera-view" {...props}>
            {children}
          </View>
        );
      },
    ),
  };
});

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: (...args: unknown[]) =>
    mockLaunchImageLibraryAsync(...args),
}));

describe('カメラ画面', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.push.mockClear();
    resetClassificationStore();
  });

  describe('権限未許可時', () => {
    beforeEach(() => {
      mockUseCameraPermissions.mockReturnValue([
        { granted: false, canAskAgain: true },
        mockRequestPermission,
        mockGetPermission,
      ]);
    });

    it('カメラの許可が必要である旨のメッセージが表示される', () => {
      render(<CameraScreen />);

      expect(screen.getByText('カメラの許可が必要です')).toBeTruthy();
    });

    it('許可をリクエストするボタンが表示される', () => {
      render(<CameraScreen />);

      const requestButton = screen.getByText('許可する');
      fireEvent.press(requestButton);

      expect(mockRequestPermission).toHaveBeenCalled();
    });
  });

  describe('権限許可時', () => {
    beforeEach(() => {
      mockUseCameraPermissions.mockReturnValue([
        { granted: true },
        mockRequestPermission,
        mockGetPermission,
      ]);
    });

    it('カメラビューが表示される', () => {
      render(<CameraScreen />);

      expect(screen.getByTestId('camera-view')).toBeTruthy();
    });

    it('撮影ボタンが表示される', () => {
      render(<CameraScreen />);

      expect(screen.getByText('撮影')).toBeTruthy();
    });

    it('ライブラリから選択ボタンが表示される', () => {
      render(<CameraScreen />);

      expect(screen.getByText('ライブラリから選択')).toBeTruthy();
    });

    it('ライブラリから選択ボタン押下時に launchImageLibraryAsync が呼ばれる', () => {
      mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: true });

      render(<CameraScreen />);

      const selectButton = screen.getByText('ライブラリから選択');
      fireEvent.press(selectButton);

      expect(mockLaunchImageLibraryAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          mediaTypes: expect.any(Array),
          allowsEditing: expect.any(Boolean),
        }),
      );
    });

    it('ライブラリから画像選択後はプレビュー画像と再撮影・判定するボタンが表示される', async () => {
      mockLaunchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [
          {
            uri: 'file:///library/selected.jpg',
            width: 1920,
            height: 1080,
          },
        ],
      });

      render(<CameraScreen />);

      const selectButton = screen.getByText('ライブラリから選択');
      fireEvent.press(selectButton);

      await screen.findByTestId('preview-image');

      expect(screen.getByText('再撮影')).toBeTruthy();
      expect(screen.getByText('判定する')).toBeTruthy();
    });

    it('撮影後はプレビュー画像と再撮影・判定するボタンが表示される', async () => {
      mockTakePictureAsync.mockResolvedValue({
        uri: 'file:///cache/photo.jpg',
        width: 1920,
        height: 1080,
      });

      render(<CameraScreen />);

      const captureButton = screen.getByText('撮影');
      fireEvent.press(captureButton);

      expect(mockTakePictureAsync).toHaveBeenCalled();

      await screen.findByTestId('preview-image');

      expect(screen.getByText('再撮影')).toBeTruthy();
      expect(screen.getByText('判定する')).toBeTruthy();
    });
  });

  describe('画像判定連携', () => {
    beforeEach(() => {
      mockUseCameraPermissions.mockReturnValue([
        { granted: true },
        mockRequestPermission,
        mockGetPermission,
      ]);
    });

    it('判定するボタン押下時に sourceImageUri と status: recognizing がストアに保存される', async () => {
      const imageUri = 'file:///library/selected.jpg';
      mockLaunchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: imageUri, width: 1920, height: 1080 }],
      });
      mockRecognize.mockImplementation(
        () => new Promise<RecognitionResult>(() => {}),
      );

      render(<CameraScreen />);

      const selectButton = screen.getByText('ライブラリから選択');
      fireEvent.press(selectButton);
      await screen.findByTestId('preview-image');

      const judgeButton = screen.getByText('判定する');
      fireEvent.press(judgeButton);

      await waitFor(() => {
        const state = useClassificationStore.getState();
        expect(state.sourceImageUri).toBe(imageUri);
        expect(state.status).toBe('recognizing');
      });
    });

    it('認識成功時に candidates と status: success がストアに保存され、候補選択画面へ遷移する', async () => {
      const imageUri = 'file:///library/selected.jpg';
      const expectedCandidates = [
        { itemId: 'item-1', label: 'ペットボトル', score: 0.95 },
        { itemId: 'item-2', label: 'びん', score: 0.8 },
      ];
      mockLaunchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: imageUri, width: 1920, height: 1080 }],
      });
      mockRecognize.mockResolvedValue({ candidates: expectedCandidates });

      render(<CameraScreen />);

      const selectButton = screen.getByText('ライブラリから選択');
      fireEvent.press(selectButton);
      await screen.findByTestId('preview-image');

      const judgeButton = screen.getByText('判定する');
      fireEvent.press(judgeButton);

      await waitFor(() => {
        const state = useClassificationStore.getState();
        expect(state.candidates).toEqual(expectedCandidates);
        expect(state.status).toBe('success');
      });
      expect(mockRouter.push).toHaveBeenCalledWith('/candidates');
    });

    it('認識失敗時に errorMessage と status: error がストアに保存される', async () => {
      const imageUri = 'file:///library/selected.jpg';
      const errorMessage = '認識に失敗しました';
      mockLaunchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: imageUri, width: 1920, height: 1080 }],
      });
      mockRecognize.mockRejectedValue(new Error(errorMessage));

      render(<CameraScreen />);

      const selectButton = screen.getByText('ライブラリから選択');
      fireEvent.press(selectButton);
      await screen.findByTestId('preview-image');

      const judgeButton = screen.getByText('判定する');
      fireEvent.press(judgeButton);

      await waitFor(() => {
        const state = useClassificationStore.getState();
        expect(state.errorMessage).toBe(errorMessage);
        expect(state.status).toBe('error');
      });
    });
  });
});
