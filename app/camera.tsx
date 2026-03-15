import { createRecognizer } from '@/lib/services/recognizer';
import { useClassificationStore } from '@/stores/classification-store';
import { useSettingsStore } from '@/stores/settings-store';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../src/components/PrimaryButton';

export default function CameraScreen() {
  const router = useRouter();
  const { photoUri: initialPhotoUri } = useLocalSearchParams<{ photoUri?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(
    typeof initialPhotoUri === 'string' ? initialPhotoUri : null,
  );
  const cameraRef = useRef<CameraView>(null);

  const recognizerType = useSettingsStore((state) => state.recognizerType);
  const setSourceImageUri = useClassificationStore((state) => state.setSourceImageUri);
  const setStatus = useClassificationStore((state) => state.setStatus);
  const setCandidates = useClassificationStore((state) => state.setCandidates);
  const setErrorMessage = useClassificationStore((state) => state.setErrorMessage);

  const handleRequestPermission = () => {
    requestPermission();
  };

  const handleCapture = async () => {
    const photo = await cameraRef.current?.takePictureAsync();
    if (photo?.uri) {
      setPhotoUri(photo.uri);
    }
  };

  const handleRetake = () => {
    setPhotoUri(null);
  };

  const handleSelectFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setPhotoUri(result.assets[0].uri);
  };

  const handleJudge = async () => {
    if (!photoUri) return;

    setSourceImageUri(photoUri);
    setStatus('recognizing');

    try {
      const recognizer = createRecognizer(recognizerType);
      const result = await recognizer.recognize(photoUri);
      setCandidates(result.candidates);
      setStatus('success');
      router.push('/candidates');
    } catch (err) {
      const message = err instanceof Error ? err.message : '認識に失敗しました';
      setErrorMessage(message);
      setStatus('error');
    }
  };

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.permissionContent}>
          <Text style={styles.permissionMessage}>カメラの許可が必要です</Text>
          <PrimaryButton title="許可する" onPress={handleRequestPermission} />
        </View>
      </SafeAreaView>
    );
  }

  if (photoUri) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.previewContent}>
          <Image
            source={{ uri: photoUri }}
            style={styles.previewImage}
            testID="preview-image"
          />
          <View style={styles.previewActions}>
            <PrimaryButton title="再撮影" onPress={handleRetake} />
            <PrimaryButton title="判定する" onPress={handleJudge} />
          </View>
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
