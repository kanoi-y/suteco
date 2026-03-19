import { GoogleGenAI, createPartFromBase64, createPartFromText } from '@google/genai';
import * as FileSystem from 'expo-file-system/legacy';
import type { ItemSearchService } from '@/lib/services/item-search-service';
import type { Recognizer, RecognitionResult } from './types';

const MODEL_ID = 'gemini-3.1-flash-lite-preview';

const RECOGNITION_PROMPT = `この画像に写っているごみ・廃棄物を、日本の分別品目として認識してください。
画像内に写っている品目を、分別品目名（例：ペットボトル、空き缶、瓶、食品トレー など）として特定し、信頼度スコア（0.0〜1.0）とともにJSON形式で返してください。

以下の形式のJSONのみを出力してください。他のテキストは含めないでください。
{
  "candidates": [
    { "label": "品目名", "score": 0.95 },
    { "label": "品目名2", "score": 0.8 }
  ]
}

信頼度の高い順に最大5件まで列挙してください。品目が判別できない場合は空の配列を返してください。`;

const RESPONSE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          score: { type: 'number' },
        },
        required: ['label'],
      },
    },
  },
  required: ['candidates'],
} as const;

function getMimeTypeFromUri(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  if (lower.endsWith('.heif')) return 'image/heif';
  return 'image/jpeg';
}

/**
 * Gemini API を利用した画像認識実装
 * 外部 API を呼び出し、認識結果を Candidate[] に変換して返す
 * ItemSearchService により、候補ラベルを実際の DB アイテムに紐づける
 */
export class ApiRecognizer implements Recognizer {
  constructor(private readonly itemSearchService: ItemSearchService) {}

  async recognize(imageUri: string, municipalityId: string): Promise<RecognitionResult> {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'EXPO_PUBLIC_GEMINI_API_KEY が設定されていません。.env.local に API キーを設置してください。',
      );
    }

    const base64Data = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const mimeType = getMimeTypeFromUri(imageUri);

    const ai = new GoogleGenAI({ apiKey });

    const imagePart = createPartFromBase64(base64Data, mimeType);
    const textPart = createPartFromText(RECOGNITION_PROMPT);

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: [imagePart, textPart],
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: RESPONSE_JSON_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) {
      return { candidates: [] };
    }

    const parsed = JSON.parse(text) as { candidates?: Array<{ label: string; score?: number }> };
    const rawCandidates = parsed.candidates ?? [];

    const searchResults = await Promise.all(
      rawCandidates.map(async (c) => {
        const hits = await this.itemSearchService.search({
          query: c.label,
          municipalityId,
          limit: 1,
        });
        const score =
          typeof c.score === 'number' ? Math.max(0, Math.min(1, c.score)) : undefined;
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
      .filter(
        (c, i, arr) => arr.findIndex((x) => x.itemId === c.itemId) === i
      );

    return { candidates };
  }
}
