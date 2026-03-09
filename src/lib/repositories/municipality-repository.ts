import type { Db } from "@/lib/db/client";
import { municipalities } from "@/lib/db/schema";
import type { Municipality } from "@/schema/municipality-dataset-schema";
import { eq } from "drizzle-orm";

/**
 * 自治体データの永続化を行う Repository
 */
export class MunicipalityRepository {
  constructor(private readonly db: Db) {}

  async save(municipality: Municipality): Promise<void> {
    await this.db
      .insert(municipalities)
      .values({
        id: municipality.id,
        displayName: municipality.displayName,
        version: municipality.version,
      })
      .onConflictDoUpdate({
        target: municipalities.id,
        set: {
          displayName: municipality.displayName,
          version: municipality.version,
        },
      });
  }

  async findById(id: string): Promise<Municipality | null> {
    const rows = await this.db
      .select()
      .from(municipalities)
      .where(eq(municipalities.id, id))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      displayName: row.displayName,
      version: row.version,
    };
  }

  async findAll(): Promise<Municipality[]> {
    const rows = await this.db.select().from(municipalities);
    return rows.map((row) => ({
      id: row.id,
      displayName: row.displayName,
      version: row.version,
    }));
  }

  async upsertAll(municipalitiesList: Municipality[]): Promise<void> {
    if (municipalitiesList.length === 0) return;
    for (const m of municipalitiesList) {
      await this.save(m);
    }
  }
}
