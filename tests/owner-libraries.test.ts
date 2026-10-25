import { expect, test } from 'vite-plus/test';
import { readFileSync } from 'node:fs';
import { BASE_LIBRARY_HREF, MY_LIBRARIES_HREF, ownerLibraryItems, readOwnerLibraries } from '../website/src/lib/owner-libraries';

const libraries = readOwnerLibraries([
  { id: 'one', name: 'Studio', publishedVersion: 2 },
  { id: 'two', name: 'Shop', publishedVersion: null },
]);

test('My libraries lists Design system 1 first, then each library at its default component', () => {
  const items = ownerLibraryItems(libraries, { pathname: '/2-core/button/' });
  expect(items.map(item => [item.label, item.depth])).toEqual([['My libraries', 0], ['Design system 1', 1], ['Studio', 1], ['Shop', 1]]);
  expect(items[0]).toMatchObject({ href: MY_LIBRARIES_HREF, expanded: true });
  expect(items[1]!.href).toBe(BASE_LIBRARY_HREF);
  const studio = new URL(items[2]!.href, 'https://designsystem1.com');
  expect(studio.pathname).toBe('/libraries/workspace/');
  expect(studio.searchParams.get('library')).toBe('one');
  expect(studio.searchParams.get('component')).toBe('/2-core/button/');
  expect(items.every(item => !item.current)).toBe(true);
  expect(items.some(item => /base system/i.test(item.label))).toBe(false);
});

test('the current page is marked: the list, the base system or one library', () => {
  const current = (pathname: string, search = '') => ownerLibraryItems(libraries, { pathname, search }).filter(item => item.current).map(item => item.label);
  expect(current('/libraries/workspace/')).toEqual(['My libraries']);
  expect(current('/libraries/workspace')).toEqual(['My libraries']);
  expect(current('/libraries/workspace/', '?library=two&component=%2F2-core%2Fbutton%2F')).toEqual(['Shop']);
  expect(current('/libraries/workspace/', '?internal=indexeddb')).toEqual([]);
  expect(current('/libraries/design-system-1/')).toEqual(['Design system 1']);
});

test('collapsing the group leaves only its row', () => {
  expect(ownerLibraryItems(libraries, { pathname: '/' }, false).map(item => item.label)).toEqual(['My libraries']);
});

test('only well-formed libraries from the navigation summary become links', () => {
  expect(readOwnerLibraries(null)).toEqual([]);
  expect(readOwnerLibraries([{ id: '', name: 'Empty' }, { id: 'x', name: ' ' }, { id: 'y' }, 'z', { id: 'ok', name: 'Fine', publishedVersion: 0 }]))
    .toEqual([{ id: 'ok', name: 'Fine', publishedVersion: null }]);
});

test('the navigation shows My libraries to the owner only, last, with no Base system link', () => {
  const sidebar = readFileSync('website/src/components/MySidebar.astro', 'utf8');
  const rail = readFileSync('website/src/components/NavigationRail.astro', 'utf8');
  for (const source of [sidebar, rail]) {
    expect(source).not.toMatch(/Base system|\/app\/base/);
    expect(source).toContain('ownerLibraryItems');
  }
  expect(sidebar).toMatch(/if \(owner\)[\s\S]*ownerLibraryItems/);
  // In the rail, the owner rows are hidden from everyone else and added only for the owner.
  expect(rail).toMatch(/rail :global\(\.rail-owner\) \{ display: none/);
  expect(rail).toMatch(/html\[data-ds-owner\]\)[^{]*rail-owner/);
  expect(rail).toMatch(/detail\.owner === true/);
});

test('Design system 1 opens the component editor in the documentation shell, kept out of the sitemap', () => {
  const layout = readFileSync('website/src/layouts/Layout.astro', 'utf8');
  const workspace = readFileSync('website/src/components/LibraryWorkspace.astro', 'utf8');
  const config = readFileSync('website/astro.config.mjs', 'utf8');
  expect(layout).toMatch(/'\/libraries\/design-system-1' \? 'base'/);
  expect(workspace).toMatch(/mode === 'base' \? '\/app\/base'/);
  expect(config).toMatch(/libraries\\\/design-system-1/);
});
