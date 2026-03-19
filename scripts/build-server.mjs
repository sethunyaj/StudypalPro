import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

mkdirSync(distDir, { recursive: true });

execSync(
  'esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js',
  { stdio: 'inherit' }
);

const wrapper = `const { pathToFileURL } = require('url');
const path = require('path');
import(pathToFileURL(path.join(__dirname, 'index.js')).href).catch(console.error);
`;

writeFileSync(join(distDir, 'index.cjs'), wrapper);
console.log('Created dist/index.cjs -> loads dist/index.js (ESM)');
