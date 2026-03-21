import { EmptyState } from '@/components/EmptyState';
import { ScreenContainer } from '@/components/ScreenContainer';
import { getDb } from '@/lib/db/client';
import { DisposalRuleRepository } from '@/lib/repositories/disposal-rule-repository';
import { ItemRepository } from '@/lib/repositories/item-repository';
import { DefaultItemSearchService, type SearchResult } from '@/lib/services/item-search-service';
import { useMunicipalityStore } from '@/stores/municipality-store';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

/** 画面の再マウントではリセットしない。自治体IDが変わったときだけ検索状態をクリアする */
let lastKnownMunicipalityIdForSearchScreen: string | null | undefined;

export default function SearchScreen() {
  const router = useRouter();
  const selectedMunicipalityId = useMunicipalityStore((s) => s.selectedMunicipalityId);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const searchService = useMemo(() => {
    const db = getDb();
    const itemRepository = new ItemRepository(db);
    return new DefaultItemSearchService(itemRepository);
  }, []);

  const executeSearch = useCallback(
    async (text: string, category: string | null) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (!selectedMunicipalityId) {
        setResults([]);
        return;
      }

      const trimmed = text.trim();
      if (trimmed === '' && category == null) {
        setResults([]);
        return;
      }

      try {
        const searchResults = await searchService.search({
          query: trimmed,
          municipalityId: selectedMunicipalityId,
          ...(category != null && category !== '' ? { categoryName: category } : {}),
        });

        if (!controller.signal.aborted) {
          setResults(searchResults);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Search error:', error);
      }
    },
    [searchService, selectedMunicipalityId]
  );

  useEffect(() => {
    let cancelled = false;

    if (!selectedMunicipalityId) {
      setCategories([]);
      setSelectedCategory(null);
      setQuery('');
      setResults([]);
      lastKnownMunicipalityIdForSearchScreen = null;
      return;
    }

    if (lastKnownMunicipalityIdForSearchScreen !== selectedMunicipalityId) {
      setSelectedCategory(null);
      setQuery('');
      setResults([]);
      lastKnownMunicipalityIdForSearchScreen = selectedMunicipalityId;
    }

    const loadCategories = async () => {
      const db = getDb();
      const disposalRuleRepository = new DisposalRuleRepository(db);
      const names = await disposalRuleRepository.listDistinctCategoryNames(selectedMunicipalityId);
      if (!cancelled) {
        setCategories(names);
      }
    };

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, [selectedMunicipalityId]);

  const handleQueryChange = useCallback(
    (text: string) => {
      setQuery(text);
      void executeSearch(text, selectedCategory);
    },
    [executeSearch, selectedCategory]
  );

  const handlePickCategory = useCallback(
    (category: string | null) => {
      setSelectedCategory(category);
      setCategoryModalVisible(false);
      void executeSearch(query, category);
    },
    [executeSearch, query]
  );

  const handleResultPress = useCallback(
    (item: SearchResult) => {
      router.push(`/items/${item.itemId}`);
    },
    [router]
  );

  const categoryLabel = selectedCategory ?? 'すべて';
  const showEmptyState = (query.trim() !== '' || selectedCategory != null) && results.length === 0;

  const modalRows = useMemo(() => {
    return [{ id: '__all__', name: null as string | null, label: 'すべて' }].concat(
      categories.map((c) => ({ id: c, name: c, label: c }))
    );
  }, [categories]);

  return (
    <ScreenContainer>
      <View style={styles.categoryRow}>
        <Text style={styles.categoryLabel}>カテゴリー</Text>
        <Pressable
          style={({ pressed }) => [styles.categoryPicker, pressed && styles.categoryPickerPressed]}
          onPress={() => setCategoryModalVisible(true)}
        >
          <Text style={styles.categoryPickerText} numberOfLines={1}>
            {categoryLabel}
          </Text>
          <Text style={styles.categoryChevron}>▼</Text>
        </Pressable>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="検索..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={handleQueryChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {showEmptyState ? (
        <EmptyState title="見つかりませんでした" message="検索条件に合う品目がありませんでした。" />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.itemId}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.resultItem, pressed && styles.resultItemPressed]}
              onPress={() => handleResultPress(item)}
            >
              <Text style={styles.resultText}>{item.displayName}</Text>
            </Pressable>
          )}
          style={styles.list}
        />
      )}

      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setCategoryModalVisible(false)}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>カテゴリーを選択</Text>
            <FlatList
              style={styles.modalList}
              data={modalRows}
              keyExtractor={(row) => row.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item: row }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.modalRow,
                    pressed && styles.modalRowPressed,
                    selectedCategory === row.name && styles.modalRowSelected,
                  ]}
                  onPress={() => handlePickCategory(row.name)}
                >
                  <Text style={styles.modalRowText}>{row.label}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  categoryRow: {
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  categoryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryPickerPressed: {
    backgroundColor: '#f5f5f5',
  },
  categoryPickerText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  categoryChevron: {
    fontSize: 12,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  resultItemPressed: {
    backgroundColor: '#f5f5f5',
  },
  resultText: {
    fontSize: 16,
    color: '#333',
  },
  list: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  modalList: {
    flexGrow: 0,
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalRowPressed: {
    backgroundColor: '#f5f5f5',
  },
  modalRowSelected: {
    backgroundColor: '#f0f7ff',
  },
  modalRowText: {
    fontSize: 16,
    color: '#333',
  },
});
