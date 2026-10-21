import { expect, it } from 'vite-plus/test';
import { prepareLibrary, validateCss } from '../packages/css-validate/src/index';
import { draft, LIBRARIES, lowContrast } from '../scripts/example-libraries.mjs';

it('keeps every word in the example libraries at 4.5:1 or more, in light and dark', () => {
  expect(lowContrast()).toEqual([]);
});

it('drafts example libraries that publish as they are and as prepared', () => {
  for (const lib of Object.values(LIBRARIES)) {
    const css = draft(lib);
    expect(validateCss(css).issues).toEqual([]);
    expect(validateCss(prepareLibrary(css).css).ok).toBe(true);
  }
});

it('serves each example library as the builder writes it', async () => {
  const { readFile } = await import('node:fs/promises');
  for (const [id, lib] of Object.entries(LIBRARIES)) {
    expect(await readFile(new URL(`../website/public/examples/libraries/${id}.css`, import.meta.url), 'utf8'), id).toBe(draft(lib));
  }
});
