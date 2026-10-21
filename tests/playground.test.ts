import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vite-plus/test';
import { highlight } from '../website/src/lib/playground-editor';
import { PLAYGROUND_FILES } from '../website/src/lib/playground-example';
import { crc32, zip } from '../website/src/lib/zip';

it('downloads the site as a zip every system opens', async () => {
  expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  const folder = mkdtempSync(join(tmpdir(), 'play-zip-'));
  const archive = join(folder, 'site.zip');
  writeFileSync(archive, new Uint8Array(await zip(PLAYGROUND_FILES.map(file => ({ name: `site/${file.name}`, content: file.content }))).arrayBuffer()));
  execFileSync('unzip', ['-q', archive, '-d', folder]);
  for (const file of PLAYGROUND_FILES) expect(readFileSync(join(folder, 'site', file.name), 'utf8')).toBe(file.content);
});

it('links every page of the example to the others and to its stylesheet', () => {
  const names = new Set(PLAYGROUND_FILES.map(file => file.name));
  for (const page of PLAYGROUND_FILES.filter(file => file.name.endsWith('.html'))) {
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

it('opens every library example as one page in its library, which the library picker can change', async () => {
  const { PLAYGROUND_SITES } = await import('../website/src/lib/playground-sites');
  const LIBRARY_LINK = /\n[ \t]*<link rel="stylesheet" href="https:\/\/designsystem1\.com\/examples\/libraries\/([a-z]+)\.css">/;
  expect(PLAYGROUND_SITES[0].id).toBe('garden');
  for (const site of PLAYGROUND_SITES.slice(1)) {
    const page = site.files[0].content;
    expect(site.files.map(file => file.name), site.id).toEqual(['index.html']);
    expect(LIBRARY_LINK.exec(page)?.[1], site.id).toBe(site.library);
    expect(page, site.id).toContain('https://designsystem1.com/resources/design-system-1.js');
    expect(page, site.id).not.toMatch(/(?:src|href)="\/(?!\/)/);
  }
});
