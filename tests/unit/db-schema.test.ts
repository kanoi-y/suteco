import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "../../drizzle/migrations";
import { openTestDb } from "../helpers/db";

const REQUIRED_TABLES = [
  "municipalities",
  "items",
  "disposal_rules",
  "candidate_logs",
] as const;

const REQUIRED_INDEXES = [
  "idx_disposal_rules_municipality_item",
  "idx_items_display_name",
] as const;

function getTableNames(expoDb: { getAllSync: (sql: string) => { name: string }[] }): string[] {
  const rows = expoDb.getAllSync(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );
  return rows.map((r) => r.name);
}

function getIndexNames(expoDb: { getAllSync: (sql: string) => { name: string }[] }): string[] {
  const rows = expoDb.getAllSync(
    "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
  );
  return rows.map((r) => r.name);
}

describe("Drizzle migrations", () => {
  describe("tables 作成テスト", () => {
    it("必要な4テーブルが作成される", async () => {
      const { expoDb } = await openTestDb("db_schema_tables");

      const tableNames = getTableNames(expoDb);
      for (const table of REQUIRED_TABLES) {
        expect(tableNames).toContain(table);
      }

      await expoDb.closeAsync();
    });
  });

  describe("index 作成テスト", () => {
    it("必要な2インデックスが作成される", async () => {
      const { expoDb } = await openTestDb("db_schema_indexes");

      const indexNames = getIndexNames(expoDb);
      for (const index of REQUIRED_INDEXES) {
        expect(indexNames).toContain(index);
      }

      await expoDb.closeAsync();
    });
  });

  describe("初期化後に再実行しても壊れないテスト", () => {
    it("migration を2回実行してもエラーにならず、テーブル数は変わらない", async () => {
      const { expoDb, db } = await openTestDb("db_schema_idempotent");

      const tableCountAfterFirst = getTableNames(expoDb).length;
      expect(tableCountAfterFirst).toBeGreaterThanOrEqual(REQUIRED_TABLES.length);

      await migrate(db, migrations);
      const tableCountAfterSecond = getTableNames(expoDb).length;

      expect(tableCountAfterSecond).toBe(tableCountAfterFirst);

      await expoDb.closeAsync();
    });
  });
});
