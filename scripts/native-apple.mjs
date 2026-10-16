/**
 * The Swift package in native/apple, as one folder: its handwritten and generated
 * sources, and the resources laid out from their canonical files in DS1/ (the icons
 * into an asset catalogue, the typefaces as the same woff2 files the web loads, which
 * Core Text reads). Sync 1's `swift` export and scripts/write-native-tokens.ts both
 * lay it out with `applePackage`, so a product's copy and the local build match.
 */
import { posix } from 'node:path';

/** The typefaces the package can carry, by the file names the web uses. */
export const appleFonts = {
  'Inter-Arrows.woff2': 'DS1/1-root/fonts/Inter-Arrows.woff2',
  'Iosevka-Regular.woff2': 'DS1/1-root/fonts/Iosevka-Regular.woff2',
  'GT-America-Standard-Regular.woff2': 'DS1/1-root/fonts/GT-America-Standard-Regular.woff2',
  'GT-America-Standard-Medium.woff2': 'DS1/1-root/fonts/GT-America-Standard-Medium.woff2',
  'GT-America-Compressed-Regular.woff2': 'DS1/1-root/fonts/GT-America-Compressed-Regular.woff2',
  'OlivettiDot-Regular.woff2': 'website/src/assets/fonts/OlivettiDot-Regular.woff2',
};
/** Faces that may be redistributed travel always; arrows are Inter in every typeface. */
export const appleFontsAlways = ['Inter-Arrows.woff2', 'Iosevka-Regular.woff2'];
const licences = {
  'Inter-LICENSE.md': 'DS1/1-root/fonts/Inter-LICENSE.md',
  'Iosevka-LICENSE.md': 'DS1/1-root/fonts/Iosevka-LICENSE.md',
  'Tabler-LICENSE.md': 'DS1/x-icon/Tabler-LICENSE.md',
};

const resources = 'Sources/DS1/Resources';
const json = value => JSON.stringify(value, null, 2) + '\n';

/**
 * The icon names in DS1/x-icon, sorted.
 * @param {(path: string, filter?: { only?: RegExp }) => Map<string, Buffer>} tree
 */
export function iconNames(tree) {
  return [...tree('DS1/x-icon', { only: /^[^/]+\.svg$/ }).keys()].map(file => file.slice(0, -4)).sort();
}

/**
 * Every file of the package, keyed by its path inside native/apple. `fonts` names the
 * faces to carry besides the ones that always travel; `sources` is false for the
 * resources alone (the local build, whose sources are committed).
 *
 * @param {{ read: (path: string) => Buffer, tree: (path: string, filter?: { only?: RegExp, skip?: RegExp }) => Map<string, Buffer>, fonts?: string[], sources?: boolean }} context
 * @returns {Map<string, Buffer | string>}
 */
export function applePackage({ read, tree, fonts = [], sources = true }) {
  const files = new Map();
  if (sources)
    for (const [file, content] of tree('native/apple', { skip: /(^|\/)(\.build|\.swiftpm|Resources|Licences)(\/|$)|(^|\/)(\.gitignore|\.DS_Store)$/ })) files.set(file, content);
  for (const name of new Set([...appleFontsAlways, ...fonts])) {
    if (!Object.hasOwn(appleFonts, name)) throw new Error(`Unknown font for the Swift package: ${name}`);
    files.set(`${resources}/Fonts/${name}`, read(appleFonts[name]));
  }
  for (const [name, path] of Object.entries(licences)) files.set(`Licences/${name}`, read(path));
  const catalogue = `${resources}/Icons.xcassets`;
  files.set(`${catalogue}/Contents.json`, json({ info: { author: 'xcode', version: 1 } }));
  for (const name of iconNames(tree)) {
    files.set(posix.join(catalogue, `${name}.imageset`, `${name}.svg`), read(`DS1/x-icon/${name}.svg`));
    files.set(
      posix.join(catalogue, `${name}.imageset`, 'Contents.json'),
      json({
        images: [{ filename: `${name}.svg`, idiom: 'universal' }],
        info: { author: 'xcode', version: 1 },
        properties: { 'preserves-vector-representation': true, 'template-rendering-intent': 'template' },
      }),
    );
  }
  return files;
}
