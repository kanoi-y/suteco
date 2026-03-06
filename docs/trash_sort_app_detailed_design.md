# ごみ分別支援アプリ 詳細設計書

## 1. 目的

本書は、別紙「ごみ分別支援アプリ 仕様書」に基づき、実装担当者が開発を進めるための詳細設計を定義するものである。

本アプリは以下を満たすことを目的とする。

- スマートフォンのカメラ、画像選択、テキスト検索からごみ品目を特定できる
- 選択中の自治体に応じた分別方法を表示できる
- 自治体データをアプリ本体から分離し、追加・更新しやすい構成を持つ
- 認識処理を差し替え可能な構成を持つ

---

## 2. システム概要

### 2.1 構成

本システムは単一のモバイルアプリケーションとして構成する。

- クライアント: Expo / React Native / TypeScript
- ローカル DB: SQLite
- 永続ストレージ: AsyncStorage または Key-Value ストレージ
- 画像認識: 抽象インターフェース経由で実装を切り替え可能
- 自治体データ: JSON ファイルを取り込み、SQLite に登録

### 2.2 設計方針

- UI 層とドメイン層を分離する
- 自治体データを外部ファイルとして管理する
- 画像認識結果は共通品目 ID に正規化してから分別ルールに引き当てる
- 認識処理はアダプタ方式で差し替え可能とする
- 初期リリースではオフライン検索を優先する

---

## 3. 採用技術

## 3.1 フレームワーク・ライブラリ

- Expo
- React Native
- TypeScript
- Expo Router
- expo-camera
- expo-image-picker
- expo-sqlite
- Zustand
- Zod

## 3.2 利用目的

### Expo Router

画面遷移およびファイルベースルーティングを構成する。

### expo-camera

カメラのプレビュー表示および撮影機能を提供する。

### expo-image-picker

端末内画像の選択機能を提供する。

### expo-sqlite

自治体データ、品目データ、分別ルールを端末内に保存する。

### Zustand

軽量なグローバル状態管理を行う。

保持対象は以下を想定する。

- 現在選択中の自治体
- 直近の画像認識結果
- 選択中の品目候補
- 設定値

### Zod

自治体データ JSON のバリデーションに利用する。

---

## 4. リポジトリ構成

```txt
root/
  apps/
    mobile/
      app/
        _layout.tsx
        index.tsx
        camera.tsx
        candidates.tsx
        search.tsx
        item/
          [itemId].tsx
        municipality/
          select.tsx
        settings.tsx
      src/
        components/
        features/
          camera/
          classification/
          municipality/
          search/
          rule/
          settings/
        hooks/
        lib/
          db/
          dataset/
          recognizer/
          logger/
          storage/
        stores/
        types/
        constants/
        utils/
  datasets/
    schema/
    municipalities/
      akita-yokote.json
  scripts/
    validate-dataset.ts
    build-dataset.ts
  docs/
    specification.md
    detailed-design.md
```

### 4.1 apps/mobile

アプリ本体を配置する。

### 4.2 datasets/schema

自治体データのスキーマを配置する。

### 4.3 datasets/municipalities

自治体ごとの JSON データを配置する。

### 4.4 scripts

データ検証・データ変換スクリプトを配置する。

---

## 5. 画面設計

## 5.1 画面一覧

| 画面ID | 画面名 | パス | 概要 |
|---|---|---|---|
| SC-001 | トップ画面 | `/` | 入力方法の選択 |
| SC-002 | カメラ画面 | `/camera` | 撮影および画像確認 |
| SC-003 | 候補選択画面 | `/candidates` | 認識候補の一覧表示 |
| SC-004 | テキスト検索画面 | `/search` | 品目検索 |
| SC-005 | 分別詳細画面 | `/item/[itemId]` | 分別情報表示 |
| SC-006 | 自治体選択画面 | `/municipality/select` | 自治体選択 |
| SC-007 | 設定画面 | `/settings` | 設定変更・データ情報確認 |

---

## 5.2 トップ画面

### 表示項目

- 現在選択中の自治体名
- 「カメラで撮影」ボタン
- 「画像を選択」ボタン
- 「テキストで検索」ボタン
- 「設定」ボタン

### イベント

