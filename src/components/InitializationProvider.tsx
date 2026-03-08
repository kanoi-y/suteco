import { importDataset } from "@/lib/dataset/import";
import { getDbClient } from "@/lib/db/client";
import { initDatabase } from "@/lib/db/schema";
import type { MunicipalityDataset } from "@/schema/municipality-dataset-schema";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { Button, Text, View } from "react-native";

const defaultDataset =
  require("@datasets/kumamoto-kikuchi-dataset.json") as MunicipalityDataset;

interface InitializationProviderProps {
  children: ReactNode;
}

/**
 * アプリ起動時のデータ初期化フローを管理するプロバイダ。
 * 初回起動時は import を実行し、再起動時はスキップする。
 */
export function InitializationProvider({
  children,
}: InitializationProviderProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const runInitialization = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(null);

      const db = await getDbClient();
      await initDatabase(db);

      const row = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM municipalities",
      );
      const count = row?.count ?? 0;

      if (count === 0) {
        await importDataset(db, defaultDataset);
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    runInitialization();
  }, [runInitialization]);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>初期設定中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ color: "red", marginBottom: 10 }}>
          初期化に失敗しました
        </Text>
        <Text style={{ marginBottom: 20 }}>{error.message}</Text>
        <Button title="再試行" onPress={runInitialization} />
      </View>
    );
  }

  return <>{children}</>;
}
