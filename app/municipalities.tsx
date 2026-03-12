import { LoadingView } from '@/components/LoadingView';
import { ScreenContainer } from '@/components/ScreenContainer';
import { getDb } from '@/lib/db/client';
import { MunicipalityRepository } from '@/lib/repositories/municipality-repository';
import type { Municipality } from '@/schema/municipality-dataset-schema';
import { useMunicipalityStore } from '@/stores/municipality-store';
import { useRouter } from 'expo-router';
import { Suspense, use, useMemo } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';

async function fetchMunicipalities(): Promise<Municipality[]> {
  const db = getDb();
  const repository = new MunicipalityRepository(db);
  return repository.findAll();
}

function MunicipalitiesContent({
  municipalityPromise,
}: {
  municipalityPromise: Promise<Municipality[]>;
}) {
  const municipalities = use(municipalityPromise);
  const router = useRouter();
  const setMunicipality = useMunicipalityStore((s) => s.setMunicipality);
  const selectedMunicipalityId = useMunicipalityStore((s) => s.selectedMunicipalityId);

  const handleSelect = (municipality: Municipality) => {
    Alert.alert('自治体を選択', `${municipality.displayName} を選択しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '保存',
        onPress: () => {
          setMunicipality({
            id: municipality.id,
            displayName: municipality.displayName,
            version: municipality.version,
          });
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <FlatList
      data={municipalities}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const isSelected = item.id === selectedMunicipalityId;
        return (
          <TouchableOpacity
            style={[styles.item, isSelected && styles.selectedItem]}
            onPress={() => handleSelect(item)}
            activeOpacity={0.7}
            disabled={isSelected}
          >
            <Text style={[styles.itemText, isSelected && styles.selectedItemText]}>
              {item.displayName}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

export default function MunicipalitiesScreen() {
  const promise = useMemo(() => fetchMunicipalities(), []);
  return (
    <ScreenContainer>
      <Text style={styles.title}>自治体を選択</Text>
      <Suspense fallback={<LoadingView />}>
        <MunicipalitiesContent municipalityPromise={promise} />
      </Suspense>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  item: {
    padding: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedItem: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0066cc',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedItemText: {
    color: '#0066cc',
    fontWeight: 'bold',
  },
});
