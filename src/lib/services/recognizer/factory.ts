import type { RecognizerType } from '@/types/recognizer-type';
import type { Recognizer } from './types';
import { MockRecognizer } from './mock-recognizer';

/**
 * RecognizerType に応じて Recognizer インスタンスを生成する Factory
 * TODO: api と local の実装を追加する
 */
export function createRecognizer(type: RecognizerType): Recognizer {
  switch (type) {
    case 'mock':
    case 'api':
    case 'local':
      return new MockRecognizer();
    default:
      throw new Error(`Unknown recognizer type: ${type}`);
  }
}
