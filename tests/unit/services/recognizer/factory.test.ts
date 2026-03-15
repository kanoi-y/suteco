import { createRecognizer, MockRecognizer } from '@/lib/services/recognizer';
import type { Recognizer } from '@/lib/services/recognizer';

describe('createRecognizer (factory)', () => {
  describe('factory の切替テスト', () => {
    it("type が 'mock' のとき MockRecognizer インスタンスを返すこと", () => {
      const recognizer = createRecognizer('mock');
      expect(recognizer).toBeInstanceOf(MockRecognizer);
      expect(recognizer).toHaveProperty('recognize');
    });

    it("type が 'api' のとき Recognizer インスタンスを返すこと", () => {
      const recognizer = createRecognizer('api');
      expect(recognizer).toHaveProperty('recognize');
      expect(typeof recognizer.recognize).toBe('function');
    });

    it("type が 'local' のとき Recognizer インスタンスを返すこと", () => {
      const recognizer = createRecognizer('local');
      expect(recognizer).toHaveProperty('recognize');
      expect(typeof recognizer.recognize).toBe('function');
    });

    it('返却された Recognizer の recognize が呼び出し可能であること', async () => {
      const recognizer = createRecognizer('mock');
      const result = await recognizer.recognize('file:///test.jpg');
      expect(result).toHaveProperty('candidates');
    });
  });
});
