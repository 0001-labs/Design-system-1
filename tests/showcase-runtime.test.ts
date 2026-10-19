// @vitest-environment happy-dom
import { afterEach, expect, test } from 'vite-plus/test';
import { mountShowcase } from '../website/src/lib/showcase-runtime';
afterEach(() => document.body.replaceChildren());
test('local navigation keeps collapsed children hidden when another row is selected', () => {
  const element = document.createElement('ds-sidebar') as HTMLElement & { items: Array<{ id: string; current?: boolean }> };
  element.dataset.showcaseProps = JSON.stringify({ items: [{ id: 'group', expanded: true }, { id: 'child', depth: 1 }, { id: 'other' }] });
  document.body.append(element);
  mountShowcase(document);
  element.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { id: 'group', expanded: false } }));
  element.dispatchEvent(new CustomEvent('sidebar-activate', { detail: { id: 'other' } }));
  expect(element.items.map(item => item.id)).toEqual(['group', 'other']);
  expect(element.items[1].current).toBe(true);
  element.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { id: 'group', expanded: true } }));
  expect(element.items.map(item => item.id)).toEqual(['group', 'child', 'other']);
});
test('keyword creation and removal stay local and treat typed content as text', () => {
  document.body.innerHTML = '<ds-token-field><input value="rain"></ds-token-field>';
  mountShowcase(document);
  const field = document.querySelector('ds-token-field')!;
  field.dispatchEvent(new CustomEvent('ds-token-commit', { detail: { text: '<b>Rain</b>' } }));
  const token = field.querySelector('ds-token')!;
  expect(token.getAttribute('label')).toBe('<b>Rain</b>');
  expect(field.querySelector('b')).toBeNull();
  expect(field.querySelector('input')!.value).toBe('');
  token.dispatchEvent(new CustomEvent('ds-token-remove', { bubbles: true }));
  expect(field.querySelector('ds-token')).toBeNull();
});
