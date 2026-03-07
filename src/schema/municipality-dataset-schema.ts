import { z } from 'zod';

/** 自治体スキーマ */
export const municipalitySchema = z.object({
  id: z.string(),
  displayName: z.string(),
  version: z.string(),
});

/** ごみ品目スキーマ */
export const itemSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  aliases: z.array(z.string()),
  keywords: z.array(z.string()),
});

/** 分別ルールスキーマ */
export const ruleSchema = z.object({
  municipalityId: z.string(),
  itemId: z.string(),
  categoryName: z.string(),
  instructions: z.string(),
  notes: z.string().optional(),
  officialUrl: z.string().optional(),
});

/** データセットファイルのルートスキーマ */
const datasetFileSchema = z
  .object({
    municipality: municipalitySchema,
    items: z.array(itemSchema),
    rules: z.array(ruleSchema),
  })
  .superRefine((data, ctx) => {
    const itemIds = new Set<string>();
    for (let i = 0; i < data.items.length; i++) {
      const id = data.items[i].id;
      if (itemIds.has(id)) {
        ctx.addIssue({
          code: 'custom',
          message: `items.id が重複しています: ${id}`,
          path: ['items', i, 'id'],
        });
      }
      itemIds.add(id);
    }

    const validItemIds = new Set(data.items.map((item) => item.id));
    for (let i = 0; i < data.rules.length; i++) {
      const itemId = data.rules[i].itemId;
      if (!validItemIds.has(itemId)) {
        ctx.addIssue({
          code: 'custom',
          message: `rules.itemId が items.id に存在しません: ${itemId}`,
          path: ['rules', i, 'itemId'],
        });
      }
    }
  });

/** 自治体データセットスキーマ（エクスポート用） */
export const municipalityDatasetSchema = datasetFileSchema;

/** スキーマから生成した型 */
export type Municipality = z.infer<typeof municipalitySchema>;
export type Item = z.infer<typeof itemSchema>;
export type DisposalRule = z.infer<typeof ruleSchema>;
export type MunicipalityDataset = z.infer<typeof municipalityDatasetSchema>;
