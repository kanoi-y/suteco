/**
 * PrimaryButton の単体テスト
 *
 * 目的: プライマリボタンの表示責務と振る舞いを定義する。
 * 未実装時に失敗する（Red）状態で、実装の指針とする。
 */
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PrimaryButton } from '@/components/PrimaryButton';

describe('PrimaryButton', () => {
  it('タイトルテキストが正しく表示される', () => {
    render(<PrimaryButton title="送信" onPress={jest.fn()} />);

    expect(screen.getByText('送信')).toBeTruthy();
  });

  it('プレス時に onPress コールバックが呼ばれる', () => {
    const onPress = jest.fn();
    render(<PrimaryButton title="送信" onPress={onPress} />);

    fireEvent.press(screen.getByText('送信'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('disabled 状態のときにプレスが無効化される', () => {
    const onPress = jest.fn();
    render(<PrimaryButton title="送信" onPress={onPress} disabled />);

    fireEvent.press(screen.getByText('送信'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('loading 状態のときにローディングインジケーターが表示される', () => {
    render(<PrimaryButton title="送信" onPress={jest.fn()} loading />);

    expect(screen.getByTestId('primary-button-loading')).toBeTruthy();
  });

  it('loading 状態のときにプレスが無効化される', () => {
    const onPress = jest.fn();
    render(<PrimaryButton title="送信" onPress={onPress} loading />);

    const button = screen.getByTestId('primary-button');
    fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
  });
});
