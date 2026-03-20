import type { Item } from '@/schema/municipality-dataset-schema';
import {
  ApiRecognizer,
  appendMunicipalityDisplayNamesToPrompt,
} from '@/lib/services/recognizer/api-recognizer';

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
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ candidates: [] }),
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('findByMunicipalityId で取得した品目名が /api/recognize のリクエスト body の prompt に含まれる', async () => {
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
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/recognize',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const call = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(call[1].body as string) as {
      prompt: string;
      imageBase64: string;
      mimeType: string;
    };
    expect(body.imageBase64).toBe('fakebase64');
    expect(body.mimeType).toBe('image/jpeg');
    expect(body.prompt).toContain('ペットボトル');
    expect(body.prompt).toContain('空き缶');
    expect(body.prompt).toContain('この自治体で分別対象となる品目名の一覧');
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

    const call = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(call[1].body as string) as { prompt: string };
    expect(body.prompt).not.toContain('この自治体で分別対象となる品目名の一覧');
    expect(body.prompt).toContain('JSONのみを出力');
  });

  it('同一 itemId の候補は重複除去される', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
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

  it('曖昧ラベルが複数品目にマッチした場合は候補を複数返す', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ label: '缶', score: 0.8 }],
      }),
    });

    const itemRepository = {
      findByMunicipalityId: jest.fn().mockResolvedValue([]),
    };
    const itemSearchService = {
      search: jest.fn().mockResolvedValue([
        {
          itemId: 'item-can-steel',
          displayName: '空き缶',
          matchedBy: 'display_name_partial' as const,
        },
        {
          itemId: 'item-can-spray',
          displayName: 'スプレー缶',
          matchedBy: 'display_name_partial' as const,
        },
      ]),
    };

    const recognizer = new ApiRecognizer(itemSearchService, itemRepository);
    const result = await recognizer.recognize('file:///x.jpg', 'city');

    expect(itemSearchService.search).toHaveBeenCalledWith({
      query: '缶',
      municipalityId: 'city',
    });
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates.map((c) => c.itemId)).toEqual(['item-can-steel', 'item-can-spray']);
  });
});
