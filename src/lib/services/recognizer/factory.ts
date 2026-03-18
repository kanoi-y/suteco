import type { RecognizerType } from '@/types/recognizer-type';
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
    case 'api':
      return new ApiRecognizer();
    case 'local':
      return new MockRecognizer();
    default:
      throw new Error(`Unknown recognizer type: ${type}`);
  }
}
