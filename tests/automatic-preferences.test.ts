// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from 'vite-plus/test';
afterEach(() => { vi.restoreAllMocks(); vi.resetModules(); delete window.DS_ONE_I18N; delete window.DS_ONE_PREFERENCES; localStorage.clear(); });
test('browser language ignores stored choices without overwriting them', async () => {
  localStorage.setItem('language', 'de');
  vi.spyOn(navigator, 'language', 'get').mockReturnValue('ja-JP');
  window.DS_ONE_I18N = { autoLoad: false, persist: false, languages: ['en', 'ja'] };
  const i18n = await import('../DS1/0-face/i18n');
  expect(i18n.getBrowserLanguage()).toBe('ja');
  i18n.setLanguage(i18n.getBrowserLanguage());
  expect(document.documentElement.lang).toBe('ja');
  expect(localStorage.getItem('language')).toBe('de');
  vi.spyOn(navigator, 'language', 'get').mockReturnValue('ko-KR');
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['ko-KR']);
  expect(i18n.getBrowserLanguage()).toBe('en');
});
test('automatic theme follows changes without overwriting a saved manual theme', async () => {
  localStorage.setItem('ds-one:theme', 'dark');
  window.DS_ONE_PREFERENCES = { themeMode: 'system' };
  const media = new EventTarget() as MediaQueryList;
  Object.defineProperty(media, 'matches', { value: false, writable: true });
  vi.spyOn(window, 'matchMedia').mockReturnValue(media);
  const { followSystemTheme } = await import('../DS1/0-face/theme');
  const dispose = followSystemTheme();
  expect(document.documentElement.style.colorScheme).toBe('light');
  Object.assign(media, { matches: true }); media.dispatchEvent(new Event('change'));
  expect(document.documentElement.style.colorScheme).toBe('dark');
  Object.assign(media, { matches: false }); media.dispatchEvent(new Event('change'));
  expect(document.documentElement.style.colorScheme).toBe('light');
  expect(localStorage.getItem('ds-one:theme')).toBe('dark');
  dispose();
});
