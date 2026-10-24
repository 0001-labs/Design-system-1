// @vitest-environment happy-dom
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

test('a decorative window can switch to a browser and back to device status', async () => {
  const { DsAppChrome } = await import('../DS1/5-visual-kit/app-chrome');
  const chrome = new DsAppChrome();
  chrome.kind = 'macos-compact';
  document.body.append(chrome);
  await chrome.updateComplete;
  expect(chrome.shadowRoot?.querySelector('.lights svg')).toBeNull();
  chrome.kind = 'chrome';
  await chrome.updateComplete;
  await new Promise(resolve => setTimeout(resolve, 0));
  await chrome.updateComplete;
  expect(chrome.shadowRoot?.querySelector('path[d="chrome-back"]')).not.toBeNull();
  chrome.kind = 'ios';
  await chrome.updateComplete;
  expect(chrome.shadowRoot?.querySelector('.clock')?.textContent).toBe('00:01');
  chrome.remove();
});
