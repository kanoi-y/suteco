import { EmptyState } from '@/components/EmptyState';
import { ScreenContainer } from '@/components/ScreenContainer';
import { getDb } from '@/lib/db/client';
import { ItemRepository } from '@/lib/repositories/item-repository';
import {
  DefaultItemSearchService,
  type SearchResult,
} from '@/lib/services/item-search-service';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  const searchService = useMemo(() => {
    const db = getDb();
    const itemRepository = new ItemRepository(db);
    return new DefaultItemSearchService(itemRepository);
  }, []);

  const handleSearch = useCallback(
    async (text: string) => {
      setQuery(text);
      if (text.trim() === '') {
        setResults([]);
        return;
      }
      const searchResults = await searchService.search({ query: text.trim() });
      setResults(searchResults);
    },
    [searchService],
  );

  const handleResultPress = useCallback(
    (item: SearchResult) => {
      router.push(`/items/${item.itemId}`);
    },
    [router],
  );

  const showEmptyState = query.trim() !== '' && results.length === 0;

  return (
    <ScreenContainer>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="検索..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {showEmptyState ? (
        <EmptyState
          title="見つかりませんでした"
          message="検索条件に合う品目がありませんでした。"
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.itemId}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.resultItem,
                pressed && styles.resultItemPressed,
              ]}
              onPress={() => handleResultPress(item)}
            >
              <Text style={styles.resultText}>{item.displayName}</Text>
            </Pressable>
          )}
          style={styles.list}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
});
