import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, relative } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const studio = process.env.DS1_PRODUCT_STUDIO ?? resolve(root, '..');
const destination = resolve(root, 'DS1/x-icon');
const checkOnly = process.argv.includes('--check');
const manifestFile = resolve(destination, 'product-sources.json');
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
  const svg = normalize(raw);
  let name = desired;
  if (names.has(name)) {
    const current = await readFile(resolve(destination, name + '.svg'), 'utf8');
    if (!canonical && !desired.startsWith('ezo-') && !desired.startsWith('badge-') && compact(normalize(current)) !== compact(svg)) name = `${product.toLowerCase()}-${desired}`;
  }
  if (!checkOnly && !canonical) {
    const current = await readFile(resolve(destination, name + '.svg'), 'utf8').catch(() => null);
    // Keep an installed canonical drawing when the product uses the same
    // geometry; only imported variants and badges are refreshed in place.
    if (!current || name.startsWith('ezo-') || name.startsWith('aa-') || name.startsWith('badge-')) {
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
await folder('Ezo', resolve(ezo, 'client/assets'), 'ezo-');
await folder('Ezo', resolve(ezo, 'client/public/icons/settings'), 'ezo-setting-');
await add('Ezo', 'client/public/icons/arrow-cursor.svg', 'ezo-arrow-cursor', await readFile(resolve(ezo, 'client/public/icons/arrow-cursor.svg'), 'utf8'));
await folder('Ezo', resolve(ezo, 'android/shared/src/main/resources/screen-icons'), 'ezo-android-');

// Static UI glyphs which have not yet been moved out of product source.
for (const [file, keys] of [
  ['client/app/pages/templates.ts', ['ezo-store-chevron']],
  ['client/components/ezo-createaccount.ts', ['ezo-account-close']],
  ['client/design/3-unit/ezo-accordion.ts', ['ezo-accordion-chevron']],
  ['client/react/DatabaseBoard.tsx', ['ezo-move-column', 'ezo-move-row']],
] as const) {
  const code = await readFile(resolve(ezo, file), 'utf8');
  const drawings = [...code.matchAll(/<svg\b[\s\S]*?<\/svg>/g)];
  for (let index = 0; index < keys.length; index++) {
    const raw = drawings[index]?.[0].replace(/className="[^"]*"/g, '').replace(/strokeWidth=/g, 'stroke-width=');
    if (!raw) throw new Error(`Missing inline icon in ${file}`);
    await add('Ezo', `${file}#${index}`, keys[index], raw);
  }
}

const badges = await import(pathToFileURL(resolve(ezo, 'shared/gridIconFigma.ts')).href);
const grid = await import(pathToFileURL(resolve(ezo, 'shared/gridIcon.ts')).href);
const boxes = await import(pathToFileURL(resolve(ezo, 'shared/gridIcon3d.ts')).href);
const cube = await import(pathToFileURL(resolve(ezo, 'shared/isoCube.ts')).href);
for (const badge of badges.FIGMA_ICONS) {
  await add('Ezo', `shared/gridIconFigma.ts#${badge.key}`, `badge-${badge.key}`, grid.iconSvg(badge.icon, { size: 16, id: badge.key }));
  await add('Ezo', `shared/gridIconFigma.ts#3d:${badge.key}`, `badge-${badge.key}-3d`, boxes.icon3dSvg(badge.icon, { size: 16, id: badge.key + '-3d' }));
}
const size = (boxes.ICON_3D_FRAME - 2) / Math.SQRT2;
const top = (-3 * size) / Math.sqrt(6);
const tall = (4 * size) / Math.sqrt(6);
await add('Ezo', 'shared/isoCube.ts#logo', 'ezo-logo', cube.ezoCubeSvg({ size, stroke: 1, frame: { x: -1.5, y: top + tall / 2 - boxes.ICON_3D_FRAME * boxes.ICON_3D_TALL / 2, width: boxes.ICON_3D_FRAME, height: boxes.ICON_3D_FRAME * boxes.ICON_3D_TALL } }));

// Multiple product sources may resolve to one drawing. Hash its final form
// after every source has been processed, not an intermediate import.
for (const source of sources) {
  source.iconHash = hash(await readFile(resolve(destination, source.name + '.svg'), 'utf8'));
}

if (checkOnly) {
  if (JSON.stringify(previous) !== JSON.stringify(sources)) throw new Error('Product icons have changed. Run vp run icons:sync-products and review the additions.');
} else await writeFile(manifestFile, JSON.stringify(sources, null, 2) + '\n');
console.log(`${checkOnly ? 'Verified' : 'Imported'} ${sources.length} Ezo and Aa icon sources; ${new Set(sources.map(source => source.name)).size} library drawings.`);