- カメラ撮影ボタン押下でカメラ画面へ遷移
- 画像選択ボタン押下で image picker を起動
- テキスト検索ボタン押下で検索画面へ遷移
- 設定ボタン押下で設定画面へ遷移
- 自治体未選択の場合は自治体選択画面へ誘導

---

## 5.3 カメラ画面

### 表示項目

- カメラプレビュー
- シャッターボタン
- キャンセルボタン
- 撮影後プレビュー
- 再撮影ボタン
- 認識実行ボタン

### 処理

1. カメラ権限を確認する
2. 未許可の場合は権限要求 UI を表示する
3. 撮影画像 URI を取得する
4. 認識実行時に recognizer を呼び出す
5. 認識候補をストアへ保存する
6. 候補選択画面へ遷移する

---

## 5.4 候補選択画面

### 表示項目

- 認識対象画像のサムネイル
- 候補一覧
- 候補が見つからない場合のテキスト検索導線
- 戻るボタン

### 候補項目

- 品目名
- 信頼度（必要に応じて表示）
- 別名補足（任意）

### 処理

- 候補選択時に itemId を確定し、分別詳細画面へ遷移する
- 候補が不適切な場合は検索画面へ遷移する

---

## 5.5 テキスト検索画面

### 表示項目

- 検索入力欄
- 検索結果一覧
- 結果なしメッセージ

### 処理

- 入力中にローカル検索を実行する
- 一定文字数未満でも検索は許容するが、初期表示では候補を出さない
- 結果選択時に分別詳細画面へ遷移する

---

## 5.6 分別詳細画面

### 表示項目

- 品目名
- 分別区分
- 出し方
- 注意事項
- 参照先 URL
- 選択中自治体名

### 処理

- `municipalityId + itemId` で分別ルールを検索する
- 該当ルールがなければ未対応メッセージを表示する
- URL が存在する場合は外部ブラウザで開けるようにする

---

## 5.7 自治体選択画面

### 表示項目

- 自治体一覧
- 検索入力欄（将来対応可）
- 現在選択中表示

### 処理

- 選択時に設定ストアへ保存する
- 永続ストレージにも保存する
- 選択後はトップ画面へ戻る

---

## 5.8 設定画面

### 表示項目

- 現在の自治体名
- データバージョン
- 認識方式
- 自治体変更ボタン
- データ再取込ボタン
- 開発用情報表示（開発時のみ）

---

## 6. 状態管理設計

## 6.1 ストア一覧

### municipalityStore

保持項目:

- selectedMunicipalityId: string | null
- selectedMunicipalityName: string | null
- datasetVersion: string | null

主な操作:

- setMunicipality
- loadMunicipality
- clearMunicipality

### classificationStore

保持項目:

- sourceImageUri: string | null
- candidates: Candidate[]
- selectedItemId: string | null
- status: `idle` | `loading` | `success` | `error`
- errorMessage: string | null

主な操作:

- setSourceImage
- startClassification
- setCandidates
- selectItem
- setError
- reset

### settingsStore

保持項目:

- recognizerType: `mock` | `api` | `local`
- showDebugInfo: boolean

---

## 7. データ設計

## 7.1 論理データモデル

### municipalities

| カラム名 | 型 | 必須 | 説明 |
|---|---|---|---|
| id | TEXT | Yes | 自治体識別子 |
| display_name | TEXT | Yes | 自治体表示名 |
| version | TEXT | Yes | データバージョン |

### items

| カラム名 | 型 | 必須 | 説明 |
|---|---|---|---|
| id | TEXT | Yes | 共通品目 ID |
| display_name | TEXT | Yes | 品目表示名 |
| aliases_json | TEXT | Yes | 別名配列 JSON |
| keywords_json | TEXT | Yes | 検索用キーワード配列 JSON |

### disposal_rules

| カラム名 | 型 | 必須 | 説明 |
|---|---|---|---|
| municipality_id | TEXT | Yes | 自治体 ID |
| item_id | TEXT | Yes | 共通品目 ID |
| category_name | TEXT | Yes | 分別区分 |
| instructions | TEXT | Yes | 出し方 |
| notes | TEXT | No | 注意事項 |
| official_url | TEXT | No | 参照先 URL |

### candidate_logs

| カラム名 | 型 | 必須 | 説明 |
|---|---|---|---|
| id | INTEGER | Yes | ログ ID |
| image_uri | TEXT | Yes | 入力画像 |
| candidates_json | TEXT | Yes | 候補 JSON |
| selected_item_id | TEXT | No | 利用者が選択した品目 |
| created_at | TEXT | Yes | 作成日時 |

