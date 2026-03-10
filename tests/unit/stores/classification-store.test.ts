import {
  useClassificationStore,
  type ClassificationState,
  type ClassificationStatus,
} from "@/stores/classification-store";
import type { Candidate } from "@/types/candidate";

const initialState: ClassificationState = {
  sourceImageUri: null,
  candidates: [],
  selectedItemId: null,
  status: "idle",
  errorMessage: null,
};

function resetStore(): void {
  useClassificationStore.setState(initialState);
}

const sampleCandidates: Candidate[] = [
  { itemId: "item-1", label: "ペットボトル", score: 0.95 },
  { itemId: "item-2", label: "びん", score: 0.8 },
];

describe("classificationStore", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("初期状態", () => {
    it("全ての状態が初期値であること", () => {
      const state = useClassificationStore.getState();
      expect(state.sourceImageUri).toBeNull();
      expect(state.candidates).toEqual([]);
      expect(state.selectedItemId).toBeNull();
      expect(state.status).toBe("idle");
      expect(state.errorMessage).toBeNull();
    });
  });

  describe("setSourceImageUri", () => {
    it("渡した URI が状態に反映されること", () => {
      const { setSourceImageUri } = useClassificationStore.getState();
      setSourceImageUri("file:///path/to/image.jpg");

      const state = useClassificationStore.getState();
      expect(state.sourceImageUri).toBe("file:///path/to/image.jpg");
    });

    it("null に戻せること", () => {
      const { setSourceImageUri } = useClassificationStore.getState();
      setSourceImageUri("file:///img.jpg");
      setSourceImageUri(null);

      const state = useClassificationStore.getState();
      expect(state.sourceImageUri).toBeNull();
    });
  });

  describe("setCandidates", () => {
    it("渡した候補リストが状態に反映されること", () => {
      const { setCandidates } = useClassificationStore.getState();
      setCandidates(sampleCandidates);

      const state = useClassificationStore.getState();
      expect(state.candidates).toEqual(sampleCandidates);
    });

    it("空配列に戻せること", () => {
      const { setCandidates } = useClassificationStore.getState();
      setCandidates(sampleCandidates);
      setCandidates([]);

      const state = useClassificationStore.getState();
      expect(state.candidates).toEqual([]);
    });
  });

  describe("setSelectedItemId", () => {
    it("渡した ID が状態に反映されること", () => {
      const { setSelectedItemId } = useClassificationStore.getState();
      setSelectedItemId("item-1");

      const state = useClassificationStore.getState();
      expect(state.selectedItemId).toBe("item-1");
    });

    it("null に戻せること", () => {
      const { setSelectedItemId } = useClassificationStore.getState();
      setSelectedItemId("item-1");
      setSelectedItemId(null);

      const state = useClassificationStore.getState();
      expect(state.selectedItemId).toBeNull();
    });
  });

  describe("setStatus", () => {
    it.each<ClassificationStatus>([
      "idle",
      "recognizing",
      "success",
      "error",
    ])("status を %s に変更できること", (status) => {
      const { setStatus } = useClassificationStore.getState();
      setStatus(status);

      const state = useClassificationStore.getState();
      expect(state.status).toBe(status);
    });
  });

  describe("setErrorMessage", () => {
    it("渡したメッセージが状態に反映されること", () => {
      const { setErrorMessage } = useClassificationStore.getState();
      setErrorMessage("認識に失敗しました");

      const state = useClassificationStore.getState();
      expect(state.errorMessage).toBe("認識に失敗しました");
    });

    it("null に戻せること", () => {
      const { setErrorMessage } = useClassificationStore.getState();
      setErrorMessage("エラー");
      setErrorMessage(null);

      const state = useClassificationStore.getState();
      expect(state.errorMessage).toBeNull();
    });
  });

  describe("reset", () => {
    it("状態を変更した後に reset を呼び出すと、全ての状態が初期値に戻ること", () => {
      useClassificationStore.setState({
        sourceImageUri: "file:///img.jpg",
        candidates: sampleCandidates,
        selectedItemId: "item-1",
        status: "success",
        errorMessage: "some error",
      });

      const { reset } = useClassificationStore.getState();
      reset();

      const state = useClassificationStore.getState();
      expect(state.sourceImageUri).toBeNull();
      expect(state.candidates).toEqual([]);
      expect(state.selectedItemId).toBeNull();
      expect(state.status).toBe("idle");
      expect(state.errorMessage).toBeNull();
    });
  });
});
