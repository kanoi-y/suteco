import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getDebugMode,
  getMunicipalityId,
  getRecognizerType,
  setDebugMode,
  setMunicipalityId,
  setRecognizerType,
} from "@/lib/storage/settings-storage";

jest.mock("@react-native-async-storage/async-storage");

describe("settingsStorage", () => {
  const mockStore: Record<string, string> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    for (const k of Object.keys(mockStore)) delete mockStore[k];

    (AsyncStorage.setItem as jest.Mock).mockImplementation(
      async (key: string, value: string) => {
        mockStore[key] = value;
      }
    );
    (AsyncStorage.getItem as jest.Mock).mockImplementation(
      async (key: string) => mockStore[key] ?? null
    );
  });

  describe("選択自治体 ID 保存 / 取得", () => {
    it("自治体 ID を保存し、取得できる", async () => {
      await setMunicipalityId("test-city");
      const id = await getMunicipalityId();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "settings:municipality_id",
        "test-city"
      );
      expect(id).toBe("test-city");
    });

    it("未保存時は null を返す", async () => {
      const id = await getMunicipalityId();

      expect(id).toBeNull();
    });
  });

  describe("recognizerType 保存 / 取得", () => {
    it("mock を保存し、取得できる", async () => {
      await setRecognizerType("mock");
      const type = await getRecognizerType();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "settings:recognizer_type",
        "mock"
      );
      expect(type).toBe("mock");
    });

    it("api を保存し、取得できる", async () => {
      await setRecognizerType("api");
      const type = await getRecognizerType();

      expect(type).toBe("api");
    });

    it("local を保存し、取得できる", async () => {
      await setRecognizerType("local");
      const type = await getRecognizerType();

      expect(type).toBe("local");
    });

    it("未保存時は null を返す", async () => {
      const type = await getRecognizerType();

      expect(type).toBeNull();
    });
  });

  describe("debug 設定 保存 / 取得", () => {
    it("true を保存し、取得できる", async () => {
      await setDebugMode(true);
      const enabled = await getDebugMode();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "settings:debug_mode",
        "true"
      );
      expect(enabled).toBe(true);
    });

    it("false を保存し、取得できる", async () => {
      await setDebugMode(false);
      const enabled = await getDebugMode();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "settings:debug_mode",
        "false"
      );
      expect(enabled).toBe(false);
    });

    it("未保存時は false を返す（デフォルト）", async () => {
      const enabled = await getDebugMode();

      expect(enabled).toBe(false);
    });
  });
});
