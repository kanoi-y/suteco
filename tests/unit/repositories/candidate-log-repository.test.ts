import type * as SQLite from 'expo-sqlite';
import { CandidateLogRepository } from '@/lib/repositories/candidate-log-repository';
import type { CandidateLog } from '@/types/candidate-log';
import { openTestDb } from '../../helpers/db';

function createCandidateLog(
  overrides?: Partial<Omit<CandidateLog, 'id'>>
): Omit<CandidateLog, 'id'> {
  return {
    imageUri: 'file:///path/to/image.jpg',
    candidates: [
      { itemId: 'item_a', label: 'プラスチック', score: 0.9 },
      { itemId: 'item_b', label: '紙類', score: 0.7 },
    ],
    selectedItemId: 'item_a',
    createdAt: '2025-01-15T10:00:00.000Z',
    ...overrides,
  };
}

describe('CandidateLogRepository', () => {
  let expoDb: SQLite.SQLiteDatabase;
  let repository: CandidateLogRepository;

  beforeEach(async () => {
    const { expoDb: db, db: drizzleDb } = await openTestDb('candidate_log_repo');
    expoDb = db;
    repository = new CandidateLogRepository(drizzleDb);
  });

  afterEach(async () => {
    await expoDb.closeAsync();
  });

  describe('save', () => {
    it('ログを保存し、ID付きで返す', async () => {
      const logInput = createCandidateLog();
      const saved = await repository.save(logInput);

      expect(saved.id).toBeGreaterThan(0);
      expect(saved.imageUri).toBe(logInput.imageUri);
      expect(saved.candidates).toEqual(logInput.candidates);
      expect(saved.selectedItemId).toBe(logInput.selectedItemId);
      expect(saved.createdAt).toBe(logInput.createdAt);
    });

    it('保存したログを findById で取得できる', async () => {
      const logInput = createCandidateLog();
      const saved = await repository.save(logInput);

      const found = await repository.findById(saved.id);
      expect(found).toEqual(saved);
    });

    it('selectedItemId が null でも保存できる', async () => {
      const logInput = createCandidateLog({ selectedItemId: null });
      const saved = await repository.save(logInput);

      expect(saved.selectedItemId).toBeNull();
    });
  });

  describe('findById', () => {
    it('存在するIDで取得できる', async () => {
      const logInput = createCandidateLog();
      const saved = await repository.save(logInput);

      const found = await repository.findById(saved.id);
      expect(found).toEqual(saved);
    });

    it('存在しないIDでは null を返す', async () => {
      const found = await repository.findById(99999);
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('全件取得できる', async () => {
      await repository.save(createCandidateLog({ imageUri: 'uri1' }));
      await repository.save(createCandidateLog({ imageUri: 'uri2' }));

      const all = await repository.findAll();
      expect(all).toHaveLength(2);
    });

    it('limit を指定すると件数が制限される', async () => {
      await repository.save(createCandidateLog());
      await repository.save(createCandidateLog({ imageUri: 'uri2' }));
      await repository.save(createCandidateLog({ imageUri: 'uri3' }));

      const limited = await repository.findAll(2);
      expect(limited).toHaveLength(2);
    });

    it('offset を指定するとスキップされる', async () => {
      await repository.save(createCandidateLog({ imageUri: 'uri1' }));
      await repository.save(createCandidateLog({ imageUri: 'uri2' }));
      const newest = await repository.save(createCandidateLog({ imageUri: 'uri3' }));

      const offset = await repository.findAll(10, 1);
      expect(offset).toHaveLength(2);
      expect(offset.some((l) => l.id === newest.id)).toBe(false);
    });

    it('id の降順でソートされてページネーション境界が安定する', async () => {
      await repository.save(createCandidateLog({ imageUri: 'a' }));
      await repository.save(createCandidateLog({ imageUri: 'b' }));
      await repository.save(createCandidateLog({ imageUri: 'c' }));

      const all = await repository.findAll();
      expect(all[0].imageUri).toBe('c');
      expect(all[1].imageUri).toBe('b');
      expect(all[2].imageUri).toBe('a');

      const firstPage = await repository.findAll(2, 0);
      expect(firstPage).toHaveLength(2);
      expect(firstPage[0].imageUri).toBe('c');
      expect(firstPage[1].imageUri).toBe('b');

      const secondPage = await repository.findAll(2, 2);
      expect(secondPage).toHaveLength(1);
      expect(secondPage[0].imageUri).toBe('a');
    });

    it('0件の場合は空配列を返す', async () => {
      const all = await repository.findAll();
      expect(all).toEqual([]);
    });
  });
});
