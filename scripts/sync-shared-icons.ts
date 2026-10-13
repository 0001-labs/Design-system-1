import './sync-globe.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const ezo = new URL('../../Ezo/', import.meta.url);
const mapFile = new URL('client/design/2-core/generated/ds-icon-map.ts', ezo);
let map = await readFile(mapFile, 'utf8');
for (const name of ['duplicate']) {
  const svg = (await readFile(new URL(`../DS1/x-icon/${name}.svg`, import.meta.url), 'utf8')).trim();
  const pattern = new RegExp(`(^\\s*"${name}":\\s*)("(?:[^"\\\\]|\\\\.)*")`, 'm');
  if (!pattern.test(map)) throw new Error(`Ezo does not register ${name}`);
  map = map.replace(pattern, (_match, prefix) => prefix + JSON.stringify(svg));
}
await writeFile(mapFile, map);
const duplicate = await readFile(new URL('../DS1/x-icon/duplicate.svg', import.meta.url), 'utf8');
await writeFile(new URL('client/assets/note-menu/duplicate.svg', ezo), duplicate);
await writeFile(new URL('../../Aa/src/icons/duplicate.svg', import.meta.url), duplicate);
execFileSync('vp', ['exec', 'tsx', 'scripts/generate-icon-parts.ts'], { cwd: ezo, stdio: 'inherit' });
execFileSync('vp', ['run', 'sync-aa'], { cwd: ezo, stdio: 'inherit' });
console.log('Synced Globe and Duplicate into Ezo, and Duplicate into Aa and Ezo’s Aa snapshot.');
