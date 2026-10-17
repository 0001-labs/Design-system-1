import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vite-plus/test';
import config from '../sync.exports.mjs';

const root = join(import.meta.dirname, '..');
const read = (path: string) => readFileSync(join(root, path), path.endsWith('.woff2') ? undefined : 'utf8');
type Exported = { files(context: { read: typeof read; options: Record<string, unknown> }): Record<string, unknown> | Map<string, unknown> };
const exports = config.exports as unknown as Record<string, Exported>;
const files = (name: string, options: Record<string, unknown> = {}) => {
  const result = exports[name].files({ read, options });
  return result instanceof Map ? Object.fromEntries(result) : result;
};

test('the root export carries one.css, what it imports and every face it loads', () => {
  const copy = files('root');
  for (const file of ['one.css', 'grid.css', 'text.css', 'component-tokens.css', 'component-metrics.css', 'component-appearance.css', 'fonts.css', 'palette.css']) expect(copy).toHaveProperty([file]);
  const imported = [...String(copy['one.css']).matchAll(/@import "\.\/([^"]+)";/g)].map((match) => match[1]!);
  for (const file of imported) expect(copy).toHaveProperty([file]);
  const faces = ['one.css', ...imported].flatMap((file) => [...String(copy[file]).matchAll(/url\("\.\/(fonts\/[^"]+)"\)/g)].map((match) => match[1]));
  expect(faces).toContain('fonts/Iosevka-Regular.woff2');
  for (const face of faces) expect(copy).toHaveProperty([face!]);
  expect(copy).not.toHaveProperty(['controls.css']);
  expect(copy).not.toHaveProperty(['cjk.css']);
});

test('one.css always arrives with the faces and the palette it imports', () => {
  expect(Object.keys(files('root', { styles: ['one.css', 'grid.css'], fonts: false }))).toEqual(['one.css', 'grid.css', 'text.css', 'fonts.css', 'palette.css']);
});

test('fonts.css travels on its own: through root with its faces in fonts/, or through fonts beside them', () => {
  const root = files('root', { styles: ['fonts.css'] });
  expect(Object.keys(root)).toEqual(['fonts.css', ...['GT-America-Standard-Regular.woff2', 'GT-America-Standard-Medium.woff2', 'GT-America-Compressed-Regular.woff2', 'GT-Canon-M-Standard-Medium-Trial.woff2', 'Inter-Arrows.woff2', 'Iosevka-Regular.woff2', 'Inter-LICENSE.md', 'Iosevka-LICENSE.md'].map((font) => `fonts/${font}`)]);
  const flat = files('fonts', { stylesheet: true });
  const css = String(flat['fonts.css']);
  expect(css).not.toContain('./fonts/');
  const urls = [...css.matchAll(/url\("\.\/([^"]+)"\)/g)].map((match) => match[1]!);
  expect(urls).toContain('Iosevka-Regular.woff2');
  for (const url of urls) expect(flat).toHaveProperty([url]);
  expect(css).toContain('--typeface-mono:');
  // Named faces with the stylesheet: those, and always the arrows and the code face with their licences.
  expect(Object.keys(files('fonts', { stylesheet: true, fonts: ['GT-America-Standard-Regular.woff2', 'Iosevka-Regular.woff2'] }))).toEqual(['GT-America-Standard-Regular.woff2', 'Iosevka-Regular.woff2', 'Inter-Arrows.woff2', 'Inter-LICENSE.md', 'Iosevka-LICENSE.md', 'fonts.css']);
  expect(() => files('fonts')).toThrow(/Name the fonts/);
});

test('the tokens export carries the palette, and Noto Sans only when asked for', () => {
  expect(Object.keys(files('tokens'))).toEqual(['component-tokens.css', 'component-metrics.css', 'component-appearance.css', 'palette.css']);
  expect(String(files('tokens', { bundle: true })['bundle.css'])).toContain('--one-purple: light-dark(');
  expect(files('root', { cjk: true, fonts: false })).toHaveProperty(['cjk.css']);
  expect(Object.keys(files('root', { styles: ['cjk.css'], fonts: false }))).toEqual(['cjk.css']);
  const bundle = String(files('tokens', { cjk: true, bundle: true })['bundle.css']);
  // A stylesheet from another host is imported before any rule, or the browser drops it.
  const firstRule = bundle.search(/^[^@/\s*][^\n]*{/m);
  expect(bundle.indexOf('@import url("https://fonts.googleapis.com')).toBeGreaterThan(0);
  expect(bundle.lastIndexOf('@import url(')).toBeLessThan(firstRule);
});

test('the root export can leave the faces to the product and add controls and page scripts', () => {
  const copy = files('root', { fonts: false, nativeControls: true, modules: ['grid', 'tooltips'] });
  expect(Object.keys(copy).some((file) => file.startsWith('fonts/'))).toBe(false);
  expect(copy).toHaveProperty(['controls.css']);
  expect(copy).toHaveProperty(['table.css']);
  for (const file of ['0-face/grid.ts', '0-face/layout-inspector.ts', '0-face/grid-fit.ts', '0-face/tooltips.ts']) expect(copy).toHaveProperty([file]);
  expect(() => files('root', { modules: ['nothing'] })).toThrow(/Unknown page script/);
});

test('every root page script travels with what it imports', () => {
  const modules = ['grid', 'grid-fit', 'layout-inspector', 'scaling', 'theme', 'theme-bootstrap', 'tooltips', 'tree'];
  for (const name of modules) {
    const copy = files('root', { styles: [], fonts: false, modules: [name] });
    for (const [file, content] of Object.entries(copy)) {
      for (const [, path] of String(content).matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|^\s*import\s*)["'](\.\/[^"']+)["']/gm)) {
        const base = join('0-face', path!.slice(2));
        expect([base, `${base}.ts`].some((candidate) => candidate in copy), `${name}: ${file} imports ${path}`).toBe(true);
      }
    }
  }
  expect(Object.keys(files('root', { styles: [], fonts: false, modules: ['theme'] }))).toEqual(['0-face/theme.ts', '0-face/theme-bootstrap.js', '0-face/preference-options.ts']);
  expect(Object.keys(files('root', { styles: [], fonts: false, modules: ['tree'] }))).toEqual(['0-face/tree.ts']);
});

test('scriptsTo puts the page scripts apart from the stylesheets', () => {
  const copy = files('root', { styles: ['grid.css'], fonts: false, modules: ['scaling', 'tooltips'], scriptsTo: '../../src/ds1' });
  expect(Object.keys(copy)).toEqual(['grid.css', '../../src/ds1/0-face/scaling.ts', '../../src/ds1/0-face/tooltips.ts']);
  expect(Object.keys(files('root', { styles: [], fonts: false, modules: ['scaling'], scriptsTo: 'scripts' }))).toEqual(['scripts/0-face/scaling.ts']);
  // Without it, one folder as before.
  expect(Object.keys(files('root', { styles: [], fonts: false, modules: ['scaling'] }))).toEqual(['0-face/scaling.ts']);
});

test('bundled tokens are one stylesheet with no local imports left', () => {
  const copy = files('tokens', { nativeControls: true, bundle: true });
  expect(Object.keys(copy)).toEqual(['bundle.css']);
  const css = String(copy['bundle.css']);
  expect(css).not.toMatch(/@import\s+"\.\//);
  expect(css).toContain('--ds-row-height');
  expect(css).toContain('.ds-button');
  expect(css).toContain('.ds-table');
  expect(css.indexOf('--ds-row-height')).toBeLessThan(css.indexOf('.ds-button {'));
  expect(css).toContain('.ds-text {');
  expect(css).toContain('.ds-empty {');
  expect(css).toContain('.ds-notice {');
});

test('the prose sheet is copied when a product asks for it', () => {
  expect(files('root')).not.toHaveProperty(['prose.css']);
  expect(files('root', { prose: true, fonts: false })).toHaveProperty(['prose.css']);
  expect(Object.keys(files('root', { styles: ['prose.css', 'component-tokens.css', 'component-metrics.css', 'component-appearance.css'], fonts: false }))).toEqual(['prose.css', 'component-tokens.css', 'component-metrics.css', 'component-appearance.css']);
  expect(Object.keys(files('tokens', { prose: true }))).toContain('prose.css');
  expect(String(files('tokens', { prose: true, bundle: true })['bundle.css'])).toContain('[data-ds-prose] {');
});

test('the classless sheet is copied when a product asks for it, and keeps its palette', () => {
  expect(files('root')).not.toHaveProperty(['one.semantic.css']);
  expect(Object.keys(files('root', { styles: ['one.semantic.css'], fonts: false }))).toEqual(['one.semantic.css']);
  expect(String(files('tokens', { classless: true })['one.semantic.css'])).toContain('--one-apple-green: light-dark(');
  expect(Object.keys(files('root', { classless: true, prose: true, fonts: false }))).toEqual(expect.arrayContaining(['one.css', 'prose.css', 'one.semantic.css']));
});

test('controls.css always arrives with the table, text, empty-state, notice and row classes it imports', () => {
  expect(Object.keys(files('tokens', { nativeControls: true }))).toEqual(['component-tokens.css', 'component-metrics.css', 'component-appearance.css', 'palette.css', 'table.css', 'text.css', 'empty.css', 'notice.css', 'row.css', 'controls.css']);
  expect(Object.keys(files('tokens'))).not.toContain('text.css');
  expect(Object.keys(files('root', { styles: ['grid.css'], fonts: false, nativeControls: true }))).toEqual(['grid.css', 'table.css', 'empty.css', 'notice.css', 'row.css', 'controls.css', 'text.css']);
  // Every sheet controls.css imports is copied beside it, by either export.
  for (const copy of [files('tokens', { nativeControls: true }), files('root', { fonts: false, nativeControls: true })]) {
    for (const [, file] of String(copy['controls.css']).matchAll(/@import "\.\/([^"]+)";/g)) expect(copy).toHaveProperty([file!]);
  }
  expect(Object.keys(files('root', { styles: ['one.css', 'grid.css'], fonts: false }))).toContain('text.css');
});

test('the fonts export offers the root faces by name', () => {
  const copy = files('fonts', { fonts: ['GT-America-Standard-Regular.woff2', 'Iosevka-Regular.woff2'] });
  expect(Object.keys(copy)).toEqual(['GT-America-Standard-Regular.woff2', 'Iosevka-Regular.woff2']);
});

test('the root export can copy only the stylesheets a product loads', () => {
  expect(Object.keys(files('root', { styles: ['grid.css'], fonts: false }))).toEqual(['grid.css']);
  expect(Object.keys(files('root', { styles: [], fonts: false, modules: ['scaling'] }))).toEqual(['0-face/scaling.ts']);
  expect(() => files('root', { styles: ['other.css'] })).toThrow(/Unknown root stylesheet/);
});

test('the languages export carries formatting with every module the language runtime imports', () => {
  const tree = (dir: string, { only }: { only?: RegExp } = {}) => new Map(readdirSync(join(root, dir)).filter((file) => !only || only.test(file)).map((file) => [file, read(`${dir}/${file}`)]));
  const copy = Object.fromEntries(exports.languages.files({ read, tree, options: {} } as Parameters<Exported['files']>[0]) as Map<string, unknown>);
  for (const file of ['0-face/format.ts', '0-face/pricing.ts', '0-face/i18n.ts', '0-face/languages.ts']) expect(copy).toHaveProperty([file]);
  for (const [file, content] of Object.entries(copy)) {
    if (!file.endsWith('.ts')) continue;
    for (const [, path] of String(content).matchAll(/(?:from|import\()\s*["'](\.\/[^"']+)["']/g)) expect(copy, `${file} imports ${path}`).toHaveProperty([`0-face/${path.slice(2)}${/\.\w+$/.test(path) ? '' : '.ts'}`]);
  }
});

test('the feedback export carries the module with everything it imports, by its paths in DS1', () => {
  const copy = files('feedback');
  expect(Object.keys(copy).sort()).toEqual(['0-face/copy-text.ts', '0-face/dialogs.ts', '0-face/feedback-words.ts', '0-face/feedback.ts', '0-face/generated/toast-assets.ts', '0-face/load-toaster.ts', '0-face/toast-queue.ts', '0-face/toaster.ts']);
  // No Lit, no component, no stylesheet or icon to import with a query, and no language runtime.
  expect(Object.keys(copy).some((file) => /^2-core\/ds-|^3-unit|^4-page/.test(file))).toBe(false);
  expect(Object.values(copy).some((content) => /from\s+["']lit/.test(String(content)))).toBe(false);
  expect(copy).not.toHaveProperty(['0-face/i18n.ts']);
});

test('the feedback export brings the language runtime it used to when asked', () => {
  const copy = files('feedback', { languages: true });
  for (const file of ['0-face/feedback.ts', '0-face/i18n.ts', '0-face/shared-words.ts', '0-face/languages.ts', '0-face/translations/da.json']) expect(copy).toHaveProperty([file]);
});
