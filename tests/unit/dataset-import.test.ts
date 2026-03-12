import { importDataset } from '@/lib/dataset/import';
import type { MunicipalityDataset } from '@/schema/municipality-dataset-schema';
import { openTestDb } from '../helpers/db';

function getRowCount(
  expoDb: { getAllSync: (sql: string) => { count: number }[] },
  table: string
): number {
  const rows = expoDb.getAllSync(`SELECT COUNT(*) as count FROM ${table}`);
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
      const { expoDb, db } = await openTestDb('dataset_import_ok');

      const dataset = createValidDataset();
      await importDataset(db, dataset);

      expect(getRowCount(expoDb, 'municipalities')).toBe(1);
      expect(getRowCount(expoDb, 'items')).toBe(2);
      expect(getRowCount(expoDb, 'disposal_rules')).toBe(2);

      const municipality = expoDb.getAllSync<{
        id: string;
        display_name: string;
        version: string;
      }>('SELECT id, display_name, version FROM municipalities')[0];
      expect(municipality?.id).toBe('test-city');
      expect(municipality?.display_name).toBe('テスト市');
      expect(municipality?.version).toBe('2025-01-01');

      const items = expoDb.getAllSync<{
        id: string;
        display_name: string;
        aliases_json: string;
        keywords_json: string;
      }>('SELECT id, display_name, aliases_json, keywords_json FROM items ORDER BY id');
      expect(items).toHaveLength(2);
      expect(items[0]?.id).toBe('item_a');
      expect(items[0]?.display_name).toBe('品目A');
      expect(JSON.parse(items[0]?.aliases_json ?? '[]')).toEqual(['エイリアスA']);
      expect(JSON.parse(items[0]?.keywords_json ?? '[]')).toEqual(['キーワードA']);

      const rules = expoDb.getAllSync<{
        municipality_id: string;
        item_id: string;
        category_name: string;
        instructions: string;
      }>(
        'SELECT municipality_id, item_id, category_name, instructions FROM disposal_rules ORDER BY item_id'
      );
      expect(rules).toHaveLength(2);
      expect(rules[0]?.municipality_id).toBe('test-city');
      expect(rules[0]?.item_id).toBe('item_a');
      expect(rules[0]?.category_name).toBe('資源物');
      expect(rules[0]?.instructions).toBe('洗って出してください。');

      await expoDb.closeAsync();
    });
  });

  describe('transaction rollback テスト', () => {
    it('取り込み中にエラーが発生した場合、全テーブルがロールバックされ変更が残らない', async () => {
      const { expoDb, db } = await openTestDb('dataset_import_rollback');

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
            instructions: null as unknown as string,
          },
        ],
      } as MunicipalityDataset;

      await expect(importDataset(db, invalidDataset)).rejects.toThrow();

      expect(getRowCount(expoDb, 'municipalities')).toBe(0);
      expect(getRowCount(expoDb, 'items')).toBe(0);
      expect(getRowCount(expoDb, 'disposal_rules')).toBe(0);

      await expoDb.closeAsync();
    });
  });

  describe('冪等性テスト', () => {
    it('同じデータセットを2回取り込んでも、重複せず同じレコード数になる', async () => {
      const { expoDb, db } = await openTestDb('dataset_import_idempotent');

      const dataset = createValidDataset();

      await importDataset(db, dataset);
      const countAfterFirst = {
        municipalities: getRowCount(expoDb, 'municipalities'),
        items: getRowCount(expoDb, 'items'),
        disposal_rules: getRowCount(expoDb, 'disposal_rules'),
      };

      await importDataset(db, dataset);
      const countAfterSecond = {
        municipalities: getRowCount(expoDb, 'municipalities'),
        items: getRowCount(expoDb, 'items'),
        disposal_rules: getRowCount(expoDb, 'disposal_rules'),
      };

      expect(countAfterSecond.municipalities).toBe(countAfterFirst.municipalities);
      expect(countAfterSecond.items).toBe(countAfterFirst.items);
      expect(countAfterSecond.disposal_rules).toBe(countAfterFirst.disposal_rules);
      expect(countAfterFirst.municipalities).toBe(1);
      expect(countAfterFirst.items).toBe(2);
      expect(countAfterFirst.disposal_rules).toBe(2);

      await expoDb.closeAsync();
    });
  });

  describe('古いレコード削除テスト（バージョンアップ時）', () => {
    it('新しいバージョンのデータセット取り込み時に、削除された分別ルールと孤立した品目がDBから除去される', async () => {
      const { expoDb, db } = await openTestDb('dataset_import_stale_removal');

      const datasetV1 = createValidDataset();
      await importDataset(db, datasetV1);

      expect(getRowCount(expoDb, 'disposal_rules')).toBe(2);
      expect(getRowCount(expoDb, 'items')).toBe(2);

      const datasetV2: MunicipalityDataset = {
        municipality: {
          id: 'test-city',
          displayName: 'テスト市',
          version: '2025-02-01',
        },
        items: [
          {
            id: 'item_a',
            displayName: '品目A（更新）',
            aliases: ['エイリアスA'],
            keywords: ['キーワードA'],
          },
        ],
        rules: [
          {
            municipalityId: 'test-city',
            itemId: 'item_a',
            categoryName: '資源物',
            instructions: '洗って出してください。',
          },
        ],
      };
      await importDataset(db, datasetV2);

      expect(getRowCount(expoDb, 'disposal_rules')).toBe(1);
      expect(getRowCount(expoDb, 'items')).toBe(1);

      const rules = expoDb.getAllSync<{ item_id: string }>(
        'SELECT item_id FROM disposal_rules ORDER BY item_id'
      );
      expect(rules).toHaveLength(1);
      expect(rules[0]?.item_id).toBe('item_a');

      const items = expoDb.getAllSync<{ id: string }>('SELECT id FROM items ORDER BY id');
      expect(items).toHaveLength(1);
      expect(items[0]?.id).toBe('item_a');

      await expoDb.closeAsync();
    });
  });
});
