/**
 * Copies shared components into a product the old way, for the products not
 * yet on Sync 1 (`sync1`, which reads sync.exports.mjs). Retire it once they
 * have all moved; the graph itself is scripts/component-graph.mjs.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { componentGraph } from './component-graph.mjs';

const source = fileURLToPath(new URL('../DS1/', import.meta.url));
const args = process.argv.slice(2);
const option = name => args[args.indexOf(name) + 1];
if (!args.includes('--target') || !args.includes('--components')) {
  throw new Error('Usage: node scripts/sync-components.mjs --target <directory> --components button,text,… [--check]');
}
const target = resolve(option('--target'));
if (target === resolve(source) || source.startsWith(target + '/') || target.startsWith(source)) throw new Error('The target must be a consumer snapshot.');
const { components, files } = componentGraph(source, option('--components').split(','));
const sha = content => createHash('sha256').update(content).digest('hex');
const hashes = Object.fromEntries([...files].sort(([a], [b]) => a.localeCompare(b)).map(([file, content]) => [file, sha(content)]));
const manifestPath = join(target, 'components-manifest.json');
const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : null;
const changed = [...files].filter(([file, content]) => !existsSync(join(target, file)) || readFileSync(join(target, file), 'utf8') !== content).map(([file]) => file);
const removed = Object.keys(previous?.files ?? {}).filter(file => !files.has(file));
if (args.includes('--check')) {
  if (changed.length || removed.length || JSON.stringify(previous?.files) !== JSON.stringify(hashes)) {
    throw new Error(`Component snapshot differs: ${[...changed, ...removed].join(', ') || 'manifest'}`);
  }
  console.log(`Verified ${components.length} shared components (${files.size} files) in ${target}`);
} else {
  for (const file of removed) {
    const path = resolve(target, file);
    if (!path.startsWith(target + '/')) throw new Error(`Invalid old manifest path: ${file}`);
    rmSync(path, { force: true });
  }
  for (const [file, content] of files) {
    const path = join(target, file);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: source, encoding: 'utf8' }).trim();
  writeFileSync(manifestPath, JSON.stringify({ source: 'Design system 1/DS1', commit, components, files: hashes }, null, 2) + '\n');
  console.log(`Synced ${components.length} shared components (${files.size} files) into ${target}`);
}
