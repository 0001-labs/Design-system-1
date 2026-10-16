// Writes the Swift package's generated files (scripts/native-tokens.ts) and lays out its
// resources (scripts/native-apple.mjs) for building and testing it here. The resources are
// not committed: products receive them through Sync 1's `swift` export.
// Run: vp run native:tokens
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appleTokenFiles } from './native-tokens';
import { appleFonts, applePackage } from './native-apple.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const write = (path: string, content: string | Buffer) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
};

for (const [path, content] of Object.entries(appleTokenFiles())) write(path, content);

const walk = (dir: string, base = ''): string[] =>
  readdirSync(join(dir, base)).flatMap(name => {
    const rel = base ? `${base}/${name}` : name;
    return statSync(join(dir, rel)).isDirectory() ? walk(dir, rel) : [rel];
  });
const tree = (rel: string, { only, skip }: { only?: RegExp; skip?: RegExp } = {}) =>
  new Map(walk(join(root, rel)).filter(f => (!only || only.test(f)) && !(skip && skip.test(f))).map(f => [f, readFileSync(join(root, rel, f))]));
const read = (rel: string) => readFileSync(join(root, rel));

rmSync(join(root, 'native/apple/Sources/DS1/Resources'), { recursive: true, force: true });
rmSync(join(root, 'native/apple/Licences'), { recursive: true, force: true });
const resources = applePackage({ read, tree, fonts: Object.keys(appleFonts), sources: false });
for (const [path, content] of resources) write(`native/apple/${path}`, content);
console.log(`Swift package: ${Object.keys(appleTokenFiles()).length} generated files, ${resources.size} resources`);
