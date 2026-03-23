import type * as SQLite from 'expo-sqlite';
import { importDataset } from '@/lib/dataset/import';
import { ItemRepository } from '@/lib/repositories/item-repository';
import type { Item } from '@/schema/municipality-dataset-schema';
import type { MunicipalityDataset } from '@/schema/municipality-dataset-schema';
import { openTestDb } from '../../helpers/db';

function createItem(overrides?: Partial<Item>): Item {
  return {
    id: 'item_a',
    displayName: 'プラスチック',
    aliases: ['プラ'],
    keywords: ['ペットボトル', '容器'],
    ...overrides,
  };
}

describe('ItemRepository', () => {
  let expoDb: SQLite.SQLiteDatabase;
  let repository: ItemRepository;
  let db: Awaited<ReturnType<typeof openTestDb>>['db'];

  beforeEach(async () => {
    const opened = await openTestDb('item_repo');
    expoDb = opened.expoDb;
    db = opened.db;
    repository = new ItemRepository(db);
  });

  afterEach(async () => {
    await expoDb.closeAsync();
  });

  describe('save', () => {
    it('品目を保存できる', async () => {
      const item = createItem();
      await repository.save(item);

      const found = await repository.findById(item.id);
      expect(found).toEqual(item);
    });

    it('同じIDで上書き保存できる', async () => {
      await repository.save(createItem({ displayName: '旧表示名' }));
      await repository.save(createItem({ displayName: '新表示名', aliases: ['新エイリアス'] }));

      const found = await repository.findById('item_a');
      expect(found?.displayName).toBe('新表示名');
      expect(found?.aliases).toEqual(['新エイリアス']);
    });
  });

  describe('findById', () => {
    it('存在するIDで取得できる', async () => {
      const item = createItem({ id: 'item_x' });
      await repository.save(item);

      const found = await repository.findById('item_x');
      expect(found).toEqual(item);
    });

    it('存在しないIDでは null を返す', async () => {
      const found = await repository.findById('not-exists');
      expect(found).toBeNull();
    });
  });

  describe('findByDisplayName', () => {
    it('表示名で検索できる', async () => {
      await repository.save(createItem({ id: 'item_1', displayName: 'プラスチック' }));
      await repository.save(createItem({ id: 'item_2', displayName: 'プラスチック' }));
      await repository.save(createItem({ id: 'item_3', displayName: '紙類' }));

      const found = await repository.findByDisplayName('プラスチック');
      expect(found).toHaveLength(2);
      expect(found.map((i) => i.id)).toEqual(expect.arrayContaining(['item_1', 'item_2']));
    });

    it('一致しない表示名では空配列を返す', async () => {
      await repository.save(createItem());

      const found = await repository.findByDisplayName('存在しない品目');
      expect(found).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('全件取得できる', async () => {
      await repository.save(createItem({ id: 'item_a' }));
      await repository.save(createItem({ id: 'item_b', displayName: '紙類' }));

      const all = await repository.findAll();
      expect(all).toHaveLength(2);
      expect(all.map((i) => i.id)).toEqual(expect.arrayContaining(['item_a', 'item_b']));
    });

    it('0件の場合は空配列を返す', async () => {
      const all = await repository.findAll();
      expect(all).toEqual([]);
    });
  });

  describe('findByMunicipalityId', () => {
    const createDataset = (municipalityId: string, itemIds: string[]): MunicipalityDataset => ({
      municipality: {
        id: municipalityId,
        displayName: 'テスト市',
        version: '2025-01-01',
      },
      items: itemIds.map((id) => createItem({ id, displayName: `品目_${id}` })),
      rules: itemIds.map((id) => ({
        municipalityId,
        itemId: id,
        categoryName: '資源物',
        instructions: '出してください。',
      })),
    });

    it('指定自治体にルールが登録されている品目のみ取得できる', async () => {
      await importDataset(db, createDataset('city-a', ['item_1', 'item_2']));

      const found = await repository.findByMunicipalityId('city-a');
      expect(found).toHaveLength(2);
      expect(found.map((i) => i.id)).toEqual(expect.arrayContaining(['item_1', 'item_2']));
    });

    it('他自治体の品目は含まれない', async () => {
      await importDataset(db, createDataset('city-a', ['item_a']));
      await importDataset(db, createDataset('city-b', ['item_b', 'item_c']));

      const found = await repository.findByMunicipalityId('city-a');
      expect(found).toHaveLength(1);
      expect(found[0]?.id).toBe('item_a');
    });

    it('存在しない自治体IDでは空配列を返す', async () => {
      await importDataset(db, createDataset('city-x', ['item_1']));

      const found = await repository.findByMunicipalityId('no-such-city');
      expect(found).toEqual([]);
    });

    it('categoryName 指定時はそのカテゴリーの品目のみ取得できる', async () => {
      const municipalityId = 'city-filter';
      await importDataset(db, {
        municipality: {
          id: municipalityId,
          displayName: 'テスト市',
          version: '2025-01-01',
        },
        items: [
          createItem({ id: 'i1', displayName: '品目1' }),
          createItem({ id: 'i2', displayName: '品目2' }),
        ],
        rules: [
          {
            municipalityId,
            itemId: 'i1',
            categoryName: '燃やすごみ',
            instructions: '出してください。',
          },
          {
            municipalityId,
            itemId: 'i2',
            categoryName: '資源物',
            instructions: '出してください。',
          },
        ],
      });

      const found = await repository.findByMunicipalityId(municipalityId, {
        categoryName: '資源物',
      });
      expect(found).toHaveLength(1);
      expect(found[0]?.id).toBe('i2');
    });
  });
});
