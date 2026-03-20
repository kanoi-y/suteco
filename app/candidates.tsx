import { Image, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useClassificationStore } from '@/stores/classification-store';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SectionCard } from '@/components/SectionCard';
import { PrimaryButton } from '@/components/PrimaryButton';

export default function CandidatesScreen() {
  const router = useRouter();
  const { sourceImageUri, candidates } = useClassificationStore();

  return (
    <ScreenContainer>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {sourceImageUri ? (
          <Image testID="source-image" source={{ uri: sourceImageUri }} style={styles.thumbnail} />
        ) : null}
        <SectionCard title="認識結果の候補">
          {candidates.length > 0 ? (
            candidates.map((candidate) => (
              <TouchableOpacity
                key={candidate.itemId}
                onPress={() => router.push(`/items/${candidate.itemId}`)}
                style={styles.candidateItem}
                activeOpacity={0.7}
              >
                <Text style={styles.candidateLabel}>{candidate.label}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>候補が見つかりませんでした。</Text>
          )}
        </SectionCard>
        <PrimaryButton title="テキストで検索" onPress={() => router.push('/search')} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#e0e0e0',
  },
  candidateItem: {
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  candidateLabel: {
    fontSize: 16,
    color: '#333',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
