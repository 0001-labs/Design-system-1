// @vitest-environment happy-dom
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vite-plus/test';
import { highlight } from '../website/src/lib/play-editor';
import { PLAY_FILES } from '../website/src/lib/play-example';
import { crc32, zip } from '../website/src/lib/zip';

it('downloads the site as a zip every system opens', async () => {
  expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  const folder = mkdtempSync(join(tmpdir(), 'play-zip-'));
  const archive = join(folder, 'site.zip');
  writeFileSync(archive, new Uint8Array(await zip(PLAY_FILES.map(file => ({ name: `site/${file.name}`, content: file.content }))).arrayBuffer()));
  execFileSync('unzip', ['-q', archive, '-d', folder]);
  for (const file of PLAY_FILES) expect(readFileSync(join(folder, 'site', file.name), 'utf8')).toBe(file.content);
});

it('links every page of the example to the others and to its stylesheet', () => {
  const names = new Set(PLAY_FILES.map(file => file.name));
  for (const page of PLAY_FILES.filter(file => file.name.endsWith('.html'))) {
    for (const [, href] of page.content.matchAll(/href=["']([^"'#:]+)["']/g)) expect(names.has(href), `${page.name} → ${href}`).toBe(true);
  }
});

it('colours HTML and what a page holds, and takes a half-written tag as it comes', () => {
  const code = '<a href="x.html">x</a><style>.a { color: red; }</style><script>const n = 1;</script><ds-butt';
  const kinds = (word: string) => highlight(code).filter(token => code.slice(token.from, token.to) === word).map(token => token.kind);
  expect(kinds('<a')).toContain('tag');
  expect(kinds('href')).toContain('attribute');
  expect(kinds('"x.html"')).toContain('string');
  expect(kinds('color')).toContain('property');
  expect(kinds('const')).toContain('keyword');
  expect(kinds('1')).toContain('number');
  expect(kinds('<ds-butt')).toContain('tag');
});
