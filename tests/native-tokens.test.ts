import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vite-plus/test';
import { appleTokenFiles, iconNames, swiftName } from '../scripts/native-tokens';
import { applePackage } from '../scripts/native-apple.mjs';
import config from '../sync.exports.mjs';

const root = join(import.meta.dirname, '..');

describe('Native tokens', () => {
  test('the committed Swift files are the ones the sources write', () => {
    for (const [path, content] of Object.entries(appleTokenFiles())) expect(readFileSync(join(root, path), 'utf8'), `${path} is stale: run vp run native:tokens`).toBe(content);
  });

  test('every palette colour and icon has a Swift name of its own', () => {
    const palette = appleTokenFiles()['native/apple/Sources/DS1/Generated/Palette.swift'];
    expect(palette).toContain('public static let appleGreen = DS1Color(light: 0x99ff73, dark: 0x529d36)');
    expect(palette).toContain('public static let zenithBlue = DS1Color(light: 0xccccff');
    expect(palette).toContain('public static let paper = DS1Color(light: 0xf4f4f4, dark: 0x2c2c2c)');
    const names = iconNames().map(n => swiftName(n));
    expect(new Set(names).size).toBe(names.length);
    expect(swiftName('shield-alt')).toBe('shieldAlt');
    expect(swiftName('1x')).toBe('icon1x');
  });
});

describe('The swift export', () => {
  const tree = (rel: string, { only, skip }: { only?: RegExp; skip?: RegExp } = {}) => {
    const walk = (base = ''): string[] => readdirSync(join(root, rel, base)).flatMap(name => {
      const file = base ? `${base}/${name}` : name;
      return statSync(join(root, rel, file)).isDirectory() ? walk(file) : [file];
    });
    return new Map(walk().filter(f => (!only || only.test(f)) && !(skip && skip.test(f))).map(f => [f, readFileSync(join(root, rel, f))]));
  };
  const read = (path: string) => readFileSync(join(root, path));
  const swift = (config.exports as unknown as Record<string, { owned?: boolean; files: (c: object) => Map<string, Buffer> }>).swift;

  test('copies the package with its generated files, every icon and the faces asked for', () => {
    expect(swift.owned).toBe(true);
    const files = swift.files({ read, tree, options: { fonts: ['OlivettiDot-Regular.woff2'] } });
    expect(files.has('Package.swift')).toBe(true);
    expect(files.has('Sources/DS1/Generated/Palette.swift')).toBe(true);
    expect([...files.keys()].some(f => f.includes('.build/') || f.endsWith('.gitignore'))).toBe(false);
    for (const name of iconNames()) expect(files.has(`Sources/DS1/Resources/Icons.xcassets/${name}.imageset/${name}.svg`)).toBe(true);
    const fonts = [...files.keys()].filter(f => f.startsWith('Sources/DS1/Resources/Fonts/')).sort();
    expect(fonts).toEqual(['Inter-Arrows.woff2', 'Iosevka-Regular.woff2', 'OlivettiDot-Regular.woff2'].map(f => `Sources/DS1/Resources/Fonts/${f}`));
    expect(files.has('Licences/Tabler-LICENSE.md')).toBe(true);
    expect(() => applePackage({ read, tree, fonts: ['Nothing.woff2'] })).toThrow(/Unknown font/);
  });
});
