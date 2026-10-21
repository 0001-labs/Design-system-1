/**
 * Writes DS1/x-flag/ from country-flag-icons' 3:2 drawings: every flag by its
 * code in lower case (`ie.svg`, `gb-sct.svg`), framed thirty by twenty so an
 * `<img>` has the flag's own size, its drawing untouched. Japan's is Ezo's
 * (the disc three-fifths of the height, the 1999 law), the flag the set is
 * drawn after. The user-assigned codes the package gives disputed regions
 * (XA, XC, XO) are left out; Kosovo's XK stays, as Cloudflare places
 * addresses there.
 *
 *   npm pack country-flag-icons@<version> && tar xzf country-flag-icons-*.tgz
 *   node scripts/import-flags.mjs package/3x2 <version>
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [from, version] = process.argv.slice(2);
if (!from || !version) throw new Error('Usage: node scripts/import-flags.mjs <country-flag-icons/3x2> <version>');

const to = fileURLToPath(new URL('../DS1/x-flag/', import.meta.url));
const LEFT_OUT = new Set(['XA', 'XC', 'XO']);
const JAPAN = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="20" viewBox="0 0 30 20"><path fill="#fff" d="M0 0h30v20H0z"/><circle cx="15" cy="10" r="6" fill="#bc002d"/></svg>\n';
const unsafe = /<script|<image|<foreignObject|https?:\/\/(?!www\.w3\.org\/)|@import|\son[a-z]+=/i;

rmSync(to, { recursive: true, force: true });
mkdirSync(to, { recursive: true });
const codes = [];
for (const file of readdirSync(from).filter(name => name.endsWith('.svg')).sort()) {
  const code = file.slice(0, -4);
  if (LEFT_OUT.has(code)) continue;
  const svg = readFileSync(join(from, file), 'utf8').trim();
  if (unsafe.test(svg)) throw new Error(`${file} draws more than a flag`);
  const box = svg.match(/viewBox="([^"]+)"/)?.[1].split(/\s+/).map(Number);
  if (!box || Math.abs(box[2] / box[3] - 1.5) > 0.01) throw new Error(`${file} is not 3:2`);
  const name = code.toLowerCase();
  writeFileSync(join(to, `${name}.svg`), name === 'jp' ? JAPAN : svg.replace('<svg ', '<svg width="30" height="20" ') + '\n');
  codes.push(name);
}
writeFileSync(join(to, 'LICENSE.md'), `# Flags

Drawn by country-flag-icons ${version} (https://gitlab.com/catamphetamine/country-flag-icons), 3:2, under the MIT licence below; Japan's is Ezo's own drawing. \`scripts/import-flags.mjs\` writes this folder.

${readFileSync(join(from, '..', 'LICENSE'), 'utf8').trim()}
`);
console.log(`${codes.length} flags in DS1/x-flag/`);
