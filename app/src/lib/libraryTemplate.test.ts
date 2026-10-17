import { expect, it } from 'vite-plus/test';
import { prepareLibrary, validateCss } from '@ds-one/css-validate';
import { LIBRARY_REVISION, libraryRevision, libraryStamp } from '../../../DS1/1-root/library-tokens';
import { version } from '../../../package.json';
import { libraryTemplate, templateStamp, templateVersion } from './libraryTemplate';

it("stamps a new library with DS1's version and the library revision it is published by", () => {
  expect(libraryTemplate.startsWith(`${templateStamp}\n`)).toBe(true);
  expect(templateVersion()).toBe(`${version}+${LIBRARY_REVISION}`);
  expect(templateVersion('/* DS1 — version 0.0.1-alpha.1 */\n:root {}')).toBe('0.0.1-alpha.1');
  expect(templateVersion(':root {}')).toBe('components-1');
});

it('publishes the template valid, with the published stamp first and the template stamp after it', () => {
  const { css } = prepareLibrary(libraryTemplate);
  expect(validateCss(css).ok).toBe(true);
  expect(css.split('\n').slice(0, 2)).toEqual([libraryStamp(), templateStamp]);
  expect(libraryRevision(css)).toBe(LIBRARY_REVISION);
  expect(templateVersion(css)).toBe(`${version}+${LIBRARY_REVISION}`);
});
