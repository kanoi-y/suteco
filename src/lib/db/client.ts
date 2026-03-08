import * as SQLite from 'expo-sqlite';

const DB_NAME = 'suteco.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * suteco.db への接続を返す。シングルトンとして同一インスタンスを再利用する。
 */
export async function getDbClient(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance != null) {
    return dbInstance;
  }
  dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  return dbInstance;
}
