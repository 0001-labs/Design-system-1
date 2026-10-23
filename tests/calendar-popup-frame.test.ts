import { expect, test } from 'vite-plus/test';
import { readFileSync } from 'node:fs';
const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
test("compact calendar popups have no outer frame or control gaps", () => {
  const overlay = read('../DS1/4-page/styles/ds-overlay.css');
  const rule = overlay.match(/dialog\[data-ds-type="popover"\]:has\(> ds-calendar\[compact\]\)\s*\{([^}]+)\}/)![1];
  for (const property of ['padding', 'border', 'margin', 'gap']) expect(rule).toContain(`${property}: 0`);
  const calendar = read('../DS1/3-unit/styles/ds-calendar.css');
  const popup = calendar.match(/\.popover\s*\{([^}]+)\}/)![1];
  expect(popup).toContain('padding: 0');
  expect(popup).toContain('border: 0');
  expect(calendar).toContain('.fields { margin-block-end: 0; }');
  expect(read('../DS1/3-unit/ds-calendar.ts')).toContain('const gap = 0;');
});
