/**
 * ScreenContainer の単体テスト
 *
 * 目的: 共通スクリーンラッパーの表示責務を定義する。
 * 未実装時に失敗する（Red）状態で、実装の指針とする。
 */
import { View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { ScreenContainer } from '@/components/ScreenContainer';

describe('ScreenContainer', () => {
  it('children が正しく描画される', () => {
    render(
      <ScreenContainer>
        <View testID="content" />
      </ScreenContainer>
    );

    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('適切なラッパーで children を包む', () => {
    const { toJSON } = render(
      <ScreenContainer>
        <View testID="content" />
      </ScreenContainer>
    );

    const tree = toJSON();
    expect(tree).toBeTruthy();
    expect(screen.getByTestId('content')).toBeTruthy();
  });
});
