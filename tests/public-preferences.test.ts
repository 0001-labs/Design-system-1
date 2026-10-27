// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from 'vite-plus/test';
const state = vi.hoisted(() => ({ load: vi.fn(), report: vi.fn() }));
vi.mock('../DS1/0-face/i18n', () => ({ configureI18n: vi.fn(), getBrowserLanguage: () => 'en', setLanguage: vi.fn(), loadTranslations: state.load }));
vi.mock('../DS1/0-face/theme', () => ({ followSystemTheme: vi.fn() }));
vi.mock('../DS1/0-face/failures', () => ({ reportFailure: state.report }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); vi.resetModules(); });

test('a temporary language-file failure recovers without rejecting the page module', async () => {
  const fetcher = vi.fn().mockRejectedValueOnce(new TypeError('Load failed')).mockResolvedValue(new Response('{"en":{"Hello":"Hello"}}'));
  vi.stubGlobal('fetch', fetcher);
  await expect(import('../website/src/lib/public-preferences')).resolves.toBeDefined();
  expect(state.load).toHaveBeenCalledWith({ en: { Hello: 'Hello' } });
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(state.report).not.toHaveBeenCalled();
});

test('a persistent language-file failure keeps the page alive and reports its operation', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Load failed')));
  await expect(import('../website/src/lib/public-preferences')).resolves.toBeDefined();
  expect(state.load).not.toHaveBeenCalled();
  expect(state.report).toHaveBeenCalledWith(expect.objectContaining({ code: 'language.load', message: 'Page translations could not be loaded' }));
});
