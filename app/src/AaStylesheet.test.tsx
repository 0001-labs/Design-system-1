// @vitest-environment happy-dom
import { expect, test, vi } from 'vite-plus/test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { AaStylesheet } from './AaStylesheet';

test('Aa keeps CSS as plain text and accepts both typing and token updates', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host), change = vi.fn();
  const original = ':root {\n  --accent: #fff;\n}\n/* **literal CSS** */';
  try {
    await act(async () => root.render(createElement(AaStylesheet, { value: original, onChange: change })));
    const block = host.querySelector<HTMLElement>('[contenteditable]')!;
    // Happy DOM does not load the imported workbench stylesheet.
    block.style.whiteSpace = 'pre';
    expect(block.textContent).toBe(original);
    expect(block.getAttribute('contenteditable')).toBe('plaintext-only');
    expect(change).not.toHaveBeenCalled();
    await act(async () => { block.innerText = 'body { color: red; }'; block.dispatchEvent(new Event('input', {bubbles: true})); });
    expect(change).toHaveBeenLastCalledWith('body { color: red; }');
    await act(async () => root.render(createElement(AaStylesheet, { value: ':root { --accent: blue; }', onChange: change })));
    expect(block.textContent).toBe(':root { --accent: blue; }');
    expect(change).toHaveBeenCalledOnce();
  } finally { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); }
});
