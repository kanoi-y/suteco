import { CameraView, useCameraPermissions } from 'expo-camera';
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
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

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

  const handleJudge = () => {
    // TODO: 判定処理への遷移
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
  },
});
