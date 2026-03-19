import type { RecognizerType } from '@/types/recognizer-type';
import { getDb } from '@/lib/db/client';
import { ItemRepository } from '@/lib/repositories/item-repository';
import { DefaultItemSearchService } from '@/lib/services/item-search-service';
import type { Recognizer } from './types';
import { ApiRecognizer } from './api-recognizer';
import { MockRecognizer } from './mock-recognizer';

/**
 * RecognizerType に応じて Recognizer インスタンスを生成する Factory
 * TODO: local の実装を追加する
 */
export function createRecognizer(type: RecognizerType): Recognizer {
  switch (type) {
    case 'mock':
      return new MockRecognizer();
    case 'api': {
      const db = getDb();
      const itemRepository = new ItemRepository(db);
      const searchService = new DefaultItemSearchService(itemRepository);
      return new ApiRecognizer(searchService);
    }
    case 'local':
      return new MockRecognizer();
    default:
      throw new Error(`Unknown recognizer type: ${type}`);
  }
}
