const fs = require('fs');
const path = require('path');
const { resolveRuntimeEnvironment } = require('./database-safety');
const ROOT = path.resolve(__dirname, '..');

function loadEnvironment() {
  const environment = resolveRuntimeEnvironment();
  process.env.NODE_ENV = environment;
  const file = (environment === 'production' ? ['.env.production','.env'] : ['.env.local','.env']).find(file => fs.existsSync(path.join(ROOT,file)));
  if (file) require('dotenv').config({ path: path.join(ROOT,file), override: false });
  return environment;
}
module.exports = { loadEnvironment };
