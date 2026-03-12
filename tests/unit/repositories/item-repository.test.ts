import type * as SQLite from 'expo-sqlite';
import { ItemRepository } from '@/lib/repositories/item-repository';
import type { Item } from '@/schema/municipality-dataset-schema';
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

  beforeEach(async () => {
    const { expoDb: db, db: drizzleDb } = await openTestDb('item_repo');
    expoDb = db;
    repository = new ItemRepository(drizzleDb);
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
});
