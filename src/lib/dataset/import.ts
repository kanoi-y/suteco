import type { Db } from '@/lib/db/client';
import { disposalRules, items, municipalities } from '@/lib/db/schema';
import { municipalityDatasetSchema } from '@/schema/municipality-dataset-schema';
import type { MunicipalityDataset } from '@/schema/municipality-dataset-schema';
import { and, eq, notInArray, sql } from 'drizzle-orm';

/**
 * 自治体データセットを DB に取り込む。
 * トランザクションでラップし、エラー時はロールバックする。
 * 冪等: 同じデータを複数回実行しても重複せず同じ状態になる。
 *
 * @param db - Drizzle DB インスタンス
 * @param dataset - 取り込むデータセット（Zod でバリデーションする）
 */
export async function importDataset(db: Db, dataset: MunicipalityDataset): Promise<void> {
  const parsed = municipalityDatasetSchema.parse(dataset);

  await db.transaction(async (tx) => {
    await tx
      .insert(municipalities)
      .values({
        id: parsed.municipality.id,
        displayName: parsed.municipality.displayName,
        version: parsed.municipality.version,
      })
      .onConflictDoUpdate({
        target: municipalities.id,
        set: {
          displayName: parsed.municipality.displayName,
          version: parsed.municipality.version,
        },
      });

    for (const item of parsed.items) {
      await tx
        .insert(items)
        .values({
          id: item.id,
          displayName: item.displayName,
          aliasesJson: JSON.stringify(item.aliases),
          keywordsJson: JSON.stringify(item.keywords),
        })
        .onConflictDoUpdate({
          target: items.id,
          set: {
            displayName: item.displayName,
            aliasesJson: JSON.stringify(item.aliases),
            keywordsJson: JSON.stringify(item.keywords),
          },
        });
    }

    for (const rule of parsed.rules) {
      await tx
        .insert(disposalRules)
        .values({
          municipalityId: rule.municipalityId,
          itemId: rule.itemId,
          categoryName: rule.categoryName,
          instructions: rule.instructions,
          notes: rule.notes ?? null,
          officialUrl: rule.officialUrl ?? null,
        })
        .onConflictDoUpdate({
          target: [disposalRules.municipalityId, disposalRules.itemId],
          set: {
            categoryName: rule.categoryName,
            instructions: rule.instructions,
            notes: rule.notes ?? null,
            officialUrl: rule.officialUrl ?? null,
          },
        });
    }

    const newItemIds = parsed.rules.map((r) => r.itemId);
    if (newItemIds.length > 0) {
      await tx
        .delete(disposalRules)
        .where(
          and(
            eq(disposalRules.municipalityId, parsed.municipality.id),
            notInArray(disposalRules.itemId, newItemIds)
          )
        );
    } else {
      await tx
        .delete(disposalRules)
        .where(eq(disposalRules.municipalityId, parsed.municipality.id));
    }

    await tx
      .delete(items)
      .where(sql`${items.id} NOT IN (SELECT ${disposalRules.itemId} FROM ${disposalRules})`);
  });
}

/**
 * 同梱データセットから削除された自治体と、それに紐づくルール・孤立品目を削除する。
 * 起動時の初期化で、defaultDatasets に含まれない自治体を DB から取り除くために使用する。
 *
 * @param db - Drizzle DB インスタンス
 * @param validIds - 有効な（同梱に含まれる）自治体 ID のリスト
 */
export async function pruneUnbundledMunicipalities(db: Db, validIds: string[]): Promise<void> {
  await db.transaction(async (tx) => {
    if (validIds.length === 0) {
      await tx.delete(disposalRules);
      await tx.delete(municipalities);
      await tx.delete(items);
      return;
    }

    await tx.delete(disposalRules).where(notInArray(disposalRules.municipalityId, validIds));

    await tx.delete(municipalities).where(notInArray(municipalities.id, validIds));

    await tx
      .delete(items)
      .where(sql`${items.id} NOT IN (SELECT ${disposalRules.itemId} FROM ${disposalRules})`);
  });
}
