const fs = require('fs');
const path = require('path');
const datasetsDir = path.resolve(__dirname, 'datasets');
const files = fs.readdirSync(datasetsDir).filter(f => f.endsWith('.json'));
const defaultDatasets = files.map(file => {
  return JSON.parse(fs.readFileSync(path.join(datasetsDir, file), 'utf8')).id;
});
console.log(defaultDatasets);
