import type { SQLiteDatabase } from 'expo-sqlite';

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS municipalities (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  version TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  aliases_json TEXT NOT NULL,
  keywords_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS disposal_rules (
  municipality_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  instructions TEXT NOT NULL,
  notes TEXT,
  official_url TEXT,
  PRIMARY KEY (municipality_id, item_id)
);

CREATE TABLE IF NOT EXISTS candidate_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_uri TEXT NOT NULL,
  candidates_json TEXT NOT NULL,
  selected_item_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_disposal_rules_municipality_item
ON disposal_rules (municipality_id, item_id);

CREATE INDEX IF NOT EXISTS idx_items_display_name
ON items (display_name);
`;

/**
 * DB を初期化する（テーブルとインデックスを作成する）。
 * 冪等: 再実行してもエラーにならない（CREATE IF NOT EXISTS を使用）。
 */
export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(SCHEMA_SQL);
}
