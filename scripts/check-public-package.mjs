/** Inspect the actual package, including compiled modules left by previous builds. */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const directory = mkdtempSync(join(tmpdir(), 'ds1-package-'));
try {
  execFileSync('pnpm', ['pack', '--pack-destination', directory], { stdio: 'pipe' });
  const archive = join(directory, readdirSync(directory).find(file => file.endsWith('.tgz')));
  const files = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' }).trim().split('\n');
  const internal = /(?:ds-(?:kbd|loading|spacing-handle)|\/react\/(?:kbd|loading|spacing-handle)\.|\/spacing-handle\.|\/kbd\.css|packages\/app|\/app\/src|\/website\/)/;
  const leaked = files.filter(file => internal.test(file));
  if (leaked.length) throw new Error(`Internal App files in public package: ${leaked.join(', ')}`);
  for (const file of files.filter(file => /bundle.*\.js$/.test(file))) {
    const source = execFileSync('tar', ['-xOzf', archive, file], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    if (/ds-(?:kbd|loading|spacing-handle)/.test(source)) throw new Error(`Internal App control bundled in ${file}`);
  }
  if (!files.includes('package/dist/design-system-1.bundle.js')) throw new Error('Build the public package before checking it.');
  console.log(`Public package checked: ${files.length} files; no internal App controls.`);
} finally { rmSync(directory, { recursive: true, force: true }); }
