import * as SQLite from 'expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { createDb } from '@/lib/db/client';
import type { Db } from '@/lib/db/client';
import migrations from '../../drizzle/migrations';

/**
 * テスト用に一意の DB を開き、migration を実行して Drizzle Db を返す。
 */
export async function openTestDb(name: string): Promise<{ expoDb: SQLite.SQLiteDatabase; db: Db }> {
  const dbName = `${name}_${process.env.JEST_WORKER_ID ?? 0}_${Date.now()}`;
  const expoDb = await SQLite.openDatabaseAsync(dbName);
  const db = createDb(expoDb);
  await migrate(db, migrations);
  return { expoDb, db };
}
