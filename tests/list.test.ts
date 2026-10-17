// @vitest-environment happy-dom
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
