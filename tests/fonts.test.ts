import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vite-plus/test';

const rootDir = join(import.meta.dirname, '../DS1/1-root');
const read = (file: string) => readFileSync(join(rootDir, file), 'utf8');
const code = (file: string) => read(file).replace(/\/\*[\s\S]*?\*\//g, '');
/** Each token as the sheet first declares it (later rules, such as :lang(), only point it elsewhere). */
const tokens = (file: string, prefix: string) => {
  const found: Record<string, string> = {};
  for (const [, name, value] of code(file).matchAll(new RegExp(`(${prefix}[\\w-]+):\\s*([^;]+);`, 'g'))) found[name!] ??= value!.replace(/\s+/g, ' ').trim();
  return found;
};
const families = (stack: string) => stack.split(',').map((family) => family.trim().replace(/^"|"$/g, ''));
const faces = (file: string) => [...code(file).matchAll(/@font-face\s*{([^}]*)}/g)].map(([, body]) => ({
  family: /font-family:\s*"?([^";]+)"?;/.exec(body!)?.[1],
  url: /url\("([^"]+)"\)/.exec(body!)?.[1],
}));
const cjkTokens = (all: Record<string, string>) => Object.entries(all).filter(([name]) => /-(?:jp|zh-hans|zh-hant)$/.test(name));

test('no root stylesheet a page always loads fetches from another host', () => {
  for (const file of readdirSync(rootDir).filter((file) => file.endsWith('.css') && file !== 'cjk.css')) {
    expect(code(file), file).not.toMatch(/@import\s+url\(|https?:\/\//);
  }
});

test('fonts.css holds the one definition of the faces, and one.css imports it', () => {
  expect(code('one.css')).toMatch(/^@import "\.\/fonts\.css";$/m);
  expect(code('one.css')).not.toMatch(/@font-face|--typeface-regular:/);
  for (const { url } of faces('fonts.css')) expect(existsSync(join(rootDir, url!)), url).toBe(true);
});

test('every typeface token starts with Inter Arrows and then a face fonts.css loads, Iosevka for code', () => {
  const declared = new Set(faces('fonts.css').map(({ family }) => family));
  const all = { ...tokens('fonts.css', '--typeface-'), ...tokens('component-tokens.css', '--ds-typeface-') };
  const stacks = Object.entries(all).filter(([name, value]) => !value.startsWith('var(') && !cjkTokens(all).some(([cjk]) => cjk === name));
  expect(stacks.map(([name]) => name)).toEqual(expect.arrayContaining(['--typeface-regular', '--typeface-mono', '--ds-typeface-regular', '--ds-typeface-mono']));
  for (const [name, stack] of stacks) {
    const [arrows, ...rest] = families(stack);
    expect(arrows, name).toBe('Inter Arrows');
    expect(rest.some((family) => declared.has(family)), `${name}: ${stack}`).toBe(true);
  }
  expect(families(all['--typeface-mono']!)[1]).toBe('Iosevka');
  expect(families(all['--ds-typeface-mono']!)[1]).toBe('Iosevka');
  expect(faces('fonts.css').find(({ family }) => family === 'Iosevka')?.url).toBe('./fonts/Iosevka-Regular.woff2');
});

test('Japanese and Chinese name Noto Sans, then the reader\'s own faces, never a download', () => {
  const all = [...cjkTokens(tokens('fonts.css', '--typeface-')), ...cjkTokens(tokens('component-tokens.css', '--ds-typeface-'))];
  expect(all.map(([name]) => name)).toEqual(expect.arrayContaining(['--typeface-regular-jp', '--typeface-regular-zh-hans', '--typeface-regular-zh-hant', '--ds-typeface-regular-jp', '--ds-typeface-regular-zh-hans', '--ds-typeface-regular-zh-hant']));
  const system = { jp: 'Hiragino Sans', 'zh-hans': 'PingFang SC', 'zh-hant': 'PingFang TC' } as const;
  const noto = { jp: 'Noto Sans JP', 'zh-hans': 'Noto Sans SC', 'zh-hant': 'Noto Sans TC' } as const;
  for (const [name, stack] of all) {
    const language = /-(jp|zh-hans|zh-hant)$/.exec(name)![1] as keyof typeof system;
    const list = families(stack);
    expect(list[0], name).toBe('Inter Arrows');
    expect(list.indexOf(noto[language]), name).toBeGreaterThan(0);
    expect(list.indexOf(system[language]), name).toBeGreaterThan(list.indexOf(noto[language]));
    expect(list.at(-1), name).toBe('sans-serif');
  }
});

test('cjk.css is the one opt-in sheet that loads Noto Sans, and keeps the browser from thickening it', () => {
  const css = code('cjk.css');
  for (const family of ['Noto+Sans+JP', 'Noto+Sans+SC', 'Noto+Sans+TC']) expect(css).toMatch(new RegExp(`^@import url\\("https://fonts\\.googleapis\\.com/css2\\?family=${family.replace(/\+/g, '\\+')}[^"]*"\\);$`, 'm'));
  expect(css).toMatch(/:lang\(ja\),\s*:lang\(zh\)\s*{\s*font-synthesis-weight: none;\s*}/);
  expect(code('one.css')).not.toContain('cjk.css');
});
