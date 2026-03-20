import type { ItemRepositoryLike, ItemSearchService } from '@/lib/services/item-search-service';
import * as FileSystem from 'expo-file-system/legacy';
import type { RecognitionResult, Recognizer } from './types';

const RECOGNITION_PROMPT = `この画像に写っているごみ・廃棄物を、日本の分別品目として認識してください。
画像内に写っている品目を、分別品目名（例：ペットボトル、空き缶、瓶、食品トレー など）として特定し、信頼度スコア（0.0〜1.0）とともにJSON形式で返してください。

以下の形式のJSONのみを出力してください。他のテキストは含めないでください。
{
  "candidates": [
    { "label": "品目名", "score": 0.95 },
    { "label": "品目名2", "score": 0.8 }
  ]
}

信頼度の高い順に最大10件まで列挙してください。品目が判別できない場合は空の配列を返してください。`;

const MUNICIPALITY_CONTEXT_HEADER =
  'この自治体で分別対象となる品目名の一覧です。返す candidates の各 label は、できるだけこの一覧のいずれかと一致する名前にしてください。一覧にない品目でも画像から明らかな場合は、一般名で返して構いません。';

/**
 * 品目名一覧を認識プロンプトに付与する（テスト用に export）
 */
export function appendMunicipalityDisplayNamesToPrompt(
  basePrompt: string,
  displayNames: string[]
): string {
  if (displayNames.length === 0) {
    return basePrompt;
  }
  const uniqueSorted = [...new Set(displayNames)].sort((a, b) => a.localeCompare(b, 'ja'));
  const list = uniqueSorted.join('\n');
  return `${basePrompt}

${MUNICIPALITY_CONTEXT_HEADER}
${list}`;
}

function getMimeTypeFromUri(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  if (lower.endsWith('.heif')) return 'image/heif';
  return 'image/jpeg';
}

/**
 * EAS Hosting / Expo Router の API Route 経由で Gemini を呼ぶ画像認識実装。
 * API キーはサーバー側（GEMINI_API_KEY）のみに保持し、クライアントバンドルに含めない。
 * ItemSearchService により、候補ラベルを実際の DB アイテムに紐づける。
 */
export class ApiRecognizer implements Recognizer {
  constructor(
    private readonly itemSearchService: ItemSearchService,
    private readonly itemRepository: ItemRepositoryLike
  ) {}

  async recognize(imageUri: string, municipalityId: string): Promise<RecognitionResult> {
    const base64Data = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const mimeType = getMimeTypeFromUri(imageUri);

    const municipalItems = await this.itemRepository.findByMunicipalityId(municipalityId);
    const displayNames = municipalItems.map((item) => item.displayName);
    const fullPrompt = appendMunicipalityDisplayNamesToPrompt(RECOGNITION_PROMPT, displayNames);

    const response = await fetch('/api/recognize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64Data,
        mimeType,
        prompt: fullPrompt,
      }),
    });

    const payload = (await response.json()) as {
      candidates?: Array<{ label: string; score?: number }>;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(payload.error ?? `認識 API が失敗しました（${response.status}）`);
    }

    const rawCandidates = payload.candidates ?? [];

    const searchResults = await Promise.all(
      rawCandidates.map(async (c) => {
        const hits = await this.itemSearchService.search({
          query: c.label,
          municipalityId,
        });
        const score = typeof c.score === 'number' ? Math.max(0, Math.min(1, c.score)) : undefined;
        return { hits, score };
      })
    );

    const candidates = searchResults
      .flatMap(({ hits, score }) =>
        hits.map((hit) => ({
          itemId: hit.itemId,
          label: hit.displayName,
          score,
        }))
      )
      .filter((c, i, arr) => arr.findIndex((x) => x.itemId === c.itemId) === i);

    return { candidates };
  }
}
