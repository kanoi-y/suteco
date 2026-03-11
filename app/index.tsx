import { type Href, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useMunicipalityStore } from "@/stores/municipality-store";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/ScreenContainer";

export default function HomeScreen() {
  const router = useRouter();
  const selectedMunicipalityName = useMunicipalityStore(
    (s) => s.selectedMunicipalityName
  );

  const handleCameraPress = () => {
    router.push("/camera" as Href);
  };

  const handleImagePickerPress = async () => {
    await ImagePicker.launchImageLibraryAsync();
  };

  const handleSearchPress = () => {
    router.push("/search");
  };

  const handleSettingsPress = () => {
    router.push("/settings" as Href);
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.appName}>Suteco</Text>
        <Text style={styles.municipality}>
          {selectedMunicipalityName ?? "未選択"}
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton title="カメラで判定" onPress={handleCameraPress} />
        <PrimaryButton title="画像から判定" onPress={handleImagePickerPress} />
        <PrimaryButton title="テキストで検索" onPress={handleSearchPress} />
        <Pressable style={styles.settingsButton} onPress={handleSettingsPress}>
          <Text style={styles.settingsText}>設定</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  appName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },
  municipality: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  actions: {
    gap: 12,
  },
  settingsButton: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    alignItems: "center",
  },
  settingsText: {
    fontSize: 16,
    color: "#333",
  },
});
