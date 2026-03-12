import { importDataset } from '@/lib/dataset/import';
import { getDb } from '@/lib/db/client';
import migrations from '../../drizzle/migrations';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { municipalities } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import type { MunicipalityDataset } from '@/schema/municipality-dataset-schema';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';

const defaultDataset = require('@datasets/kumamoto-kikuchi-dataset.json') as MunicipalityDataset;

interface InitializationProviderProps {
  children: ReactNode;
}

/**
 * アプリ起動時のデータ初期化フローを管理するプロバイダ。
 * migration 実行後、初回起動時は import を実行し、再起動時はスキップする。
 */
export function InitializationProvider({ children }: InitializationProviderProps) {
  const db = getDb();
  const { success: migrationSuccess, error: migrationError } = useMigrations(db, migrations);

  const [initState, setInitState] = useState<'pending' | 'running' | 'done' | 'error'>('pending');
  const [error, setError] = useState<Error | null>(null);

  const runDataInit = useCallback(async () => {
    if (!migrationSuccess) return;

    setInitState('running');
    setError(null);

    try {
      const result = await db.select({ count: sql<number>`count(*)` }).from(municipalities);
      const count = result[0]?.count ?? 0;

      if (count === 0) {
        await importDataset(db, defaultDataset);
      }
      setInitState('done');
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setInitState('error');
    }
  }, [db, migrationSuccess]);

  useEffect(() => {
    if (migrationSuccess && initState === 'pending') {
      runDataInit();
    }
  }, [migrationSuccess, initState, runDataInit]);

  if (migrationError) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <Text style={{ color: 'red', marginBottom: 10 }}>マイグレーションに失敗しました</Text>
        <Text style={{ marginBottom: 20 }}>{migrationError.message}</Text>
      </View>
    );
  }

  if (!migrationSuccess) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>マイグレーション中...</Text>
      </View>
    );
  }

  if (initState === 'running' || initState === 'pending') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>初期設定中...</Text>
      </View>
    );
  }

  if (initState === 'error' && error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <Text style={{ color: 'red', marginBottom: 10 }}>初期化に失敗しました</Text>
        <Text style={{ marginBottom: 20 }}>{error.message}</Text>
        <Button title="再試行" onPress={() => setInitState('pending')} />
      </View>
    );
  }

  return <>{children}</>;
}
