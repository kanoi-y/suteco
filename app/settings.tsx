import { useMunicipalityStore } from '@/stores/municipality-store';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { selectedMunicipalityName, datasetVersion } = useMunicipalityStore();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>設定画面</Text>

      <View style={styles.section}>
        <Text style={styles.label}>現在の自治体:</Text>
        <Text style={styles.value}>{selectedMunicipalityName ?? '未選択'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>データバージョン:</Text>
        <Text style={styles.value}>{datasetVersion ?? '不明'}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/municipalities')}>
        <Text style={styles.buttonText}>自治体を変更する</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    color: '#333',
  },
  button: {
    marginTop: 24,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
