import { LoadingView } from '@/components/LoadingView';
import { ScreenContainer } from '@/components/ScreenContainer';
import { getDb } from '@/lib/db/client';
import { DisposalRuleRepository } from '@/lib/repositories/disposal-rule-repository';
import { ItemRepository } from '@/lib/repositories/item-repository';
import type { DisposalRule, Item } from '@/schema/municipality-dataset-schema';
import { useMunicipalityStore } from '@/stores/municipality-store';
import { useLocalSearchParams } from 'expo-router';
import { Suspense, use, useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type ItemDetailData = {
  item: Item | null;
  rule: DisposalRule | null;
};

async function fetchItemAndRule(
  itemId: string,
  municipalityId: string | null
): Promise<ItemDetailData> {
  if (!municipalityId) {
    return { item: null, rule: null };
  }
  const db = getDb();
  const itemRepository = new ItemRepository(db);
  const ruleRepository = new DisposalRuleRepository(db);
  const [item, rule] = await Promise.all([
    itemRepository.findById(itemId),
    ruleRepository.findByMunicipalityAndItem(municipalityId, itemId),
  ]);
  return { item, rule };
}

function ItemDetailContent({
  promise,
}: {
  promise: Promise<ItemDetailData>;
}) {
  const { item, rule } = use(promise);
  const hasRule = rule != null;

  if (hasRule && item) {
    const url = rule.officialUrl;
    return (
      <ScrollView style={styles.scroll}>
        <Text style={styles.title}>{item.displayName}</Text>
        <View style={styles.section}>
          <Text style={styles.label}>区分</Text>
          <Text style={styles.value}>{rule.categoryName}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>出し方</Text>
          <Text style={styles.value}>{rule.instructions}</Text>
        </View>
        {rule.notes != null && rule.notes !== '' && (
          <View style={styles.section}>
            <Text style={styles.label}>注意事項</Text>
            <Text style={styles.value}>{rule.notes}</Text>
          </View>
        )}
        {url != null && url !== '' && (
          <View style={styles.section}>
            <Text style={styles.label}>参考リンク</Text>
            <Pressable
              onPress={() => Linking.openURL(url)}
              style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
            >
              <Text style={styles.linkText}>{url}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    );
  }

  if (item && !hasRule) {
    return (
      <View style={styles.unsupportedContainer}>
        <Text style={styles.title}>{item.displayName}</Text>
        <Text style={styles.unsupportedMessage}>この自治体では分別ルールが登録されていません</Text>
      </View>
    );
  }

  return (
    <View style={styles.unsupportedContainer}>
      <Text style={styles.unsupportedMessage}>この自治体では分別ルールが登録されていません</Text>
    </View>
  );
}

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const selectedMunicipalityId = useMunicipalityStore((s) => s.selectedMunicipalityId);

  const promise = useMemo(
    () => fetchItemAndRule(id ?? '', selectedMunicipalityId ?? null),
    [id, selectedMunicipalityId]
  );

  return (
    <ScreenContainer>
      <Suspense fallback={<LoadingView />}>
        <ItemDetailContent promise={promise} />
      </Suspense>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  link: {
    paddingVertical: 8,
  },
  linkPressed: {
    opacity: 0.7,
  },
  linkText: {
    fontSize: 16,
    color: '#0066cc',
    textDecorationLine: 'underline',
  },
  unsupportedContainer: {
    flex: 1,
    paddingVertical: 24,
  },
  unsupportedMessage: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
});
