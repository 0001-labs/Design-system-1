import { afterEach, expect, it } from 'vite-plus/test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { rootConnections, historicalSource } from '../scripts/root-adoption';
import { IMPLEMENTATION_COLUMNS, type ComponentCell } from '../shared/component-adoption';
const dirs: string[] = [];
afterEach(() => dirs.splice(0).forEach(dir => rmSync(dir, { recursive: true, force: true })));
const git = (root: string, ...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const write = (root: string, path: string, value: string) => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), value); };
function fixture(nested = false) {
  const dir = mkdtempSync(join(tmpdir(), 'root-adoption-')); dirs.push(dir);
  const ds = nested ? join(dir, 'Foundation') : dir;
  mkdirSync(ds, { recursive: true }); git(dir, 'init', '-b', 'main');
  const sheets = { 'one.css': '@import "./fonts.css";\n@import "./palette.css";', 'fonts.css': ':root { --typeface: sans-serif; }', 'palette.css': ':root { --blue: blue; }' };
  for (const [name, body] of Object.entries(sheets)) write(ds, `DS1/1-root/${name}`, body);
  git(dir, 'add', '.'); git(dir, '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'Foundation');
  const commit = git(dir, 'rev-parse', 'HEAD'), app = join(dir, 'App');
  for (const [name, body] of Object.entries(sheets)) write(app, `src/ds1/${name}`, body);
  write(app, 'sync.lock.json', JSON.stringify({ 'Design system 1': { commit, files: Object.fromEntries(Object.entries(sheets).map(([name, body]) => [`src/ds1/${name}`, createHash('sha256').update(body).digest('hex')])) } }));
  const cells = () => Object.fromEntries(IMPLEMENTATION_COLUMNS.map(c => [c.id, { shared: 0, styled: 0, local: 0, unverified: 0, sites: [], snapshot: 'none', current: null, issues: [] } as ComponentCell]));
  return { ds, app, commit, cells };
}
it('counts each authored stylesheet connection and its Root dependencies with source lines', () => {
  const { ds, app, cells } = fixture(); const result = cells();
  rootConnections(app, ds)('src/main.ts', '\nimport "./ds1/one.css";', result);
  for (const id of ['root-styling', 'root-colours', 'root-fonts']) {
    expect(result[id]).toMatchObject({ styled: 1, unverified: 0 });
    expect(result[id]!.sites[0]).toMatchObject({ line: 2, file: 'src/main.ts', tag: './ds1/one.css' });
  }
});
it('does not verify modified or unrelated stylesheets', () => {
  const { ds, app, cells } = fixture(); const result = cells();
  write(app, 'src/ds1/fonts.css', 'changed'); write(app, 'src/fonts.css', 'local');
  rootConnections(app, ds)('src/main.ts', 'import "./ds1/one.css";\nimport "./fonts.css";', result);
  expect(result['root-fonts']).toMatchObject({ styled: 0, unverified: 1 });
  expect(result['root-styling']).toMatchObject({ styled: 1 });
});
it('verifies foundation history in a studio repository too', () => {
  const { ds, app, commit, cells } = fixture(true); const result = cells();
  expect(historicalSource(ds, commit, 'DS1/1-root/one.css')).toBeDefined();
  rootConnections(app, ds)('src/main.css', '@import "./ds1/one.css";', result);
  expect(result['root-styling']).toMatchObject({ styled: 1, unverified: 0 });
});

it('ignores commented imports and source examples', () => {
  const { ds, app, cells } = fixture(); const result = cells();
  rootConnections(app, ds)('src/main.ts', `// import "./ds1/one.css";
const example = 'import "./ds1/one.css";';`, result);
  expect(result['root-styling']!.sites).toEqual([]);
});

it('does not count copied stylesheet internals as authored connections', () => {
  const { ds, app, cells } = fixture(); const result = cells();
  rootConnections(app, ds)('src/ds1/one.css', '@import "./fonts.css";', result);
  expect(result['root-fonts']!.sites).toEqual([]);
});

it('verifies module imports and their dependencies from a recorded source revision', () => {
  const { ds, app, cells } = fixture(true);
  const modules = { 'preferences.ts': 'import "./theme"; export const preferences = {};', 'theme.ts': 'export const theme = "system";' };
  for (const [name, body] of Object.entries(modules)) write(ds, `DS1/0-face/${name}`, body);
  git(ds, 'add', '.'); git(ds, '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'Add modules');
  const commit = git(ds, 'rev-parse', 'HEAD');
  for (const [name, body] of Object.entries(modules)) write(app, `src/ds1/${name}`, body);
  write(app, 'sync.lock.json', JSON.stringify({ 'Design system 1': { commit, files: Object.fromEntries(Object.entries(modules).map(([name, body]) => [`src/ds1/${name}`, createHash('sha256').update(body).digest('hex')])) } }));
  const result = cells();
  rootConnections(app, ds)('src/main.ts', 'import "./ds1/preferences";', result);
  expect(result['root-preferences']).toMatchObject({ styled: 1, unverified: 0 });
  expect(result['root-theming']).toMatchObject({ styled: 1, unverified: 0 });
  write(app, 'src/ds1/theme.ts', 'export const theme = "changed";');
  const changed = cells();
  rootConnections(app, ds)('src/main.ts', 'import "./ds1/preferences";', changed);
  expect(changed['root-theming']).toMatchObject({ styled: 0, unverified: 1 });
});
it('does not classify unrelated product modules with matching filenames', () => {
  const { ds, app, cells } = fixture(); const result = cells();
  write(app, 'src/theme.ts', 'export const theme = "local";');
  rootConnections(app, ds)('src/main.ts', 'import "./theme";', result);
  expect(result['root-theming']!.sites).toEqual([]);
});
