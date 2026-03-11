/**
 * トップ画面主要導線の結合テスト
 *
 * 目的: トップ画面の主要導線を先に固定する。
 * トップ画面未実装時には、これらのテストが失敗する。
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import { mockRouter } from "../helpers/expo-router-mock";
import HomeScreen from "../../app/index";

jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn(),
}));

describe("トップ画面主要導線", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("アプリ名が表示される", () => {
    render(<HomeScreen />);
    expect(screen.getByText("Suteco")).toBeTruthy();
  });

  it("カメラで判定ボタン押下でカメラ画面へ遷移する", () => {
    render(<HomeScreen />);

    const cameraButton = screen.getByText("カメラで判定");
    fireEvent.press(cameraButton);

    expect(mockRouter.push).toHaveBeenCalledWith("/camera");
  });

  it("画像から判定ボタン押下で画像ライブラリを起動する", () => {
    render(<HomeScreen />);

    const imageButton = screen.getByText("画像から判定");
    fireEvent.press(imageButton);

    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
  });

  it("テキストで検索ボタン押下で検索画面へ遷移する", () => {
    render(<HomeScreen />);

    const searchButton = screen.getByText("テキストで検索");
    fireEvent.press(searchButton);

    expect(mockRouter.push).toHaveBeenCalledWith("/search");
  });

  it("設定ボタン押下で設定画面へ遷移する", () => {
    render(<HomeScreen />);

    const settingsButton = screen.getByText("設定");
    fireEvent.press(settingsButton);

    expect(mockRouter.push).toHaveBeenCalledWith("/settings");
  });
});
