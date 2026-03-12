/**
 * ErrorState の単体テスト
 *
 * 目的: エラー状態コンポーネントの表示責務を定義する。
 * 未実装時に失敗する（Red）状態で、実装の指針とする。
 */
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ErrorState } from '@/components/ErrorState';

describe('ErrorState', () => {
  it('エラーメッセージが正しく表示される', () => {
    render(<ErrorState message="読み込みに失敗しました" onRetry={jest.fn()} />);

    expect(screen.getByText('読み込みに失敗しました')).toBeTruthy();
  });

  it('再試行ボタンが表示され、プレスで onRetry コールバックが呼ばれる', () => {
    const onRetry = jest.fn();
    render(<ErrorState message="読み込みに失敗しました" onRetry={onRetry} />);

    const retryButton = screen.getByText('再試行');
    expect(retryButton).toBeTruthy();

    fireEvent.press(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
