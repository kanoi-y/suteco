import { GoogleGenAI, createPartFromBase64, createPartFromText } from '@google/genai';
import { z } from 'zod';

const MODEL_ID = 'gemini-3.1-flash-lite-preview';

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

const requestBodySchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.string().min(1),
  prompt: z.string().min(1),
});

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          'GEMINI_API_KEY が設定されていません。サーバー側の環境変数に API キーを設定してください。',
      },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = requestBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { imageBase64, mimeType, prompt } = parsed.data;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const imagePart = createPartFromBase64(imageBase64, mimeType);
    const textPart = createPartFromText(prompt);

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
      return Response.json({ candidates: [] });
    }

    const json = JSON.parse(text) as { candidates?: Array<{ label: string; score?: number }> };
    return Response.json({ candidates: json.candidates ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gemini request failed';
    return Response.json({ error: message }, { status: 502 });
  }
}
