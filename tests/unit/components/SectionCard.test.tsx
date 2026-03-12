/**
 * SectionCard の単体テスト
 *
 * 目的: セクションカードの表示責務を定義する。
 * 未実装時に失敗する（Red）状態で、実装の指針とする。
 */
import { View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { SectionCard } from '@/components/SectionCard';

describe('SectionCard', () => {
  it('セクションのタイトルが正しく表示される', () => {
    render(
      <SectionCard title="基本情報">
        <View testID="card-content" />
      </SectionCard>
    );

    expect(screen.getByText('基本情報')).toBeTruthy();
  });

  it('children が正しく描画される', () => {
    render(
      <SectionCard title="基本情報">
        <View testID="card-content" />
      </SectionCard>
    );

    expect(screen.getByTestId('card-content')).toBeTruthy();
  });
});
