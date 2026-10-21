// @vitest-environment happy-dom
import { expect, test, vi } from 'vite-plus/test';
import './AaStylesheet';
import type { AaStylesheet } from './AaStylesheet';

test('Aa keeps CSS as plain text and accepts both typing and token updates', async () => {
  const change = vi.fn();
  const original = ':root {\n  --accent: #fff;\n}\n/* **literal CSS** */';
  const stylesheet = document.createElement('ds1-aa-stylesheet') as AaStylesheet;
  stylesheet.value = original;
  stylesheet.addEventListener('stylesheet-change', event => change((event as CustomEvent<string>).detail));
  document.body.append(stylesheet);
  try {
    await stylesheet.updateComplete;
    const block = stylesheet.querySelector<HTMLElement>('[contenteditable]')!;
    // Happy DOM does not load the imported workbench stylesheet.
    block.style.whiteSpace = 'pre';
    expect(block.textContent).toBe(original);
    expect(block.getAttribute('contenteditable')).toBe('plaintext-only');
    expect(change).not.toHaveBeenCalled();
    block.innerText = 'body { color: red; }';
    block.dispatchEvent(new Event('input', { bubbles: true }));
    expect(change).toHaveBeenLastCalledWith('body { color: red; }');
    stylesheet.value = ':root { --accent: blue; }';
    await stylesheet.updateComplete;
    expect(block.textContent).toBe(':root { --accent: blue; }');
    expect(change).toHaveBeenCalledOnce();
  } finally { stylesheet.remove(); }
});
