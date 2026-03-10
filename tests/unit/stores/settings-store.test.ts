import { useSettingsStore } from "@/stores/settings-store";

const initialState = {
  recognizerType: "mock" as const,
  showDebugInfo: false,
};

function resetStore(): void {
  useSettingsStore.setState(initialState);
}

describe("settingsStore", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("初期状態", () => {
    it("recognizerType が mock、showDebugInfo が false であること", () => {
      const state = useSettingsStore.getState();
      expect(state.recognizerType).toBe("mock");
      expect(state.showDebugInfo).toBe(false);
    });
  });

  describe("setRecognizerType", () => {
    it("渡した認識方式が状態に反映されること", () => {
      const { setRecognizerType } = useSettingsStore.getState();
      setRecognizerType("api");

      const state = useSettingsStore.getState();
      expect(state.recognizerType).toBe("api");
    });

    it("local に変更できること", () => {
      const { setRecognizerType } = useSettingsStore.getState();
      setRecognizerType("local");

      const state = useSettingsStore.getState();
      expect(state.recognizerType).toBe("local");
    });
  });

  describe("setShowDebugInfo", () => {
    it("デバッグ表示フラグを true に切り替えられること", () => {
      const { setShowDebugInfo } = useSettingsStore.getState();
      setShowDebugInfo(true);

      const state = useSettingsStore.getState();
      expect(state.showDebugInfo).toBe(true);
    });

    it("デバッグ表示フラグを false に切り替えられること", () => {
      const { setShowDebugInfo } = useSettingsStore.getState();
      setShowDebugInfo(true);
      setShowDebugInfo(false);

      const state = useSettingsStore.getState();
      expect(state.showDebugInfo).toBe(false);
    });
  });
});
