/**
 * EmptyState の単体テスト
 *
 * 目的: 空状態コンポーネントの表示責務を定義する。
 * 未実装時に失敗する（Red）状態で、実装の指針とする。
 */
import { fireEvent, render, screen } from '@testing-library/react-native';
import { EmptyState } from '@/components/EmptyState';

describe('EmptyState', () => {
  it('メッセージが正しく表示される', () => {
    render(<EmptyState title="データがありません" message="新しい項目を追加してください" />);

    expect(screen.getByText('データがありません')).toBeTruthy();
    expect(screen.getByText('新しい項目を追加してください')).toBeTruthy();
  });

  it('アクションボタンが指定された場合にボタンが表示され、プレスでコールバックが呼ばれる', () => {
    const onAction = jest.fn();
    render(
      <EmptyState
        title="データがありません"
        message="新しい項目を追加してください"
        actionLabel="新規作成"
        onAction={onAction}
      />
    );

    const button = screen.getByText('新規作成');
    expect(button).toBeTruthy();

    fireEvent.press(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
