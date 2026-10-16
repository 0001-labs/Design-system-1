import { expect, it } from 'vite-plus/test';
import { readLibraryToken, setLibraryToken } from '../app/src/lib/libraryTokens';
it('reads and edits multiple root blocks without changing defaults or conditional rules', () => {
  const css = ':root { --size: 20px; }\n:root { --accent: yellow; }\n@media (prefers-color-scheme: dark) { :root { --accent: blue; } }';
  expect(readLibraryToken(css, '--accent')).toBe('yellow');
  const next = setLibraryToken(css, '--accent', 'red');
  expect(next.startsWith(css)).toBe(true);
  expect(readLibraryToken(next, '--accent')).toBe('red');
  const again = setLibraryToken(next, '--accent', 'pink');
  expect(again.match(/ds1:tokens:start/g)).toHaveLength(1);
  expect(readLibraryToken(again, '--accent')).toBe('pink');
  expect(readLibraryToken(setLibraryToken(again, '--accent', ''), '--accent')).toBe('yellow');
});
it('adds a token to an existing branded stylesheet without replacing its rules', () => {
  const css = 'button { padding: 4px; }';
  const next = setLibraryToken(css, '--ds-radius', '4px');
  expect(next).toContain(css);
  expect(readLibraryToken(next, '--ds-radius')).toBe('4px');
  expect(setLibraryToken(css, '--ds-radius', '4px; color: red')).toBe(css);
});
