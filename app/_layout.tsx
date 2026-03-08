import { Stack } from "expo-router";
import { InitializationProvider } from "@/components/InitializationProvider";

export default function RootLayout() {
  return (
    <InitializationProvider>
      <Stack screenOptions={{ headerBackTitle: "戻る" }} />
    </InitializationProvider>
  );
}