`candidate_logs` は任意機能だが、将来的な認識改善に備えて定義しておく。

---

## 7.2 SQLite スキーマ

```sql
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
```

### インデックス

```sql
CREATE INDEX IF NOT EXISTS idx_disposal_rules_municipality_item
ON disposal_rules (municipality_id, item_id);

CREATE INDEX IF NOT EXISTS idx_items_display_name
ON items (display_name);
```

---

## 7.3 自治体データ JSON フォーマット

```json
{
  "municipality": {
    "id": "akita-yokote",
    "displayName": "秋田県横手市",
    "version": "2026-03-01"
  },
  "items": [
    {
      "id": "mobile_battery",
      "displayName": "モバイルバッテリー",
      "aliases": ["充電池", "バッテリー", "モバブ"],
      "keywords": ["モバイルバッテリー", "充電池", "リチウムイオン電池"]
    }
  ],
  "rules": [
    {
      "itemId": "mobile_battery",
      "categoryName": "拠点回収",
      "instructions": "端子を絶縁して指定回収拠点に持ち込んでください。",
      "notes": "破損・膨張している場合は自治体へ相談してください。",
      "officialUrl": "https://example.com"
    }
  ]
}
```

---

## 7.4 Zod スキーマ方針

- JSON ルート構造をバリデーションする
- `municipality.id` は一意であること
- `items.id` はファイル内で一意であること
- `rules.itemId` は `items.id` に存在すること
- 必須文字列が空文字でないこと

---

## 8. 認識処理設計

## 8.1 認識インターフェース

```ts
export type Candidate = {
  itemId: string;
  label: string;
  score?: number;
};

export interface Recognizer {
  classify(input: {
    imageUri: string;
    municipalityId?: string;
  }): Promise<Candidate[]>;
}
```

## 8.2 実装一覧

### MockRecognizer

- 固定候補を返す
- UI 実装および開発時の確認用

### ApiRecognizer

- 外部 API を呼び出す
- レスポンスを共通 Candidate[] に変換して返す
- API エラー時は例外を送出する

### LocalRecognizer

- 端末内推論モデルを利用する
- 初期リリースでは未実装でもよい

---

## 8.3 認識結果の正規化

外部認識結果が直接 `itemId` を返さない場合、正規化処理を通す。

### 正規化ルール

1. 完全一致
2. 別名一致
3. キーワード一致
4. 部分一致
5. 一致なし

### 例

- `power bank` -> `mobile_battery`
- `battery pack` -> `mobile_battery`
- `spray can` -> `spray_can`

---

## 9. 検索設計

## 9.1 検索対象

- `items.display_name`
- `items.aliases_json`
- `items.keywords_json`

## 9.2 検索アルゴリズム

検索は以下の順序でスコアリングする。

1. 表示名の完全一致
2. 別名の完全一致
3. 表示名の部分一致
4. 別名の部分一致
5. キーワード部分一致

## 9.3 検索サービスインターフェース

```ts
export type SearchResult = {
  itemId: string;
  displayName: string;
  matchedBy: 'display_name_exact' | 'alias_exact' | 'display_name_partial' | 'alias_partial' | 'keyword_partial';
};

export interface ItemSearchService {
  search(params: {
    query: string;
    limit?: number;
  }): Promise<SearchResult[]>;
}
```

---

## 10. 永続化設計

## 10.1 保存対象

### 永続ストレージ

- 選択中自治体 ID
- 認識方式
- デバッグ設定

### SQLite

- 自治体マスタ
- 品目マスタ
- 分別ルール
- ログ

## 10.2 初回起動時のデータ投入

1. バンドル済み JSON を読み込む
2. Zod でバリデーションする
3. SQLite へトランザクションで投入する
4. 成功後、初期自治体選択画面へ遷移する

## 10.3 データ再取込

- 既存データを削除または upsert する
- 失敗時はロールバックする

---

## 11. 主要ユースケース処理

## 11.1 カメラ撮影から分別結果表示まで

1. 利用者がトップ画面で「カメラで撮影」を選択
2. カメラ画面で撮影
3. 撮影画像 URI を classificationStore に保持
4. recognizer.classify を実行
5. 結果を Candidate[] として受信
6. 候補選択画面に遷移
7. 利用者が候補を選択
8. 分別詳細画面で `municipalityId + itemId` によりルール取得
9. 分別情報を表示

