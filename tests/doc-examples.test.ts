import { readFileSync } from 'node:fs';
import { expect, it } from 'vite-plus/test';
import { DOC_EXAMPLES } from '../shared/doc-examples';
import { LAYOUT_EXAMPLES } from '../website/src/lib/layout-examples';
import { HTML_EXAMPLES } from '../website/src/lib/html-examples';

it('keeps every authored documentation example in the owner visibility catalogue', () => {
  expect(DOC_EXAMPLES.map(example => example.id).sort()).toEqual([
    ...Object.keys(LAYOUT_EXAMPLES), ...HTML_EXAMPLES.map(example => `html-${example.id}`),
  ].sort());
  expect(new Set(DOC_EXAMPLES.map(example => example.id)).size).toBe(DOC_EXAMPLES.length);
  const document = readFileSync('website/src/content/docs/start-here/examples.mdx', 'utf8');
  for (const id of Object.keys(LAYOUT_EXAMPLES)) expect(document).toContain(`data-doc-example="${id}"`);
  expect(document).toContain('data-doc-example={`html-${example.id}`}');
});
