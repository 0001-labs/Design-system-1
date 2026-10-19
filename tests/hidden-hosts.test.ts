import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { expect, test } from 'vite-plus/test';

// Every element's own styles, read from source: its `?inline` stylesheets,
// the css`` and unsafeCSS(``) templates in the class, and the styles of a
// class it extends through `Other.styles`.
const root = join(import.meta.dirname, '../DS1');

const stylesOf = (file: string, seen = new Set<string>()): string => {
  if (seen.has(file) || !existsSync(file)) return '';
  seen.add(file);
  const source = readFileSync(file, 'utf8');
  const parts: string[] = [];
  for (const [, path] of source.matchAll(/import\s+\w+\s+from\s+["']([^"']+\.css)\?inline["']/g)) {
    parts.push(readFileSync(resolve(dirname(file), path!), 'utf8'));
  }
  for (const [, body] of source.matchAll(/(?:css|unsafeCSS\()`([^`]*)`/g)) parts.push(body!);
  for (const [, name] of source.matchAll(/\b([A-Z]\w*)\.styles\b/g)) {
    const from = source.match(new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*["'](\\.[^"']+)["']`))?.[1];
    if (from) parts.push(stylesOf(resolve(dirname(file), `${from.replace(/\.js$/, '')}.ts`), seen));
  }
  return parts.join('\n');
};

/** Rules as [selectors, declarations], at the top level or inside @media. */
const rules = (css: string) =>
  [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(
    ([, selectors, body]) => [selectors!.split(',').map(selector => selector.trim()), body!] as const,
  );

const hostOnly = (selector: string) => /^:host(\(.*\))?$/.test(selector) && !selector.includes('hidden');
const showsHost = (body: string) => /(^|[;\s])display\s*:\s*(?!none)/.test(body);
const hidesHost = (selectors: readonly string[], body: string) =>
  selectors.includes(':host([hidden])') && /display\s*:\s*none\s*!important/.test(body);

const elements = ['2-core', '3-unit', '4-page', '../packages/app/src/2-core'].flatMap(layer =>
  readdirSync(join(root, layer))
    .filter(file => /^ds-.*\.ts$/.test(file))
    .map(file => ({ tag: file.replace(/\.ts$/, ''), css: stylesOf(join(root, layer, file)) })),
);

test('the element list covers the components reported hidden-but-visible', () => {
  expect(elements.map(element => element.tag)).toEqual(
    expect.arrayContaining(['ds-text', 'ds-button', 'ds-empty', 'ds-notice', 'ds-loading', 'ds-dialog', 'ds-cycle', 'ds-list']),
  );
  expect(elements.find(element => element.tag === 'ds-text')!.css).toContain(':host {');
});

test('every element whose host sets a display hides with the hidden attribute', () => {
  const missing = elements
    .filter(({ css }) => {
      const parsed = rules(css);
      return parsed.some(([selectors, body]) => selectors.some(hostOnly) && showsHost(body)) && !parsed.some(([selectors, body]) => hidesHost(selectors, body));
    })
    .map(element => element.tag);
  expect(missing).toEqual([]);
});

test('a native ds-button hides, not only a slotted one', () => {
  const css = elements.find(element => element.tag === 'ds-button')!.css;
  expect(rules(css).some(([selectors, body]) => hidesHost(selectors, body))).toBe(true);
});
