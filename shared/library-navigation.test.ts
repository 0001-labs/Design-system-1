import { expect, test } from 'vite-plus/test';
import { libraryComponent, libraryHeading, libraryHref, libraryWorkspaceRedirect, readLibraryNavigation } from './library-navigation';

test('unpublished libraries stay drafts, and only actual publication numbers are shown', () => {
  expect(libraryHeading({ name: 'Example', publishedVersion: null })).toBe('Example · Draft');
  expect(libraryHeading({ name: 'Example', publishedVersion: 4 })).toBe('Example · v4');
  expect(readLibraryNavigation({ id: 'example', name: 'Example', publishedVersion: 0 })).toBeNull();
  expect(readLibraryNavigation({ id: 'example', name: 'Example', publishedVersion: '4' })).toBeNull();
  expect(readLibraryNavigation(null)).toBeNull();
});

test('navigation stays within the selected library and public component catalogue', () => {
  const library = readLibraryNavigation({ id: 'library-one', name: 'Example', publishedVersion: 4, component: '/2-core/input/' })!;
  const url = new URL(libraryHref(library), 'https://designsystem1.com');
  expect(url.pathname).toBe('/app/l/library-one');
  expect(url.searchParams.get('component')).toBe('/2-core/input/');
  expect(libraryComponent('https://example.com')).toBe('/2-core/button/');
  expect(libraryComponent('/2-core/loading/')).toBe('/2-core/button/');
});

test('direct links retain library/component selection without redirecting embedded or full-screen sessions', () => {
  const query = new URLSearchParams({ component: '/2-core/input/' });
  const destination = new URL(libraryWorkspaceRedirect('/l/library-one', query, false, false)!, 'https://designsystem1.com');
  expect(destination.pathname).toBe('/libraries/workspace/');
  expect(destination.searchParams.get('library')).toBe('library-one');
  expect(destination.searchParams.get('component')).toBe('/2-core/input/');
  expect(libraryWorkspaceRedirect('/l/library-one', new URLSearchParams(), true, false)).toBeNull();
  expect(libraryWorkspaceRedirect('/libraries', new URLSearchParams(), false, true)).toBeNull();
  expect(libraryWorkspaceRedirect('/signin', query, false, false)).toBeNull();
});

 test('overview survives deep links while component selection can leave it', () => {
   const library = readLibraryNavigation({ id: 'one', name: 'Studio', publishedVersion: 2, view: 'overview' })!;
   expect(new URL(libraryHref(library), 'https://example.com').searchParams.get('view')).toBe('overview');
   expect(libraryWorkspaceRedirect('/l/one', new URLSearchParams('view=overview'), false, false)).toContain('view=overview');
   expect(libraryHref({ ...library, view: undefined }, '/2-core/input/')).not.toContain('view=');
 });
