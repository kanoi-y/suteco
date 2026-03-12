import type { Municipality, MunicipalityDataset } from '@/schema/municipality-dataset-schema';

function loadMunicipalityDatasetSchema() {
  try {
    return require('@/schema/municipality-dataset-schema') as {
      municipalityDatasetSchema: {
        parse: (input: MunicipalityDataset) => MunicipalityDataset;
      };
    };
  } catch {
    throw new Error(
      'municipalityDatasetSchema is not implemented yet. Create src/schema/municipality-dataset-schema.ts and export municipalityDatasetSchema.'
    );
  }
}

function createValidDataset(): MunicipalityDataset {
  return {
    municipality: {
      id: 'akita-yokote',
      displayName: '秋田県横手市',
      version: '2026-03-01',
    },
    items: [
      {
        id: 'mobile_battery',
        displayName: 'モバイルバッテリー',
        aliases: ['充電池', 'バッテリー'],
        keywords: ['モバイルバッテリー', 'リチウムイオン電池'],
      },
      {
        id: 'plastic_bottle',
        displayName: 'ペットボトル',
        aliases: ['PETボトル'],
        keywords: ['ペットボトル', 'プラスチック'],
      },
    ],
    rules: [
      {
        municipalityId: 'akita-yokote',
        itemId: 'mobile_battery',
        categoryName: '拠点回収',
        instructions: '端子を絶縁して指定回収拠点に持ち込んでください。',
      },
      {
        municipalityId: 'akita-yokote',
        itemId: 'plastic_bottle',
        categoryName: '資源ごみ',
        instructions: '中をすすぎ、ラベルを外して出してください。',
      },
    ],
  };
}

function cloneDataset(dataset: MunicipalityDataset): MunicipalityDataset {
  return JSON.parse(JSON.stringify(dataset)) as MunicipalityDataset;
}

describe('municipalityDatasetSchema', () => {
  it('正常データがバリデーションを通過する', () => {
    const { municipalityDatasetSchema } = loadMunicipalityDatasetSchema();
    const dataset = createValidDataset();

    expect(() => municipalityDatasetSchema.parse(dataset)).not.toThrow();
  });

  it('必須項目が欠落している場合は失敗する', () => {
    const { municipalityDatasetSchema } = loadMunicipalityDatasetSchema();
    const dataset = cloneDataset(createValidDataset()) as MunicipalityDataset & {
      municipality: Partial<Municipality>;
    };

    (dataset.municipality as Partial<Municipality>).displayName = undefined;

    expect(() => municipalityDatasetSchema.parse(dataset as MunicipalityDataset)).toThrow();
  });

  it('rules.itemId が items.id と不整合な場合は失敗する', () => {
    const { municipalityDatasetSchema } = loadMunicipalityDatasetSchema();
    const dataset = cloneDataset(createValidDataset());

    dataset.rules[0].itemId = 'unknown_item';

    expect(() => municipalityDatasetSchema.parse(dataset)).toThrow();
  });

  it('items.id が重複している場合は失敗する', () => {
    const { municipalityDatasetSchema } = loadMunicipalityDatasetSchema();
    const dataset = cloneDataset(createValidDataset());

    dataset.items.push({
      id: 'mobile_battery',
      displayName: 'モバイルバッテリー(重複)',
      aliases: ['重複'],
      keywords: ['duplicate'],
    });

    expect(() => municipalityDatasetSchema.parse(dataset)).toThrow();
  });
});
