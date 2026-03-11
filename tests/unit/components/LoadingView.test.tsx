/**
 * LoadingView の単体テスト
 *
 * 目的: ローディング表示コンポーネントの表示責務を定義する。
 * 未実装時に失敗する（Red）状態で、実装の指針とする。
 */
import { render, screen } from "@testing-library/react-native";
import { LoadingView } from "@/components/LoadingView";

describe("LoadingView", () => {
  it("ActivityIndicator が表示される", () => {
    render(<LoadingView />);

    expect(screen.getByTestId("loading-view-indicator")).toBeTruthy();
  });

  it("オプションで渡されたメッセージテキストが表示される", () => {
    render(<LoadingView message="読み込み中..." />);

    expect(screen.getByText("読み込み中...")).toBeTruthy();
  });
});
