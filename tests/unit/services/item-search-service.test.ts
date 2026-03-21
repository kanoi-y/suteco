import { DefaultItemSearchService } from '@/lib/services/item-search-service';
import type { Item } from '@/schema/municipality-dataset-schema';

/** テスト用の Fake ItemRepository - メモリ上の品目一覧を返す */
class FakeItemRepository {
  constructor(
    private readonly items: Item[] = [],
    private readonly itemCategoryById: Record<string, string> = {}
  ) {}

  async findByMunicipalityId(
    _municipalityId: string,
    options?: { categoryName?: string }
  ): Promise<Item[]> {
    const cat = options?.categoryName;
    if (cat != null && cat !== '') {
      return this.items.filter((item) => this.itemCategoryById[item.id] === cat);
    }
    return [...this.items];
  }
}

function createItem(overrides?: Partial<Item>): Item {
  return {
    id: 'item_a',
    displayName: 'プラスチック',
    aliases: ['プラ'],
    keywords: ['ペットボトル', '容器'],
    ...overrides,
  };
}

describe('DefaultItemSearchService', () => {
  describe('完全一致テスト', () => {
    it('表示名が完全一致する品目を検索できる', async () => {
      const items = [createItem({ id: 'item_1', displayName: 'プラスチック' })];
      const service = new DefaultItemSearchService(new FakeItemRepository(items));

      const results = await service.search({ query: 'プラスチック', municipalityId: 'test-city' });

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        itemId: 'item_1',
        displayName: 'プラスチック',
        matchedBy: 'display_name_exact',
      });
    });
  });

  describe('alias 完全一致テスト', () => {
    it('別名が完全一致する品目を検索できる', async () => {
      const items = [
        createItem({ id: 'item_2', displayName: 'プラスチック製容器', aliases: ['プラ'] }),
      ];
      const service = new DefaultItemSearchService(new FakeItemRepository(items));

      const results = await service.search({ query: 'プラ', municipalityId: 'test-city' });

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        itemId: 'item_2',
        displayName: 'プラスチック製容器',
        matchedBy: 'alias_exact',
      });
    });
  });

  describe('部分一致テスト', () => {
    it('表示名の部分一致で品目を検索できる', async () => {
      const items = [createItem({ id: 'item_3', displayName: 'プラスチック', aliases: [] })];
      const service = new DefaultItemSearchService(new FakeItemRepository(items));

      const results = await service.search({ query: 'スチック', municipalityId: 'test-city' });

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        itemId: 'item_3',
        displayName: 'プラスチック',
        matchedBy: 'display_name_partial',
      });
    });

    it('別名の部分一致で品目を検索できる', async () => {
      const items = [
        createItem({
          id: 'item_4',
          displayName: '紙パック',
          aliases: ['牛乳パック', 'ジュースパック'],
        }),
      ];
      const service = new DefaultItemSearchService(new FakeItemRepository(items));

      const results = await service.search({ query: '牛乳', municipalityId: 'test-city' });

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        itemId: 'item_4',
        displayName: '紙パック',
        matchedBy: 'alias_partial',
      });
    });
  });

  describe('keyword 一致テスト', () => {
    it('キーワードの部分一致で品目を検索できる', async () => {
      const items = [
        createItem({
          id: 'item_5',
          displayName: 'プラスチック',
          aliases: [],
          keywords: ['ペットボトル', '容器'],
        }),
      ];
      const service = new DefaultItemSearchService(new FakeItemRepository(items));

      const results = await service.search({ query: 'ペットボトル', municipalityId: 'test-city' });

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        itemId: 'item_5',
        displayName: 'プラスチック',
        matchedBy: 'keyword_partial',
      });
    });
  });

  describe('スコア順テスト', () => {
    it('検索結果がスコア優先順（表示名完全 > 別名完全 > 表示名部分 > 別名部分 > キーワード部分）で並ぶ', async () => {
      const items = [
        createItem({
          id: 'keyword_only',
          displayName: 'その他',
          aliases: [],
          keywords: ['電池'],
        }),
        createItem({
          id: 'alias_partial',
          displayName: 'その他金属',
          aliases: ['単三電池', '単四電池'],
          keywords: [],
        }),
        createItem({
          id: 'display_partial',
          displayName: 'ボタン電池',
          aliases: [],
          keywords: [],
        }),
        createItem({
          id: 'alias_exact',
          displayName: '充電式電池',
          aliases: ['電池'],
          keywords: [],
        }),
        createItem({
          id: 'display_exact',
          displayName: '電池',
          aliases: [],
          keywords: [],
        }),
      ];
      const service = new DefaultItemSearchService(new FakeItemRepository(items));

      const results = await service.search({ query: '電池', municipalityId: 'test-city' });

      expect(results.map((r) => r.itemId)).toEqual([
        'display_exact',
        'alias_exact',
        'display_partial',
        'alias_partial',
        'keyword_only',
      ]);
    });
  });

  describe('空入力テスト', () => {
    it('空文字のクエリでは空配列を返す', async () => {
      const items = [createItem()];
      const service = new DefaultItemSearchService(new FakeItemRepository(items));

      const results = await service.search({ query: '', municipalityId: 'test-city' });

      expect(results).toEqual([]);
    });
  });

  describe('カテゴリー絞り込み', () => {
    it('categoryName 指定時はそのカテゴリーの品目だけを検索対象にする', async () => {
      const items = [
        createItem({ id: 'burn', displayName: 'テストA', aliases: [], keywords: [] }),
        createItem({ id: 'plastic', displayName: 'テストB', aliases: [], keywords: [] }),
      ];
      const categoryById: Record<string, string> = {
        burn: '燃やすごみ',
        plastic: 'プラスチック製容器包装',
      };
      const service = new DefaultItemSearchService(new FakeItemRepository(items, categoryById));

      const unfiltered = await service.search({ query: 'テスト', municipalityId: 'test-city' });
      expect(unfiltered).toHaveLength(2);

      const filtered = await service.search({
        query: 'テスト',
        municipalityId: 'test-city',
        categoryName: '燃やすごみ',
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.itemId).toBe('burn');
    });
  });

  describe('カテゴリーブラウズ', () => {
    it('クエリが空で categoryName のみ指定時は該当品目を表示名順で返す', async () => {
      const items = [
        createItem({ id: 'c', displayName: 'いちご', aliases: [], keywords: [] }),
        createItem({ id: 'a', displayName: 'あんず', aliases: [], keywords: [] }),
      ];
      const categoryById: Record<string, string> = { c: '果物', a: '果物' };
      const service = new DefaultItemSearchService(new FakeItemRepository(items, categoryById));

      const results = await service.search({
        query: '',
        municipalityId: 'test-city',
        categoryName: '果物',
      });

      expect(results.map((r) => r.itemId)).toEqual(['a', 'c']);
      expect(results.every((r) => r.matchedBy === 'category_browse')).toBe(true);
    });
  });
});
