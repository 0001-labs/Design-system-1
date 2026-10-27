/** Package only the private System app, data and previews. The public site has its own release. */
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const report = JSON.parse(await readFile('website/dist/system-data/examples.json', 'utf8'));
if (report.schema !== 1 || !report.examples.length || report.examples.some(example => example.errors.length)) throw new Error('Generate a complete System example snapshot before packaging.');
await rm('.system-dist', { recursive: true, force: true });
await mkdir('.system-dist/icons', { recursive: true });
for (const folder of ['app', 'system-data', 'system-previews']) await cp(`website/dist/${folder}`, `.system-dist/${folder}`, { recursive: true });
await cp('website/public/icons/design-system-1.svg', '.system-dist/icons/design-system-1.svg');
await writeFile('.system-dist/system-data/revision.json', JSON.stringify({ revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() }));
