import type { Db } from '@/lib/db/client';
import { candidateLogs } from '@/lib/db/schema';
import type { CandidateLog } from '@/types/candidate-log';
import { desc, eq } from 'drizzle-orm';

type CandidateLogCreate = Omit<CandidateLog, 'id'>;

/**
 * 認識履歴ログの永続化を行う Repository
 */
export class CandidateLogRepository {
  constructor(private readonly db: Db) {}

  async save(log: CandidateLogCreate): Promise<CandidateLog> {
    const result = await this.db
      .insert(candidateLogs)
      .values({
        imageUri: log.imageUri,
        candidatesJson: JSON.stringify(log.candidates),
        selectedItemId: log.selectedItemId ?? null,
        createdAt: log.createdAt,
      })
      .returning({ id: candidateLogs.id });
    const id = result[0]?.id;
    if (id == null) {
      throw new Error('Failed to insert candidate log');
    }
    return {
      id,
      imageUri: log.imageUri,
      candidates: log.candidates,
      selectedItemId: log.selectedItemId,
      createdAt: log.createdAt,
    };
  }

  async findById(id: number): Promise<CandidateLog | null> {
    const rows = await this.db
      .select()
      .from(candidateLogs)
      .where(eq(candidateLogs.id, id))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      imageUri: row.imageUri,
      candidates: JSON.parse(row.candidatesJson) as CandidateLog['candidates'],
      selectedItemId: row.selectedItemId ?? undefined,
      createdAt: row.createdAt,
    };
  }

  async findAll(limit?: number, offset?: number): Promise<CandidateLog[]> {
    const base = this.db.select().from(candidateLogs).orderBy(desc(candidateLogs.id));
    const rows =
      limit != null && offset != null
        ? await base.limit(limit).offset(offset)
        : limit != null
          ? await base.limit(limit)
          : offset != null
            ? await base.offset(offset)
            : await base;
    return rows.map((row) => ({
      id: row.id,
      imageUri: row.imageUri,
      candidates: JSON.parse(row.candidatesJson) as CandidateLog['candidates'],
      selectedItemId: row.selectedItemId ?? undefined,
      createdAt: row.createdAt,
    }));
  }
}
