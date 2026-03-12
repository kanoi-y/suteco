import type { Db } from '@/lib/db/client';
import { disposalRules } from '@/lib/db/schema';
import type { DisposalRule } from '@/schema/municipality-dataset-schema';
import { and, eq } from 'drizzle-orm';

/**
 * 分別ルールデータの永続化を行う Repository
 */
export class DisposalRuleRepository {
  constructor(private readonly db: Db) {}

  async save(rule: DisposalRule): Promise<void> {
    await this.db
      .insert(disposalRules)
      .values({
        municipalityId: rule.municipalityId,
        itemId: rule.itemId,
        categoryName: rule.categoryName,
        instructions: rule.instructions,
        notes: rule.notes ?? null,
        officialUrl: rule.officialUrl ?? null,
      })
      .onConflictDoUpdate({
        target: [disposalRules.municipalityId, disposalRules.itemId],
        set: {
          categoryName: rule.categoryName,
          instructions: rule.instructions,
          notes: rule.notes ?? null,
          officialUrl: rule.officialUrl ?? null,
        },
      });
  }

  async findByMunicipalityAndItem(
    municipalityId: string,
    itemId: string
  ): Promise<DisposalRule | null> {
    const rows = await this.db
      .select()
      .from(disposalRules)
      .where(
        and(eq(disposalRules.municipalityId, municipalityId), eq(disposalRules.itemId, itemId))
      )
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return {
      municipalityId: row.municipalityId,
      itemId: row.itemId,
      categoryName: row.categoryName,
      instructions: row.instructions,
      notes: row.notes ?? undefined,
      officialUrl: row.officialUrl ?? undefined,
    };
  }

  async findByMunicipalityId(municipalityId: string): Promise<DisposalRule[]> {
    const rows = await this.db
      .select()
      .from(disposalRules)
      .where(eq(disposalRules.municipalityId, municipalityId));
    return rows.map((row) => ({
      municipalityId: row.municipalityId,
      itemId: row.itemId,
      categoryName: row.categoryName,
      instructions: row.instructions,
      notes: row.notes ?? undefined,
      officialUrl: row.officialUrl ?? undefined,
    }));
  }
}
