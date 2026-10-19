import { expect, test } from 'vite-plus/test';
import { hideSignedInLibraryEntry } from '../website/src/lib/sidebar-visibility';
test('hides the libraries group and destinations while retaining Advanced', () => {
  const libraries = { label: 'My libraries', entries: [{ label: 'About', href: '/libraries/' }, { label: 'Open', href: '/app/libraries' }] };
  expect(hideSignedInLibraryEntry(libraries)).toBe(true);
  expect(hideSignedInLibraryEntry({ ...libraries, label: 'Mine biblioteker' })).toBe(true);
  expect(hideSignedInLibraryEntry({ label: 'Open', href: '/classless/libraries/?library=one' })).toBe(true);
  expect(hideSignedInLibraryEntry({ label: 'Advanced', entries: [libraries, {label:'Native', href:'/advanced/native/'}] })).toBe(false);
  expect(hideSignedInLibraryEntry({label:'Native', href:'/advanced/native/'})).toBe(false);
});
