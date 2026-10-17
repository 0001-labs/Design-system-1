import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vite-plus/test';
import { androidTokenFiles, appleTokenFiles, iconNames, kotlinIconName } from '../scripts/native-tokens';
import { androidPackage, fontResource, iconResource, vectorDrawable } from '../scripts/native-android.mjs';
import { LANGUAGES } from '../DS1/0-face/languages';
import config from '../sync.exports.mjs';

const root = join(import.meta.dirname, '..');
const read = (path: string) => readFileSync(join(root, path));
const tree = (rel: string, { only, skip }: { only?: RegExp; skip?: RegExp } = {}) => {
  const walk = (base = ''): string[] => readdirSync(join(root, rel, base)).flatMap(name => {
    const file = base ? `${base}/${name}` : name;
    return statSync(join(root, rel, file)).isDirectory() ? walk(file) : [file];
  });
  return new Map(walk().filter(f => (!only || only.test(f)) && !(skip && skip.test(f))).map(f => [f, readFileSync(join(root, rel, f))]));
};

describe('The Kotlin package', () => {
  test('the committed Kotlin files are the ones the sources write', () => {
    for (const [path, content] of Object.entries(androidTokenFiles())) expect(readFileSync(join(root, path), 'utf8'), `${path} is stale: run vp run native:tokens`).toBe(content);
  });

  test('every icon has an entry name of its own, clear of keywords and the enum’s members', () => {
    const names = iconNames().map(kotlinIconName);
    expect(new Set(names).size).toBe(names.length);
    expect(kotlinIconName('open')).toBe('`open`');
    expect(kotlinIconName('shield-alt')).toBe('shieldAlt');
    expect(new Set(iconNames().map(iconResource)).size).toBe(names.length);
    expect(fontResource('GT-America-Standard-Regular.woff2')).toBe('ds1_gt_america_standard_regular');
  });

  test('both packages know every language and its shared words', () => {
    const kotlin = androidTokenFiles();
    const swift = appleTokenFiles();
    for (const code of LANGUAGES) {
      expect(kotlin['native/android/ds1/src/main/kotlin/com/designsystem1/ds1/generated/Languages.kt']).toContain(`("${code}", `);
      expect(swift['native/apple/Sources/DS1/Generated/Languages.swift']).toContain(`"${code}"`);
    }
    expect(kotlin['native/android/ds1/src/main/kotlin/com/designsystem1/ds1/generated/Words.kt']).toContain('"Save" to "Gem"');
    expect(swift['native/apple/Sources/DS1/Generated/Words.swift']).toContain('"Save": "Gem"');
  });
});

describe('Icons as vector drawables', () => {
  test('a path keeps its data and takes the tint', () => {
    const xml = vectorDrawable(readFileSync(join(root, 'DS1/x-icon/check.svg'), 'utf8'));
    expect(xml).toContain('android:viewportWidth="16"');
    expect(xml).toMatch(/android:pathData="M6\.686 11\.884L12\.443 6\.136/);
    expect(xml).toContain('android:fillColor="#FF000000"');
  });

  test('shapes, transforms and nested viewports become paths in the icon’s own coordinates', () => {
    const xml = vectorDrawable('<svg viewBox="0 0 16 16" width="16" height="16"><g transform="translate(2 2)"><rect x="0" y="0" width="4" height="4" fill="#ff0000"/></g><svg viewBox="0 0 32 32" width="16" height="16"><circle cx="16" cy="16" r="8" fill="none" stroke="#00ff00" stroke-width="2"/></svg></svg>');
    expect(xml).toContain('android:pathData="M2 2L6 2L6 6L2 6Z"');
    expect(xml).toContain('android:fillColor="#FFFF0000"');
    // The nested viewport halves the circle: from x 8 at radius 4, with a 1-unit stroke.
    expect(xml).toMatch(/android:pathData="M4 8C/);
    expect(xml).toContain('android:strokeWidth="1"');
  });

  test('a clip path becomes a group’s clip-path', () => {
    const xml = vectorDrawable('<svg viewBox="0 0 16 16"><defs><clipPath id="a"><rect width="8" height="8"/></clipPath></defs><g clip-path="url(#a)"><rect width="16" height="16"/></g></svg>');
    expect(xml).toMatch(/<group>\s*<clip-path android:pathData="M0 0L8 0L8 8L0 8Z"\/>/);
  });
});

describe('The kotlin export', () => {
  const kotlin = (config.exports as unknown as Record<string, { owned?: boolean; files: (c: object) => Map<string, Buffer> }>).kotlin;

  test('copies the Gradle build, its generated files, every icon and the faces asked for', () => {
    expect(kotlin.owned).toBe(true);
    const files = kotlin.files({ read, tree, options: { fonts: ['OlivettiDot-Regular.woff2'] } });
    expect(files.has('settings.gradle.kts')).toBe(true);
    expect(files.has('ds1/build.gradle.kts')).toBe(true);
    expect(files.has('ds1/src/main/kotlin/com/designsystem1/ds1/generated/Palette.kt')).toBe(true);
    expect([...files.keys()].some(f => /(^|\/)(build|\.gradle)\//.test(f) || f.endsWith('local.properties'))).toBe(false);
    for (const name of iconNames()) expect(files.has(`ds1/src/main/res/drawable/${iconResource(name)}.xml`)).toBe(true);
    const fonts = [...files.keys()].filter(f => f.startsWith('ds1/src/main/res/font/')).sort();
    expect(fonts).toEqual(['ds1_inter_arrows.ttf', 'ds1_iosevka_regular.ttf', 'ds1_olivettidot_regular.otf'].map(f => `ds1/src/main/res/font/${f}`));
    expect(files.has('Licences/Tabler-LICENSE.md')).toBe(true);
    expect(() => androidPackage({ read, tree, fonts: ['Nothing.woff2'] })).toThrow(/Unknown font/);
  });
});