## 11.2 テキスト検索から分別結果表示まで

1. 利用者がトップ画面で「テキストで検索」を選択
2. 検索画面でクエリ入力
3. ローカル検索を実行
4. 結果一覧を表示
5. 利用者が品目を選択
6. 分別詳細画面へ遷移
7. 分別情報を表示

## 11.3 自治体変更

1. 利用者が設定画面から自治体変更を選択
2. 自治体選択画面で自治体を選択
3. municipalityStore と永続ストレージへ保存
4. トップ画面へ戻る
5. 以降の検索・表示は選択自治体で実行する

---

## 12. DB アクセス設計

## 12.1 Repository 一覧

### MunicipalityRepository

- findAll()
- findById(id)
- saveAll(data)

### ItemRepository

- search(query, limit)
- findById(id)
- saveAll(data)

### DisposalRuleRepository

- findByMunicipalityAndItem(municipalityId, itemId)
- saveAll(data)

### CandidateLogRepository

- insert(log)
- updateSelectedItem(id, itemId)

---

## 12.2 Repository 実装方針

- SQL は repository 層に閉じ込める
- feature 層から直接 SQL を実行しない
- 返却型はアプリ内の型に変換して返す

---

## 13. エラーハンドリング設計

## 13.1 エラー分類

| 種別 | 内容 | 表示方針 |
|---|---|---|
| PERMISSION_DENIED | カメラ権限なし | 権限要求 UI を表示 |
| CLASSIFICATION_FAILED | 認識失敗 | 再試行導線と検索導線を表示 |
| DATA_NOT_FOUND | ルール未登録 | 未対応メッセージを表示 |
| DATA_IMPORT_FAILED | データ取込失敗 | 再試行導線を表示 |
| STORAGE_FAILED | 保存失敗 | 一時エラーメッセージを表示 |

## 13.2 エラー表現

ドメイン層では Error を拡張した独自エラー型を利用してもよい。

```ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public cause?: unknown,
  ) {
    super(message);
  }
}
```

---

## 14. ログ設計

## 14.1 開発ログ

- 認識処理開始
- 認識結果件数
- 正規化結果
- DB 検索結果
- データ取込結果

## 14.2 保存ログ

必要に応じて `candidate_logs` に以下を保存する。

- 入力画像 URI
- 候補一覧
- 最終選択品目
- 時刻

初期リリースでは無効化可能とする。

---

## 15. セキュリティ・プライバシー設計

- 画像は端末内でのみ一時利用する
- 外部 API を使用する場合、利用者に明示する
- 不要な個人情報は扱わない
- URL 遷移時は安全な外部リンクのみ開く

---

## 16. テスト設計

## 16.1 単体テスト対象

- データバリデーション
- JSON 取込処理
- 認識結果正規化処理
- 品目検索処理
- repository 層
- ストア操作

## 16.2 結合テスト対象

- カメラ撮影後の候補表示
- テキスト検索から分別結果表示
- 自治体変更後の結果切替
- データ再取込

## 16.3 テストデータ

- 正常データ
- 必須項目欠落データ
- itemId 不整合データ
- ルール未登録データ

---

## 17. 実装優先順位

### Phase 1

- ルーティング構築
- 自治体選択
- JSON バリデーション
- SQLite 取込
- テキスト検索
- 分別詳細表示

### Phase 2

- カメラ画面
- 画像選択
- MockRecognizer
- 候補選択画面

### Phase 3

- ApiRecognizer
- 認識結果正規化改善
- ログ保存
- データ再取込

### Phase 4

- LocalRecognizer
- OCR
- バーコード対応

---

## 18. 実装時の注意事項

- 認識処理に失敗しても検索機能で利用継続できること
- 自治体データ変更時にアプリ本体のコード修正が不要であること
- 文字列比較では表記ゆれを考慮すること
- DB 初期化と再取込は冪等性を持たせること
- 画面遷移に依存した状態保持を最小限にすること

---

## 19. 今後の拡張余地

- 自治体検索 UI 強化
- 複数自治体データパックの切替
- 回収日情報との連携
- OCR によるラベル文字抽出
- バーコードによる品目推定
- 完全オフライン認識モデル導入

