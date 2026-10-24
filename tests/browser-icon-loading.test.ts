import { expect, test, vi } from 'vite-plus/test';

const loaded = vi.hoisted(() => vi.fn());
vi.mock('../DS1/5-visual-kit/native-icon-paths', () => {
  loaded();
  return { chromiumIcons: { back: { size: 24, path: 'chrome-back' } }, edgeIcons: { back: { size: 20, path: 'edge-back' } } };
});
import { browserIcon, loadBrowserIcons } from '../DS1/5-visual-kit/browser-icons';

test('Apple presentations avoid native browser payloads; browser variants load once and keep their glyphs', async () => {
  for (const kind of ['macos', 'macos-compact', 'ios', 'ipados', 'safari', 'safari-ios']) await loadBrowserIcons(kind);
  expect(loaded).not.toHaveBeenCalled();
  await Promise.all([loadBrowserIcons('chrome'), loadBrowserIcons('edge')]);
  expect(loaded).toHaveBeenCalledTimes(1);
  expect(browserIcon('back', 'chrome').values).toContain('chrome-back');
  expect(browserIcon('back', 'edge').values).toContain('edge-back');
});
