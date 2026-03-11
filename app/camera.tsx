import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CameraScreen() {
  return (
    <SafeAreaView style={{ flex: 1, padding: 24 }}>
      <Text>カメラ画面</Text>
    </SafeAreaView>
  );
}
