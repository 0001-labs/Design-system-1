// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from 'vite-plus/test';
const state = vi.hoisted(() => ({ load: vi.fn(), report: vi.fn() }));
vi.mock('../DS1/0-face/i18n', () => ({ configureI18n: vi.fn(), getBrowserLanguage: () => 'en', setLanguage: vi.fn(), loadTranslations: state.load }));
vi.mock('../DS1/0-face/theme', () => ({ followSystemTheme: vi.fn() }));
vi.mock('../DS1/0-face/failures', () => ({ reportFailure: state.report }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); vi.resetModules(); });

test('documentation translations are available when runtime requests fail', async () => {
  const fetcher = vi.fn().mockRejectedValue(new TypeError('Load failed'));
  vi.stubGlobal('fetch', fetcher);
  await expect(import('../website/src/lib/public-preferences')).resolves.toBeDefined();
  expect(state.load).toHaveBeenCalledWith(expect.objectContaining({ fr: expect.objectContaining({ About: 'À propos' }) }));
  expect(fetcher).not.toHaveBeenCalled();
  expect(state.report).not.toHaveBeenCalled();
});

test('the public catalogue endpoint serves the same bundled source', async () => {
  const { GET, prerender } = await import('../website/src/pages/translations.json');
  const catalogue = (await import('../website/src/data/translations.json')).default;
  const response = GET();
  expect(prerender).toBe(true);
  expect(response.headers.get('content-type')).toContain('application/json');
  expect(await response.json()).toEqual(catalogue);
});
