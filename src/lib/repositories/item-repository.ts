import type { Db } from "@/lib/db/client";
import { items } from "@/lib/db/schema";
import type { Item } from "@/schema/municipality-dataset-schema";
import { eq } from "drizzle-orm";

/**
 * 品目データの永続化を行う Repository
 */
export class ItemRepository {
  constructor(private readonly db: Db) {}

  async save(item: Item): Promise<void> {
    await this.db
      .insert(items)
      .values({
        id: item.id,
        displayName: item.displayName,
        aliasesJson: JSON.stringify(item.aliases),
        keywordsJson: JSON.stringify(item.keywords),
      })
      .onConflictDoUpdate({
        target: items.id,
        set: {
          displayName: item.displayName,
          aliasesJson: JSON.stringify(item.aliases),
          keywordsJson: JSON.stringify(item.keywords),
        },
      });
  }

  async findById(id: string): Promise<Item | null> {
    const rows = await this.db
      .select()
      .from(items)
      .where(eq(items.id, id))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      displayName: row.displayName,
      aliases: JSON.parse(row.aliasesJson) as string[],
      keywords: JSON.parse(row.keywordsJson) as string[],
    };
  }

  async findByDisplayName(displayName: string): Promise<Item[]> {
    const rows = await this.db
      .select()
      .from(items)
      .where(eq(items.displayName, displayName));
    return rows.map((row) => ({
      id: row.id,
      displayName: row.displayName,
      aliases: JSON.parse(row.aliasesJson) as string[],
      keywords: JSON.parse(row.keywordsJson) as string[],
    }));
  }

  async findAll(): Promise<Item[]> {
    const rows = await this.db.select().from(items);
    return rows.map((row) => ({
      id: row.id,
      displayName: row.displayName,
      aliases: JSON.parse(row.aliasesJson) as string[],
      keywords: JSON.parse(row.keywordsJson) as string[],
    }));
  }
}
