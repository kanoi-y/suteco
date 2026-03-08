import * as SQLite from 'expo-sqlite';
import { initDatabase } from '@/lib/db/schema';

const REQUIRED_TABLES = [
  'municipalities',
  'items',
  'disposal_rules',
  'candidate_logs',
] as const;

const REQUIRED_INDEXES = [
  'idx_disposal_rules_municipality_item',
  'idx_items_display_name',
] as const;

async function openTestDb(): Promise<SQLite.SQLiteDatabase> {
  const dbName = `db_schema_test_${process.env.JEST_WORKER_ID ?? 0}_${Date.now()}`;
  return SQLite.openDatabaseAsync(dbName);
}

function getTableNames(db: SQLite.SQLiteDatabase): string[] {
  const rows = db.getAllSync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
  );
  return rows.map((r) => r.name);
}

function getIndexNames(db: SQLite.SQLiteDatabase): string[] {
  const rows = db.getAllSync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'",
  );
  return rows.map((r) => r.name);
}

describe('initDatabase', () => {
  describe('tables 作成テスト', () => {
    it('必要な4テーブルが作成される', async () => {
      const db = await openTestDb();
      await initDatabase(db);

      const tableNames = getTableNames(db);
      for (const table of REQUIRED_TABLES) {
        expect(tableNames).toContain(table);
      }

      await db.closeAsync();
    });
  });

  describe('index 作成テスト', () => {
    it('必要な2インデックスが作成される', async () => {
      const db = await openTestDb();
      await initDatabase(db);

      const indexNames = getIndexNames(db);
      for (const index of REQUIRED_INDEXES) {
        expect(indexNames).toContain(index);
      }

      await db.closeAsync();
    });
  });

  describe('初期化後に再実行しても壊れないテスト', () => {
    it('initDatabase を2回実行してもエラーにならず、テーブル数は変わらない', async () => {
      const db = await openTestDb();
      await initDatabase(db);
      const tableCountAfterFirst = getTableNames(db).length;

      await initDatabase(db);
      const tableCountAfterSecond = getTableNames(db).length;

      expect(tableCountAfterSecond).toBe(tableCountAfterFirst);
      expect(tableCountAfterSecond).toBe(REQUIRED_TABLES.length);

      await db.closeAsync();
    });
  });
});
