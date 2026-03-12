import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useMunicipalityStore } from '@/stores/municipality-store';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const selectedMunicipality = useMunicipalityStore();
  const _hasHydrated = selectedMunicipality._hasHydrated;
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return;

    let isMounted = true;
    const validate = async () => {
      if (selectedMunicipality.selectedMunicipalityId === null) {
        if (isMounted) setIsValidating(false);
        router.replace('/municipalities');
        return;
      }

      // DBに存在するか検証し、最新のname/versionに同期。無効ならstateをクリア。
      await selectedMunicipality.loadMunicipality(selectedMunicipality.selectedMunicipalityId);
      if (isMounted) setIsValidating(false);
    };

    validate();

    return () => {
      isMounted = false;
    };
  }, [_hasHydrated, selectedMunicipality.selectedMunicipalityId, router, selectedMunicipality.loadMunicipality]);

  if (!_hasHydrated || isValidating) {
    return null;
  }

  const handleCameraPress = () => {
    router.push('/camera');
  };

  const handleImagePickerPress = async () => {
    await ImagePicker.launchImageLibraryAsync();
  };

  const handleSearchPress = () => {
    router.push('/search');
  };

  const handleSettingsPress = () => {
    router.push('/settings');
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.appName}>Suteco</Text>
        <Text style={styles.municipality}>
          {selectedMunicipality.selectedMunicipalityName ?? '未選択'}
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
    fontWeight: '700',
    color: '#333',
  },
  municipality: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actions: {
    gap: 12,
  },
  settingsButton: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  settingsText: {
    fontSize: 16,
    color: '#333',
  },
});
