import * as SQLite from 'expo-sqlite';
import { initDatabase } from '@/lib/db/schema';
import { importDataset } from '@/lib/dataset/import';
import type { MunicipalityDataset } from '@/schema/municipality-dataset-schema';

async function openTestDb(): Promise<SQLite.SQLiteDatabase> {
  const dbName = `dataset_import_test_${process.env.JEST_WORKER_ID ?? 0}_${Date.now()}`;
  return SQLite.openDatabaseAsync(dbName);
}

function getRowCount(db: SQLite.SQLiteDatabase, table: string): number {
  const rows = db.getAllSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM ${table}`
  );
  return rows[0]?.count ?? 0;
}

function createValidDataset(): MunicipalityDataset {
  return {
    municipality: {
      id: 'test-city',
      displayName: 'テスト市',
      version: '2025-01-01',
    },
    items: [
      {
        id: 'item_a',
        displayName: '品目A',
        aliases: ['エイリアスA'],
        keywords: ['キーワードA'],
      },
      {
        id: 'item_b',
        displayName: '品目B',
        aliases: [],
        keywords: ['キーワードB'],
      },
    ],
    rules: [
      {
        municipalityId: 'test-city',
        itemId: 'item_a',
        categoryName: '資源物',
        instructions: '洗って出してください。',
      },
      {
        municipalityId: 'test-city',
        itemId: 'item_b',
        categoryName: '燃やすごみ',
        instructions: '指定袋に入れて出してください。',
      },
    ],
  };
}

describe('importDataset', () => {
  describe('正常 import テスト', () => {
    it('データセットを正常に取り込み、各テーブルに正しく保存される', async () => {
      const db = await openTestDb();
      await initDatabase(db);

      const dataset = createValidDataset();
      await importDataset(db, dataset);

      expect(getRowCount(db, 'municipalities')).toBe(1);
      expect(getRowCount(db, 'items')).toBe(2);
      expect(getRowCount(db, 'disposal_rules')).toBe(2);

      const municipality = db.getAllSync<{ id: string; display_name: string; version: string }>(
        'SELECT id, display_name, version FROM municipalities'
      )[0];
      expect(municipality?.id).toBe('test-city');
      expect(municipality?.display_name).toBe('テスト市');
      expect(municipality?.version).toBe('2025-01-01');

      const items = db.getAllSync<{ id: string; display_name: string; aliases_json: string; keywords_json: string }>(
        'SELECT id, display_name, aliases_json, keywords_json FROM items ORDER BY id'
      );
      expect(items).toHaveLength(2);
      expect(items[0]?.id).toBe('item_a');
      expect(items[0]?.display_name).toBe('品目A');
      expect(JSON.parse(items[0]?.aliases_json ?? '[]')).toEqual(['エイリアスA']);
      expect(JSON.parse(items[0]?.keywords_json ?? '[]')).toEqual(['キーワードA']);

      const rules = db.getAllSync<{ municipality_id: string; item_id: string; category_name: string; instructions: string }>(
        'SELECT municipality_id, item_id, category_name, instructions FROM disposal_rules ORDER BY item_id'
      );
      expect(rules).toHaveLength(2);
      expect(rules[0]?.municipality_id).toBe('test-city');
      expect(rules[0]?.item_id).toBe('item_a');
      expect(rules[0]?.category_name).toBe('資源物');
      expect(rules[0]?.instructions).toBe('洗って出してください。');

      await db.closeAsync();
    });
  });

  describe('transaction rollback テスト', () => {
    it('取り込み中にエラーが発生した場合、全テーブルがロールバックされ変更が残らない', async () => {
      const db = await openTestDb();
      await initDatabase(db);

      // instructions が null の不正データ（NOT NULL 制約違反を意図）
      const invalidDataset = {
        ...createValidDataset(),
        rules: [
          {
            municipalityId: 'test-city',
            itemId: 'item_a',
            categoryName: '資源物',
            instructions: '通常のルール',
          },
          {
            municipalityId: 'test-city',
            itemId: 'item_b',
            categoryName: '燃やすごみ',
            instructions: null as unknown as string, // 制約違反を起こす
          },
        ],
      } as MunicipalityDataset;

      await expect(importDataset(db, invalidDataset)).rejects.toThrow();

      expect(getRowCount(db, 'municipalities')).toBe(0);
      expect(getRowCount(db, 'items')).toBe(0);
      expect(getRowCount(db, 'disposal_rules')).toBe(0);

      await db.closeAsync();
    });
  });

  describe('冪等性テスト', () => {
    it('同じデータセットを2回取り込んでも、重複せず同じレコード数になる', async () => {
      const db = await openTestDb();
      await initDatabase(db);

      const dataset = createValidDataset();

      await importDataset(db, dataset);
      const countAfterFirst = {
        municipalities: getRowCount(db, 'municipalities'),
        items: getRowCount(db, 'items'),
        disposal_rules: getRowCount(db, 'disposal_rules'),
      };

      await importDataset(db, dataset);
      const countAfterSecond = {
        municipalities: getRowCount(db, 'municipalities'),
        items: getRowCount(db, 'items'),
        disposal_rules: getRowCount(db, 'disposal_rules'),
      };

      expect(countAfterSecond.municipalities).toBe(countAfterFirst.municipalities);
      expect(countAfterSecond.items).toBe(countAfterFirst.items);
      expect(countAfterSecond.disposal_rules).toBe(countAfterFirst.disposal_rules);
      expect(countAfterFirst.municipalities).toBe(1);
      expect(countAfterFirst.items).toBe(2);
      expect(countAfterFirst.disposal_rules).toBe(2);

      await db.closeAsync();
    });
  });
});
