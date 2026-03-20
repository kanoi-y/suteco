import { createPartFromText, GoogleGenAI } from '@google/genai';
import type { Item } from '@/schema/municipality-dataset-schema';
import {
  ApiRecognizer,
  appendMunicipalityDisplayNamesToPrompt,
} from '@/lib/services/recognizer/api-recognizer';

const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn(),
  createPartFromBase64: jest.fn(() => ({ inlineData: { data: '', mimeType: 'image/jpeg' } })),
  createPartFromText: jest.fn((text: string) => ({ text })),
}));

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn().mockResolvedValue('fakebase64'),
  EncodingType: { Base64: 'base64' },
}));

describe('appendMunicipalityDisplayNamesToPrompt', () => {
  it('品目名が空のときはベースプロンプトのみ返す', () => {
    expect(appendMunicipalityDisplayNamesToPrompt('ベース', [])).toBe('ベース');
  });

  it('品目名を重複除去し、日本語ロケールでソートして付与する', () => {
    const result = appendMunicipalityDisplayNamesToPrompt('ベース', ['ゾ', 'ア', 'ア']);
    expect(result.startsWith('ベース')).toBe(true);
    expect(result).toContain('この自治体で分別対象となる品目名の一覧');
    expect(result.endsWith('ア\nゾ')).toBe(true);
  });
});

describe('ApiRecognizer', () => {
  const originalKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'test-key';
    jest.clearAllMocks();
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({ candidates: [] }),
    });
    (GoogleGenAI as jest.Mock).mockImplementation(() => ({
      models: { generateContent: mockGenerateContent },
    }));
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_GEMINI_API_KEY = originalKey;
  });

  it('findByMunicipalityId で取得した品目名が generateContent 用テキストに含まれる', async () => {
    const items: Item[] = [
      { id: '1', displayName: 'ペットボトル', aliases: [], keywords: [] },
      { id: '2', displayName: '空き缶', aliases: [], keywords: [] },
    ];
    const itemRepository = {
      findByMunicipalityId: jest.fn().mockResolvedValue(items),
    };
    const itemSearchService = {
      search: jest.fn().mockResolvedValue([]),
    };

    const recognizer = new ApiRecognizer(itemSearchService, itemRepository);
    await recognizer.recognize('file:///x.jpg', 'muni-1');

    expect(itemRepository.findByMunicipalityId).toHaveBeenCalledWith('muni-1');
    expect(createPartFromText).toHaveBeenCalled();
    const promptArg = (createPartFromText as jest.Mock).mock.calls[0][0] as string;
    expect(promptArg).toContain('ペットボトル');
    expect(promptArg).toContain('空き缶');
    expect(promptArg).toContain('この自治体で分別対象となる品目名の一覧');
  });

  it('品目が0件のときは自治体コンテキスト節を付けない', async () => {
    const itemRepository = {
      findByMunicipalityId: jest.fn().mockResolvedValue([]),
    };
    const itemSearchService = {
      search: jest.fn().mockResolvedValue([]),
    };

    const recognizer = new ApiRecognizer(itemSearchService, itemRepository);
    await recognizer.recognize('file:///x.jpg', 'muni-1');

    const promptArg = (createPartFromText as jest.Mock).mock.calls[0][0] as string;
    expect(promptArg).not.toContain('この自治体で分別対象となる品目名の一覧');
    expect(promptArg).toContain('JSONのみを出力');
  });

  it('同一 itemId の候補は重複除去される', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        candidates: [
          { label: 'ペットボトル', score: 0.9 },
          { label: 'ペットボトル', score: 0.7 },
        ],
      }),
    });

    const item: Item = {
      id: 'item-pet',
      displayName: 'ペットボトル',
      aliases: [],
      keywords: [],
    };
    const itemRepository = {
      findByMunicipalityId: jest.fn().mockResolvedValue([item]),
    };
    const hit = {
      itemId: 'item-pet',
      displayName: 'ペットボトル',
      matchedBy: 'display_name_exact' as const,
    };
    const itemSearchService = {
      search: jest.fn().mockResolvedValue([hit]),
    };

    const recognizer = new ApiRecognizer(itemSearchService, itemRepository);
    const result = await recognizer.recognize('file:///x.jpg', 'city');

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]?.itemId).toBe('item-pet');
  });
});
