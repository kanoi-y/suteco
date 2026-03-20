import type { Recognizer, RecognitionResult } from './types';

/**
 * 開発用のモック認識実装
 * 固定のダミー候補を返す
 */
export class MockRecognizer implements Recognizer {
  async recognize(_imageUri: string, _municipalityId: string): Promise<RecognitionResult> {
    await new Promise((resolve) => setTimeout(resolve, 0));

    return {
      candidates: [
        { itemId: 'item_1', label: 'ペットボトル', score: 0.95 },
        { itemId: 'item_2', label: '空き缶', score: 0.82 },
        { itemId: 'item_3', label: '瓶', score: 0.45 },
      ],
    };
  }
}
