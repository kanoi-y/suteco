import type { SQLiteDatabase } from 'expo-sqlite';
import { municipalityDatasetSchema } from '@/schema/municipality-dataset-schema';
import type { MunicipalityDataset } from '@/schema/municipality-dataset-schema';

/**
 * 自治体データセットを DB に取り込む。
 * トランザクションでラップし、エラー時はロールバックする。
 * 冪等: 同じデータを複数回実行しても重複せず同じ状態になる。
 *
 * @param db - SQLite データベース
 * @param dataset - 取り込むデータセット（Zod でバリデーションする）
 */
export async function importDataset(
  db: SQLiteDatabase,
  dataset: MunicipalityDataset
): Promise<void> {
  const parsed = municipalityDatasetSchema.parse(dataset);

  await db.execAsync('BEGIN TRANSACTION;');

  try {
    await db.runAsync(
      `INSERT OR REPLACE INTO municipalities (id, display_name, version)
       VALUES ($id, $displayName, $version)`,
      {
        $id: parsed.municipality.id,
        $displayName: parsed.municipality.displayName,
        $version: parsed.municipality.version,
      }
    );

    for (const item of parsed.items) {
      await db.runAsync(
        `INSERT OR REPLACE INTO items (id, display_name, aliases_json, keywords_json)
         VALUES ($id, $displayName, $aliasesJson, $keywordsJson)`,
        {
          $id: item.id,
          $displayName: item.displayName,
          $aliasesJson: JSON.stringify(item.aliases),
          $keywordsJson: JSON.stringify(item.keywords),
        }
      );
    }

    for (const rule of parsed.rules) {
      await db.runAsync(
        `INSERT OR REPLACE INTO disposal_rules
         (municipality_id, item_id, category_name, instructions, notes, official_url)
         VALUES ($municipalityId, $itemId, $categoryName, $instructions, $notes, $officialUrl)`,
        {
          $municipalityId: rule.municipalityId,
          $itemId: rule.itemId,
          $categoryName: rule.categoryName,
          $instructions: rule.instructions,
          $notes: rule.notes ?? null,
          $officialUrl: rule.officialUrl ?? null,
        }
      );
    }

    await db.execAsync('COMMIT;');
  } catch (err) {
    await db.execAsync('ROLLBACK;');
    throw err;
  }
}
