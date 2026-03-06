import { Link } from "expo-router";
import { Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Suteco</Text>
      <Link href="/search" asChild>
        <Pressable style={{ padding: 16, borderWidth: 1, borderRadius: 8 }}>
          <Text>テキストで検索</Text>
        </Pressable>
      </Link>
    </SafeAreaView>
  );
}
