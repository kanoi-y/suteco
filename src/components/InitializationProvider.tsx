import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { getDbClient } from '@/lib/db/client';
import { initDatabase } from '@/lib/db/schema';
import { importDataset } from '@/lib/dataset/import';
import type { MunicipalityDataset } from '@/schema/municipality-dataset-schema';

const defaultDataset = require('@datasets/kumamoto-kikuchi-dataset.json') as MunicipalityDataset;

interface InitializationProviderProps {
  children: ReactNode;
}

/**
 * アプリ起動時のデータ初期化フローを管理するプロバイダ。
 * 初回起動時は import を実行し、再起動時はスキップする。
 */
export function InitializationProvider({ children }: InitializationProviderProps) {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function runInitialization() {
      try {
        const db = await getDbClient();
        await initDatabase(db);

        const row = await db.getFirstAsync<{ count: number }>(
          'SELECT COUNT(*) as count FROM municipalities'
        );
        const count = row?.count ?? 0;

        if (count === 0) {
          await importDataset(db, defaultDataset);
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    }

    runInitialization();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>初期設定中...</Text>
      </View>
    );
  }

  return <>{children}</>;
}
