import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, relative } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const studio = process.env.DS1_PRODUCT_STUDIO ?? resolve(root, '..');
const destination = resolve(root, 'DS1/x-icon');
const checkOnly = process.argv.includes('--check');
// Where each drawing came from. It names product folders, so it stays with
// the scripts, outside the published package.
const manifestFile = resolve(root, 'scripts/product-icon-sources.json');
const previous = JSON.parse(await readFile(manifestFile, 'utf8').catch(() => '[]')) as Source[];
interface Source { product: string; source: string; name: string; sourceHash: string; iconHash: string; }
const sources: Source[] = [];
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const names = new Set((await readdir(destination)).filter(file => file.endsWith('.svg')).map(file => file.slice(0, -4)));

function normalize(raw: string): string {
  const ownColours = [...raw.matchAll(/(?:fill|stroke)=("|')([^"']+)\1/gi)]
    .some(match => !/^(none|currentColor|white|#fff|#ffffff|#1e1e1e|#2a2a2a|#000000|#000|black)$/i.test(match[2]));
  let svg = raw.trim();
  if (!ownColours) {
    svg = svg.replace(/(fill|stroke)=("|')(#1e1e1e|#2a2a2a|#000000|#000|black)\2/gi, '$1="currentColor"');
    svg = svg.replace(/var\(--(?:fill|stroke)-\d+,\s*(?:#1e1e1e|#2a2a2a|black)\)/gi, 'currentColor');
  }
  if (!/\bxmlns=/.test(svg.split('>')[0])) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  const bounds = svg.match(/viewBox="([^"]+)"/)?.[1];
  if (!bounds) throw new Error('An imported icon has no viewBox');
  if (bounds !== '0 0 16 16') {
    svg = svg.replace(/\bwidth="[^"]*"/, 'width="16"').replace(/\bheight="[^"]*"/, 'height="16"');
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">${svg}</svg>`;
  }
  if (/<(?:script|foreignObject|image|iframe)\b|\bon[a-z]+\s*=|(?:href|src)\s*=/i.test(svg)) throw new Error('Only self-contained icon geometry can be imported');
  return svg + '\n';
}

const compact = (svg: string) => svg.replace(/\s+/g, '');
async function add(product: string, source: string, desired: string, raw: string, canonical = false) {
  const name = desired;
  // A drawing named after its product is the product's own and stays there.
  if (name.startsWith(`${product.toLowerCase()}-`)) return;
  const svg = normalize(raw);
  if (names.has(name)) {
    const current = await readFile(resolve(destination, name + '.svg'), 'utf8');
    // A product's variant of a library drawing stays in the product too.
    if (!canonical && !name.startsWith('badge-') && compact(normalize(current)) !== compact(svg)) return;
  }
  if (!checkOnly && !canonical) {
    const current = await readFile(resolve(destination, name + '.svg'), 'utf8').catch(() => null);
    // Keep an installed canonical drawing when the product uses the same
    // geometry; only badges are refreshed in place.
    if (!current || name.startsWith('badge-')) {
      await writeFile(resolve(destination, name + '.svg'), svg);
    }
  }
  names.add(name);
  const installed = await readFile(resolve(destination, name + '.svg'), 'utf8');
  sources.push({ product, source, name, sourceHash: hash(raw), iconHash: hash(installed) });
}

const ezo = resolve(studio, 'Ezo');
const runtime = await readFile(resolve(ezo, 'client/design/2-core/generated/ds-icon-map.ts'), 'utf8');
for (const match of runtime.matchAll(/^\s*"([^"\n]+)":\s*("(?:[^"\\]|\\.)*")/gm)) {
  await add('Ezo', `client/design/2-core/generated/ds-icon-map.ts#${match[1]}`, match[1], JSON.parse(match[2]), ['duplicate', 'globe'].includes(match[1]));
}

async function folder(product: string, directory: string, prefix: string) {
  for (const file of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, file.name);
    if (file.isDirectory()) await folder(product, path, `${prefix}${file.name.toLowerCase()}-`);
    else if (file.name.endsWith('.svg')) await add(product, relative(resolve(studio, product), path), prefix + file.name.slice(0, -4).toLowerCase(), await readFile(path, 'utf8'), product === 'Aa' && file.name === 'duplicate.svg');
  }
}
await folder('Aa', resolve(studio, 'Aa/src/icons'), '');

const badges = await import(pathToFileURL(resolve(ezo, 'shared/gridIconFigma.ts')).href);
const grid = await import(pathToFileURL(resolve(ezo, 'shared/gridIcon.ts')).href);
const boxes = await import(pathToFileURL(resolve(ezo, 'shared/gridIcon3d.ts')).href);
for (const badge of badges.FIGMA_ICONS) {
  await add('Ezo', `shared/gridIconFigma.ts#${badge.key}`, `badge-${badge.key}`, grid.iconSvg(badge.icon, { size: 16, id: badge.key }));
  await add('Ezo', `shared/gridIconFigma.ts#3d:${badge.key}`, `badge-${badge.key}-3d`, boxes.icon3dSvg(badge.icon, { size: 16, id: badge.key + '-3d' }));
}

// Multiple product sources may resolve to one drawing. Hash its final form
// after every source has been processed, not an intermediate import.
for (const source of sources) {
  source.iconHash = hash(await readFile(resolve(destination, source.name + '.svg'), 'utf8'));
}

if (checkOnly) {
  if (JSON.stringify(previous) !== JSON.stringify(sources)) throw new Error('Product icons have changed. Run vp run icons:sync-products and review the additions.');
} else await writeFile(manifestFile, JSON.stringify(sources, null, 2) + '\n');
console.log(`${checkOnly ? 'Verified' : 'Imported'} ${sources.length} product icon sources; ${new Set(sources.map(source => source.name)).size} library drawings.`);
