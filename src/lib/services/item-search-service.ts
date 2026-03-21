import type { Item } from '@/schema/municipality-dataset-schema';

export type SearchResult = {
  itemId: string;
  displayName: string;
  matchedBy:
    | 'display_name_exact'
    | 'alias_exact'
    | 'display_name_partial'
    | 'alias_partial'
    | 'keyword_partial'
    | 'category_browse';
};

export interface ItemSearchService {
  search(params: {
    query: string;
    municipalityId: string;
    categoryName?: string;
    limit?: number;
  }): Promise<SearchResult[]>;
}

/** 品目検索サービスが依存する Repository の最小インターフェース */
export interface ItemRepositoryLike {
  findByMunicipalityId(
    municipalityId: string,
    options?: { categoryName?: string }
  ): Promise<Item[]>;
}

/**
 * 品目検索サービスのデフォルト実装
 * ItemRepositoryLike の findByMunicipalityId で取得した品目を検索する
 */
export class DefaultItemSearchService implements ItemSearchService {
  constructor(private readonly itemRepository: ItemRepositoryLike) {}

  async search(params: {
    query: string;
    municipalityId: string;
    categoryName?: string;
    limit?: number;
  }): Promise<SearchResult[]> {
    const { query, municipalityId, categoryName, limit } = params;
    const trimmedQuery = query.trim();
    const repoOptions = categoryName != null && categoryName !== '' ? { categoryName } : undefined;

    if (trimmedQuery === '' && !repoOptions) {
      return [];
    }

    const items = await this.itemRepository.findByMunicipalityId(municipalityId, repoOptions);

    if (trimmedQuery === '') {
      const sorted = [...items].sort((a, b) => a.displayName.localeCompare(b.displayName, 'ja'));
      const browseResults: SearchResult[] = sorted.map((item) => ({
        itemId: item.id,
        displayName: item.displayName,
        matchedBy: 'category_browse',
      }));
      return limit != null ? browseResults.slice(0, limit) : browseResults;
    }

    const scoreMap: Record<SearchResult['matchedBy'], number> = {
      display_name_exact: 5,
      alias_exact: 4,
      display_name_partial: 3,
      alias_partial: 2,
      keyword_partial: 1,
      category_browse: 0,
    };

    const results: SearchResult[] = [];

    for (const item of items) {
      if (item.displayName === trimmedQuery) {
        results.push({
          itemId: item.id,
          displayName: item.displayName,
          matchedBy: 'display_name_exact',
        });
        continue;
      }
      if (item.aliases.includes(trimmedQuery)) {
        results.push({
          itemId: item.id,
          displayName: item.displayName,
          matchedBy: 'alias_exact',
        });
        continue;
      }
      if (item.displayName.includes(trimmedQuery)) {
        results.push({
          itemId: item.id,
          displayName: item.displayName,
          matchedBy: 'display_name_partial',
        });
        continue;
      }
      if (item.aliases.some((alias) => alias.includes(trimmedQuery))) {
        results.push({
          itemId: item.id,
          displayName: item.displayName,
          matchedBy: 'alias_partial',
        });
        continue;
      }
      if (item.keywords.some((keyword) => keyword.includes(trimmedQuery))) {
        results.push({
          itemId: item.id,
          displayName: item.displayName,
          matchedBy: 'keyword_partial',
        });
      }
    }

    results.sort((a, b) => scoreMap[b.matchedBy] - scoreMap[a.matchedBy]);

    return limit != null ? results.slice(0, limit) : results;
  }
}
