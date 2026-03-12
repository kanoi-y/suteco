import type { SQLiteDatabase } from 'expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

const DB_NAME = 'suteco.db';

export type Db = ReturnType<typeof drizzle<typeof schema>>;

let dbInstance: Db | null = null;

/**
 * Drizzle DB インスタンスを返す。シングルトンとして同一インスタンスを再利用する。
 * 同期で DB を開くため、初回呼び出し時のみ軽いブロックが発生する。
 */
export function getDb(): Db {
  if (dbInstance != null) {
    return dbInstance;
  }
  const expoDb = openDatabaseSync(DB_NAME);
  dbInstance = drizzle(expoDb, { schema });
  return dbInstance;
}

/**
 * 既存の expo-sqlite 接続を Drizzle でラップする。
 * 主にテストでテスト用 DB を渡すために使用する。
 */
export function createDb(expoDb: SQLiteDatabase): Db {
  return drizzle(expoDb, { schema });
}
