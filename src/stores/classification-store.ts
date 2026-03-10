import { create } from "zustand";
import type { Candidate } from "@/types/candidate";

export type ClassificationStatus =
  | "idle"
  | "recognizing"
  | "success"
  | "error";

export type ClassificationState = {
  sourceImageUri: string | null;
  candidates: Candidate[];
  selectedItemId: string | null;
  status: ClassificationStatus;
  errorMessage: string | null;
};

export type ClassificationActions = {
  setSourceImageUri: (uri: string | null) => void;
  setCandidates: (candidates: Candidate[]) => void;
  setSelectedItemId: (id: string | null) => void;
  setStatus: (status: ClassificationStatus) => void;
  setErrorMessage: (msg: string | null) => void;
  reset: () => void;
};

const initialState: ClassificationState = {
  sourceImageUri: null,
  candidates: [],
  selectedItemId: null,
  status: "idle",
  errorMessage: null,
};

export const useClassificationStore = create<
  ClassificationState & ClassificationActions
>((set) => ({
  ...initialState,
  setSourceImageUri: (uri) => set({ sourceImageUri: uri }),
  setCandidates: (candidates) => set({ candidates }),
  setSelectedItemId: (id) => set({ selectedItemId: id }),
  setStatus: (status) => set({ status }),
  setErrorMessage: (msg) => set({ errorMessage: msg }),
  reset: () => set(initialState),
}));
