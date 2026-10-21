// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vite-plus/test';
await import('../DS1/3-unit/ds-list');
await import('../DS1/3-unit/ds-row');

afterEach(() => document.body.replaceChildren());

const settle = async (list: HTMLElement & { updateComplete: Promise<unknown> }) => {
  await list.updateComplete;
  // slotchange is dispatched after the slot's assignment settles.
  await new Promise(resolve => setTimeout(resolve));
};

test('a list is a list and its rows are its items', async () => {
  const list = document.createElement('ds-list');
  list.innerHTML = '<ds-row>One</ds-row><ds-row>Two</ds-row><template><ds-row>Later</ds-row></template>';
  document.body.append(list);
  await settle(list);
  expect(list.getAttribute('role')).toBe('list');
  const [one, two] = list.querySelectorAll(':scope > ds-row');
  expect(one!.getAttribute('role')).toBe('listitem');
  expect(two!.getAttribute('role')).toBe('listitem');
  expect(list.querySelector('template')!.hasAttribute('role')).toBe(false);
});

test('rows added later become items, and a row taken out is no longer one', async () => {
  const list = document.createElement('ds-list');
  document.body.append(list);
  await settle(list);
  const row = document.createElement('ds-row');
  list.append(row);
  await settle(list);
  expect(row.getAttribute('role')).toBe('listitem');
  document.body.append(row);
  await settle(list);
  expect(row.hasAttribute('role')).toBe(false);
});

test('roles the page wrote are left alone', async () => {
  const list = document.createElement('ds-list');
  list.setAttribute('role', 'listbox');
  list.innerHTML = '<ds-row role="option">One</ds-row><ds-row>Two</ds-row>';
  document.body.append(list);
  await settle(list);
  expect(list.getAttribute('role')).toBe('listbox');
  expect(list.querySelector('ds-row')!.getAttribute('role')).toBe('option');
});

test('a list with a role of its own gives its children none', async () => {
  const list = document.createElement('ds-list');
  list.setAttribute('role', 'listbox');
  list.innerHTML = '<ds-row>One</ds-row>';
  document.body.append(list);
  await settle(list);
  expect(list.querySelector('ds-row')!.hasAttribute('role')).toBe(false);
});

test('a link or a button directly inside keeps its own role', async () => {
  const list = document.createElement('ds-list');
  list.innerHTML = '<a href="/help">Help</a><button>Open</button><ds-row>Row</ds-row>';
  document.body.append(list);
  await settle(list);
  expect(list.querySelector('a')!.hasAttribute('role')).toBe(false);
  expect(list.querySelector('button')!.hasAttribute('role')).toBe(false);
  expect(list.querySelector('ds-row')!.getAttribute('role')).toBe('listitem');
});

test('a heading is drawn on the square above the rows and names the list, unless the page named it', async () => {
  const list = document.createElement('ds-list');
  list.setAttribute('heading', 'Monday');
  list.innerHTML = '<ds-row>One</ds-row>';
  document.body.append(list);
  await settle(list);
  const heading = list.shadowRoot!.querySelector('.heading')!;
  expect(heading.textContent).toBe('Monday');
  expect(heading.getAttribute('aria-hidden')).toBe('true');
  expect(heading.getAttribute('part')).toBe('heading');
  expect(list.getAttribute('aria-label')).toBe('Monday');
  // The heading changes with the day; taken away, the name it gave goes with it.
  list.setAttribute('heading', 'Tuesday');
  await settle(list);
  expect(list.getAttribute('aria-label')).toBe('Tuesday');
  list.removeAttribute('heading');
  await settle(list);
  expect(list.hasAttribute('aria-label')).toBe(false);
  expect(list.shadowRoot!.querySelector('.heading')).toBeNull();

  const named = document.createElement('ds-list');
  named.setAttribute('aria-label', 'Payments on Monday');
  named.setAttribute('heading', 'Monday');
  document.body.append(named);
  await settle(named);
  expect(named.getAttribute('aria-label')).toBe('Payments on Monday');
});

test('the heading is one square with its words on the sixteen, in the muted ink', async () => {
  const css = readFileSync(join(import.meta.dirname, '../DS1/3-unit/styles/ds-list.css'), 'utf8');
  const rule = css.match(/\.heading \{[^}]*\}/)![0];
  expect(rule).toContain('height: var(--ds-unit)');
  expect(rule).toContain('padding-top: calc(4px * var(--ds-sf))');
  expect(rule).toContain('line-height: var(--ds-type-lineheight-default)');
  expect(rule).toContain('var(--ds-text-color-muted)');
});
