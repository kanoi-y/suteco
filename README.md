# Suteco（ステコ）

選択した自治体の基準に合わせて、ゴミの分別や捨て方を検索・判定できるモバイルアプリです。Expo / React Native ベースで開発されています。

## 機能一覧

- **自治体の選択・切り替え**: 利用する自治体を選び、その自治体の分別ルールに基づいて検索・判定します
- **テキスト検索**: ゴミの品目名やキーワードで分別ルールを検索します
- **カメラで判定**: ゴミの写真を撮影し、画像認識で品目を推定します
- **画像から判定**: フォトライブラリから画像を選択して判定します
- **分別ルールの確認**: 品目ごとのカテゴリー（可燃・不燃など）や詳細な捨て方・注意事項を確認できます

## セットアップ手順

### 前提条件

- Node.js（推奨: LTS 版）
- [pnpm](https://pnpm.io/ja/) がインストールされていること

### 環境変数の設定

`.env.example` をコピーして `.env.local` を作成し、Gemini API のキーを設定します。

```bash
cp .env.example .env.local
```

`.env.local` ファイルを開き、`GEMINI_API_KEY` にご自身の Gemini API キーを設定してください。

画像認識はクライアントから直接 Gemini を呼ばず、[Expo Router の API Routes](https://docs.expo.dev/router/web/api-routes)（`/api/recognize`）経由でサーバー側のみがキーを使います。

本番・プレビューでは EAS Hosting などにサーバーバンドルをデプロイし、ホスティング側のシークレットに `GEMINI_API_KEY` を設定してください。相対パス `fetch('/api/recognize')` は開発時は Metro のオリジン、本番では `expo-router` の `origin` プラグイン設定や `EXPO_UNSTABLE_DEPLOY_SERVER=1` などで解決されます（詳細は [API Routes ドキュメント](https://docs.expo.dev/router/web/api-routes) を参照）。

### インストール

```bash
pnpm install
```

## pnpm での起動方法

- **Expo 開発サーバーを起動**（Expo Go アプリで読み取る QR コードを表示）:

```bash
pnpm start
```

- **iOS シミュレーターで起動**:

```bash
pnpm run ios
```

- **Android エミュレーターで起動**:

```bash
pnpm run android
```

- **Web で起動**:

```bash
pnpm run web
```

## テスト実行方法

Jest を用いたテストが用意されています。

- **全てのテストを実行**:

```bash
pnpm test
```

- **ユニットテストのみ実行**:

```bash
pnpm run test:unit
```

- **インテグレーションテストのみ実行**:

```bash
pnpm run test:integration
```

## データ追加方法

アプリ内で扱う自治体ごとのゴミ分別データは、`datasets/` ディレクトリ内の JSON ファイルで管理されています。

### 1. JSON ファイルの配置

`datasets/` ディレクトリに、自治体ごとのデータセット JSON ファイルを配置します。ファイル名の例: `kumamoto-kikuchi-dataset.json`。

### 2. スキーマ形式

各 JSON ファイルは次の構造である必要があります。

```json
{
  "municipality": {
    "id": "自治体ID（例: kumamoto-kikuchi）",
    "displayName": "表示名（例: 熊本県菊池市）",
    "version": "バージョン（例: 2025-09-01）"
  },
  "items": [
    {
      "id": "品目ID",
      "displayName": "品目表示名",
      "aliases": ["別名1", "別名2"],
      "keywords": ["検索キーワード1", "キーワード2"]
    }
  ],
  "rules": [
    {
      "municipalityId": "自治体ID",
      "itemId": "品目ID",
      "categoryName": "カテゴリー名（例: 特定品目）",
      "instructions": "捨て方の説明",
      "notes": "補足（任意）",
      "officialUrl": "公式リンクURL（任意）"
    }
  ]
}
```

- `rules` の `itemId` は、必ず `items` 内のいずれかの `id` と一致させてください。

### 3. バリデーションの実行

追加したデータが正しいスキーマに準拠しているか確認します。

```bash
pnpm run validate-dataset:all
```

特定のファイルのみ検証する場合:

```bash
pnpm run validate-dataset datasets/あなたのファイル.json
```

### 4. アプリへの反映

`datasets/` 配下の JSON ファイルは、アプリ起動時に自動的に読み込まれ、ローカルの SQLite データベースにインポートされます。手動での DB 投入コマンドの実行は不要です。追加したファイルを有効にするには、アプリを再起動してください。
