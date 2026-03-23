import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** 自治体テーブル */
export const municipalities = sqliteTable('municipalities', {
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  version: text('version').notNull(),
  contentDigest: text('content_digest'),
});

/** 品目テーブル */
export const items = sqliteTable(
  'items',
  {
    id: text('id').primaryKey(),
    displayName: text('display_name').notNull(),
    aliasesJson: text('aliases_json').notNull(),
    keywordsJson: text('keywords_json').notNull(),
  },
  (table) => [index('idx_items_display_name').on(table.displayName)]
);

/** 分別ルールテーブル */
export const disposalRules = sqliteTable(
  'disposal_rules',
  {
    municipalityId: text('municipality_id').notNull(),
    itemId: text('item_id').notNull(),
    categoryName: text('category_name').notNull(),
    instructions: text('instructions').notNull(),
    notes: text('notes'),
    officialUrl: text('official_url'),
  },
  (table) => [
    primaryKey({
      columns: [table.municipalityId, table.itemId],
      name: 'disposal_rules_pk',
    }),
    index('idx_disposal_rules_municipality_item').on(table.municipalityId, table.itemId),
  ]
);

/** 認識履歴ログテーブル */
export const candidateLogs = sqliteTable('candidate_logs', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  imageUri: text('image_uri').notNull(),
  candidatesJson: text('candidates_json').notNull(),
  selectedItemId: text('selected_item_id'),
  createdAt: text('created_at').notNull(),
});
