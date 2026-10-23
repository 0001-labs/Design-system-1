import { expect, test } from 'vite-plus/test';
import { readFileSync } from 'node:fs';
import { constraints } from '../DS1/0-face/constraints';

test("select triggers hug instead of filling their row", () => {
  for (const name of ['select', 'calendar']) {
    const css = readFileSync(new URL(`../DS1/3-unit/styles/ds-${name}.css`, import.meta.url), 'utf8');
    expect(css).toContain('width: max-content !important');
    expect(css).toContain('flex: 0 0 auto !important');
    expect(css).toContain('justify-self: start !important');
    expect(css).not.toContain('var(--ds-calendar-picker-width');
  }
  const rule = constraints.find(rule => rule.code === 'select.hug')!;
  let width = 400;
  const element = {
    querySelector: () => ({ getBoundingClientRect: () => ({ width: 120 }) }),
    getBoundingClientRect: () => ({ width }),
    ownerDocument: { defaultView: { getComputedStyle: () => ({ flexGrow: '0' }) } },
  };
  const root = { querySelectorAll: () => [element] } as unknown as ParentNode;
  expect(rule.inspect(root)).toHaveLength(1);
  width = 120;
  expect(rule.inspect(root)).toHaveLength(0);
});
