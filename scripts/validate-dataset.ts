import * as fs from 'node:fs';
import * as path from 'node:path';
import { municipalityDatasetSchema } from '../src/schema/municipality-dataset-schema';

const USAGE = `使用方法: node validate-dataset <ファイルパス> [ファイルパス2 ...]
  ファイルパス: 検証する JSON データセットファイルのパス`;

function printUsage(): void {
  console.error(USAGE);
}

function validateFile(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    console.error(`エラー: ファイルが存在しません: ${filePath}`);
    return false;
  }

  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`エラー: ファイルを読み込めません: ${filePath} (${msg})`);
    return false;
  }

  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`エラー: JSON パースに失敗しました: ${filePath} (${msg})`);
    return false;
  }

  const result = municipalityDatasetSchema.safeParse(json);
  if (!result.success) {
    const issues = result.error.issues;
    for (const issue of issues) {
      const pathStr = issue.path.length > 0 ? issue.path.join('.') : '(root)';
      console.error(`検証失敗 [${pathStr}]: ${issue.message}`);
    }
    return false;
  }

  return true;
}

export function main(argv: string[]): void {
  const args = argv.slice(2);

  if (args.length === 0) {
    printUsage();
    process.exit(1);
  }

  const resolvedPaths = args.map((arg) => path.resolve(arg));

  let hasError = false;
  for (const filePath of resolvedPaths) {
    if (!validateFile(filePath)) {
      hasError = true;
    }
  }

  if (hasError) {
    process.exit(1);
  }

  const fileCount = resolvedPaths.length;
  const message =
    fileCount === 1
      ? `検証成功: ${resolvedPaths[0]} は有効です`
      : `検証完了: ${fileCount} ファイルすべて有効です`;
  console.log(message);
}

if (require.main === module) {
  main(process.argv);
}
