import { MockRecognizer } from '@/lib/services/recognizer';
import type { Recognizer } from '@/lib/services/recognizer';

describe('MockRecognizer', () => {
  describe('Recognizer 期待値テスト', () => {
    it('Recognizer インターフェースを実装していること', () => {
      const recognizer: Recognizer = new MockRecognizer();
      expect(recognizer).toHaveProperty('recognize');
      expect(typeof recognizer.recognize).toBe('function');
    });

    it('recognize が Promise を返すこと', async () => {
      const recognizer = new MockRecognizer();
      const resultPromise = recognizer.recognize('file:///test/image.jpg');
      expect(resultPromise).toBeInstanceOf(Promise);
      await expect(resultPromise).resolves.toBeDefined();
    });
  });

  describe('MockRecognizer が候補を返すテスト', () => {
    it('recognize を呼ぶと固定のダミー候補を信頼度降順で返すこと', async () => {
      const recognizer = new MockRecognizer();
      const result = await recognizer.recognize('file:///any/image.jpg');

      expect(result).toHaveProperty('candidates');
      expect(Array.isArray(result.candidates)).toBe(true);

      expect(result.candidates.length).toBeGreaterThanOrEqual(1);
      expect(result.candidates[0]).toMatchObject({
        itemId: expect.any(String),
        label: expect.any(String),
        score: expect.any(Number),
      });

      for (let i = 1; i < result.candidates.length; i++) {
        const prev = result.candidates[i - 1].score ?? 0;
        const curr = result.candidates[i].score ?? 0;
        expect(prev).toBeGreaterThanOrEqual(curr);
      }
    });

    it('返却候補に itemId, label, score が含まれること', async () => {
      const recognizer = new MockRecognizer();
      const result = await recognizer.recognize('file:///test.jpg');

      for (const candidate of result.candidates) {
        expect(candidate).toHaveProperty('itemId');
        expect(candidate).toHaveProperty('label');
        expect(candidate).toHaveProperty('score');
        expect(typeof candidate.itemId).toBe('string');
        expect(typeof candidate.label).toBe('string');
        expect(typeof candidate.score).toBe('number');
        expect(candidate.score).toBeGreaterThanOrEqual(0);
        expect(candidate.score).toBeLessThanOrEqual(1);
      }
    });
  });
});
