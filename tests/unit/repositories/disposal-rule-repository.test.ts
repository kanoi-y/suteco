import type * as SQLite from 'expo-sqlite';
import { DisposalRuleRepository } from '@/lib/repositories/disposal-rule-repository';
import type { DisposalRule } from '@/schema/municipality-dataset-schema';
import { openTestDb } from '../../helpers/db';

function createDisposalRule(overrides?: Partial<DisposalRule>): DisposalRule {
  return {
    municipalityId: 'test-city',
    itemId: 'item_a',
    categoryName: '資源物',
    instructions: '洗って出してください。',
    notes: undefined,
    officialUrl: undefined,
    ...overrides,
  };
}

describe('DisposalRuleRepository', () => {
  let expoDb: SQLite.SQLiteDatabase;
  let repository: DisposalRuleRepository;

  beforeEach(async () => {
    const { expoDb: db, db: drizzleDb } = await openTestDb('disposal_rule_repo');
    expoDb = db;
    repository = new DisposalRuleRepository(drizzleDb);
  });

  afterEach(async () => {
    await expoDb.closeAsync();
  });

  describe('save', () => {
    it('分別ルールを保存できる', async () => {
      const rule = createDisposalRule();
      await repository.save(rule);

      const found = await repository.findByMunicipalityAndItem(rule.municipalityId, rule.itemId);
      expect(found).toEqual(rule);
    });

    it('同じ自治体ID・品目IDで上書き保存できる', async () => {
      await repository.save(
        createDisposalRule({ categoryName: '燃やすごみ', instructions: '旧ルール' })
      );
      await repository.save(
        createDisposalRule({ categoryName: '資源物', instructions: '新ルール' })
      );

      const found = await repository.findByMunicipalityAndItem('test-city', 'item_a');
      expect(found?.categoryName).toBe('資源物');
      expect(found?.instructions).toBe('新ルール');
    });

    it('notes と officialUrl を保存できる', async () => {
      const rule = createDisposalRule({
        notes: '補足情報',
        officialUrl: 'https://example.com/rule',
      });
      await repository.save(rule);

      const found = await repository.findByMunicipalityAndItem('test-city', 'item_a');
      expect(found?.notes).toBe('補足情報');
      expect(found?.officialUrl).toBe('https://example.com/rule');
    });
  });

  describe('findByMunicipalityAndItem', () => {
    it('該当レコードを取得できる', async () => {
      const rule = createDisposalRule({
        municipalityId: 'city-x',
        itemId: 'item-y',
      });
      await repository.save(rule);

      const found = await repository.findByMunicipalityAndItem('city-x', 'item-y');
      expect(found).toEqual(rule);
    });

    it('存在しない組み合わせでは null を返す', async () => {
      const found = await repository.findByMunicipalityAndItem('no-city', 'no-item');
      expect(found).toBeNull();
    });
  });

  describe('findByMunicipalityId', () => {
    it('自治体IDで該当ルールを全て取得できる', async () => {
      await repository.save(createDisposalRule({ itemId: 'item_a', categoryName: '資源物' }));
      await repository.save(createDisposalRule({ itemId: 'item_b', categoryName: '燃やすごみ' }));
      await repository.save(
        createDisposalRule({
          municipalityId: 'other-city',
          itemId: 'item_a',
          categoryName: '他市のルール',
        })
      );

      const found = await repository.findByMunicipalityId('test-city');
      expect(found).toHaveLength(2);
      expect(found.map((r) => r.itemId)).toEqual(expect.arrayContaining(['item_a', 'item_b']));
    });

    it('存在しない自治体IDでは空配列を返す', async () => {
      const found = await repository.findByMunicipalityId('no-city');
      expect(found).toEqual([]);
    });
  });
});
