import type { MunicipalityDataset } from '@/schema/municipality-dataset-schema';

// datasets ディレクトリ内のすべての .json ファイルを自動でrequireする
const context = require.context('../../datasets', false, /\.json$/);

export const defaultDatasets: MunicipalityDataset[] = context.keys().map((key) => {
  return context(key) as MunicipalityDataset;
});
