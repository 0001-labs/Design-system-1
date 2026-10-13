// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { afterEach, expect, test } from 'vite-plus/test';

afterEach(() => { document.head.replaceChildren(); document.body.replaceChildren(); });

test('base lists and tables stay neutral even when the product sets a bright accent', () => {
  const style = document.createElement('style');
  style.textContent = readFileSync('DS1/1-root/one.css', 'utf8') + readFileSync('DS1/3-unit/styles/ds-table.css', 'utf8');
  document.head.append(style);
  document.body.style.setProperty('--accent-color', '#ff0000');
  document.body.style.setProperty('--apple-green', '#99ff73');
  document.body.innerHTML = '<div class="list">List</div><div class="grouped-item">Group</div><table><thead><tr><th>Title</th></tr></thead><tbody><tr><td class="status-cell">Value</td></tr></tbody></table>';
  for (const element of document.querySelectorAll('.list, .grouped-item, tr, .status-cell')) {
    expect(getComputedStyle(element).backgroundColor).toBe('transparent');
  }
});
