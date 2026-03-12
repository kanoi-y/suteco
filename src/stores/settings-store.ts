import { create } from 'zustand';
import type { RecognizerType } from '@/types/recognizer-type';

export type SettingsState = {
  recognizerType: RecognizerType;
  showDebugInfo: boolean;
};

export type SettingsActions = {
  setRecognizerType: (type: RecognizerType) => void;
  setShowDebugInfo: (show: boolean) => void;
};

const initialState: SettingsState = {
  recognizerType: 'mock',
  showDebugInfo: false,
};

export const useSettingsStore = create<SettingsState & SettingsActions>((set) => ({
  ...initialState,
  setRecognizerType: (type) => set({ recognizerType: type }),
  setShowDebugInfo: (show) => set({ showDebugInfo: show }),
}));
