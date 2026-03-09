import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RecognizerType } from "@/types/recognizer-type";

const KEYS = {
  MUNICIPALITY_ID: "settings:municipality_id",
  RECOGNIZER_TYPE: "settings:recognizer_type",
  DEBUG_MODE: "settings:debug_mode",
} as const;

export async function setMunicipalityId(id: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.MUNICIPALITY_ID, id);
}

export async function getMunicipalityId(): Promise<string | null> {
  return await AsyncStorage.getItem(KEYS.MUNICIPALITY_ID);
}

export async function setRecognizerType(type: RecognizerType): Promise<void> {
  await AsyncStorage.setItem(KEYS.RECOGNIZER_TYPE, type);
}

export async function getRecognizerType(): Promise<RecognizerType | null> {
  return (await AsyncStorage.getItem(KEYS.RECOGNIZER_TYPE)) as RecognizerType | null;
}

export async function setDebugMode(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.DEBUG_MODE, String(enabled));
}

export async function getDebugMode(): Promise<boolean> {
  const value = await AsyncStorage.getItem(KEYS.DEBUG_MODE);
  return value === "true";
}
