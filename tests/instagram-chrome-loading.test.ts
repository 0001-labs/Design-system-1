// @vitest-environment happy-dom
import { expect, test, vi } from 'vite-plus/test';

// The overlay's module counts its loads and waits until the test lets it arrive.
const overlay = vi.hoisted(() => {
  let release = () => {};
  return { loaded: vi.fn(), arrived: new Promise<void>(resolve => { release = resolve; }), release: () => release() };
});
vi.mock('../DS1/5-visual-kit/instagram', async (original) => {
  overlay.loaded();
  await overlay.arrived;
  return original();
});
import { DsAppChrome } from '../DS1/5-visual-kit/app-chrome';

const ticks = async () => { for (let tick = 0; tick < 5; tick++) await new Promise(resolve => setTimeout(resolve, 0)); };

test('other presentations never load the Reels overlay', async () => {
  for (const kind of ['macos-compact', 'macos', 'ios', 'safari'] as const) {
    const chrome = new DsAppChrome();
    chrome.kind = kind;
    document.body.append(chrome);
    await chrome.updateComplete;
    chrome.remove();
  }
  expect(overlay.loaded).not.toHaveBeenCalled();
});

test('Instagram draws its frame and media at once, and updateComplete waits for the overlay', async () => {
  const chrome = new DsAppChrome();
  chrome.kind = 'instagram';
  chrome.append(document.createElement('video'));
  document.body.append(chrome);
  let settled = false;
  void chrome.updateComplete.then(() => { settled = true; });
  await ticks();
  const root = chrome.shadowRoot!;
  // While the overlay loads: the frame and its slot are drawn, so the picture shows; nothing else is.
  expect(overlay.loaded).toHaveBeenCalledTimes(1);
  expect(root.querySelector('.reels .reels-media slot')).not.toBeNull();
  expect(root.querySelector('.reels-header')).toBeNull();
  expect(settled).toBe(false);
  overlay.release();
  await chrome.updateComplete;
  expect(root.querySelector('.reels-header')?.textContent).toContain('Reels');
  expect(root.querySelector<HTMLButtonElement>('button[aria-label="Like"]')?.disabled).toBe(true);
  chrome.remove();
});
