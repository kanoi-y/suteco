const fs = require('node:fs');
const path = require('node:path');
const datasetsDir = path.resolve(__dirname, 'datasets');
const files = fs.readdirSync(datasetsDir).filter((f: string) => f.endsWith('.json'));
const defaultDatasets = files.map((file: string) => {
  return JSON.parse(fs.readFileSync(path.join(datasetsDir, file), 'utf8')).id;
});
console.log(defaultDatasets);
