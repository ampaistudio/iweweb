import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoots = ['src', 'admin-panel/src'];
const forbidden = [
  /i-wildland\.com/i,
  /isardwildland/i,
  /\+?376\s*653\s*769/,
  /DEFAULT_SITE_CONTENT|DEFAULT_HERO_SLIDES|staticActivities/,
];
const exceptions = new Set(['src/pages/Privacy.tsx']);
const errors = [];

function visit(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      visit(fullPath);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    const name = relative(root, fullPath);
    if (exceptions.has(name)) continue;
    const source = readFileSync(fullPath, 'utf8');
    if (forbidden.some((pattern) => pattern.test(source))) errors.push(name);
    if (name.startsWith('src/data/') && /export\s+const\s+\w+\s*=\s*\[/.test(source)) {
      errors.push(`${name}: exported data array`);
    }
  }
}

for (const directory of sourceRoots) visit(join(root, directory));
if (errors.length) {
  console.error('Hardcoding Zero: revisar ' + [...new Set(errors)].join(', '));
  process.exitCode = 1;
}
