import type { MunicipalityDataset } from '@/schema/municipality-dataset-schema';

interface NormalizedDatasetForDigest {
  municipality: {
    id: string;
    displayName: string;
  };
  items: Array<{
    id: string;
    displayName: string;
    aliases: string[];
    keywords: string[];
  }>;
  rules: Array<{
    municipalityId: string;
    itemId: string;
    categoryName: string;
    instructions: string;
    notes: string | null;
    officialUrl: string | null;
  }>;
}

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
    return Object.fromEntries(entries.map(([key, child]) => [key, sortObjectKeys(child)]));
  }

  return value;
}

function fnv1aHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function normalizeDatasetForDigest(dataset: MunicipalityDataset): NormalizedDatasetForDigest {
  return {
    municipality: {
      id: dataset.municipality.id,
      displayName: dataset.municipality.displayName,
    },
    items: [...dataset.items]
      .map((item) => ({
        id: item.id,
        displayName: item.displayName,
        aliases: [...item.aliases].sort(),
        keywords: [...item.keywords].sort(),
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    rules: [...dataset.rules]
      .map((rule) => ({
        municipalityId: rule.municipalityId,
        itemId: rule.itemId,
        categoryName: rule.categoryName,
        instructions: rule.instructions,
        notes: rule.notes ?? null,
        officialUrl: rule.officialUrl ?? null,
      }))
      .sort((a, b) => {
        const keyA = `${a.municipalityId}:${a.itemId}`;
        const keyB = `${b.municipalityId}:${b.itemId}`;
        return keyA.localeCompare(keyB);
      }),
  };
}

export function computeDatasetContentDigest(dataset: MunicipalityDataset): string {
  const normalized = normalizeDatasetForDigest(dataset);
  const stableValue = sortObjectKeys(normalized);
  const serialized = JSON.stringify(stableValue);
  return fnv1aHash(serialized);
}
