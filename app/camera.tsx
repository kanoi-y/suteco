import { createRecognizer } from '@/lib/services/recognizer';
import { useClassificationStore } from '@/stores/classification-store';
import { useMunicipalityStore } from '@/stores/municipality-store';
import { useSettingsStore } from '@/stores/settings-store';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../src/components/PrimaryButton';

export default function CameraScreen() {
  const router = useRouter();
  const { photoUri: initialPhotoUri } = useLocalSearchParams<{ photoUri?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(
    typeof initialPhotoUri === 'string' ? initialPhotoUri : null
  );
  const cameraRef = useRef<CameraView>(null);

  const recognizerType = useSettingsStore((state) => state.recognizerType);
  const selectedMunicipalityId = useMunicipalityStore((s) => s.selectedMunicipalityId);
  const status = useClassificationStore((state) => state.status);
  const errorMessage = useClassificationStore((state) => state.errorMessage);
  const setSourceImageUri = useClassificationStore((state) => state.setSourceImageUri);
  const setStatus = useClassificationStore((state) => state.setStatus);
  const setCandidates = useClassificationStore((state) => state.setCandidates);
  const setErrorMessage = useClassificationStore((state) => state.setErrorMessage);
  const reset = useClassificationStore((state) => state.reset);

  useEffect(() => {
    reset();
  }, [reset]);

  const handleRequestPermission = () => {
    requestPermission();
  };

  const handleCapture = async () => {
    const photo = await cameraRef.current?.takePictureAsync();
    if (photo?.uri) {
      reset();
      setPhotoUri(photo.uri);
    }
  };

  const handleRetake = () => {
    reset();
    setPhotoUri(null);
  };

  const handleSelectFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    reset();
    setPhotoUri(result.assets[0].uri);
  };

  const handleJudge = async () => {
    if (!photoUri) return;
    if (!selectedMunicipalityId) {
      setStatus('error');
      setErrorMessage('自治体が選択されていません。設定から自治体を選択してください。');
      return;
    }

    setSourceImageUri(photoUri);
    setStatus('recognizing');

    try {
      const recognizer = createRecognizer(recognizerType);
      const result = await recognizer.recognize(photoUri, selectedMunicipalityId);
      setCandidates(result.candidates);
      setStatus('success');
      router.push('/candidates');
    } catch (err) {
      const message = err instanceof Error ? err.message : '認識に失敗しました';
      setErrorMessage(message);
      setStatus('error');
    }
  };

  const handleManualSearch = () => {
    router.push('/search');
  };

  if (photoUri) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.previewContent}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} testID="preview-image" />
          {status === 'error' ? (
            <View style={styles.errorActions}>
              <Text style={styles.errorMessage}>{errorMessage ?? '認識に失敗しました'}</Text>
              <View style={styles.previewActions}>
                <PrimaryButton title="再試行" onPress={handleJudge} />
                <PrimaryButton title="手動で検索" onPress={handleManualSearch} />
              </View>
            </View>
          ) : (
            <View style={styles.previewActions}>
              <PrimaryButton title="再撮影" onPress={handleRetake} />
              <PrimaryButton title="判定する" onPress={handleJudge} />
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    const isPermanentlyDenied = !permission.canAskAgain;
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.permissionContent}>
          <Text style={styles.permissionMessage}>
            {isPermanentlyDenied
              ? '設定からカメラの権限を許可してください'
              : 'カメラの許可が必要です'}
          </Text>
          <PrimaryButton
            title={isPermanentlyDenied ? '設定を開く' : '許可する'}
            onPress={isPermanentlyDenied ? () => Linking.openSettings() : handleRequestPermission}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera}>
        <SafeAreaView style={styles.cameraOverlay} edges={['top']}>
          <View style={styles.captureArea}>
            <PrimaryButton title="撮影" onPress={handleCapture} />
            <PrimaryButton title="ライブラリから選択" onPress={handleSelectFromLibrary} />
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionMessage: {
    fontSize: 16,
    marginBottom: 24,
  },
  previewContent: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  errorActions: {
    flexDirection: 'column',
    padding: 16,
    gap: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  captureArea: {
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
});
