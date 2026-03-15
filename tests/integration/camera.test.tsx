/**
 * カメラ画面の結合テスト
 *
 * 目的: カメラ画面の責務を先に固定する。
 * カメラ画面未実装時には、これらのテストが失敗する。
 */
import { fireEvent, render, screen } from '@testing-library/react-native';
import CameraScreen from '../../app/camera';

const mockTakePictureAsync = jest.fn();

const mockUseCameraPermissions = jest.fn();
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

describe('カメラ画面', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
