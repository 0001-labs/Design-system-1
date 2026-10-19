// @vitest-environment happy-dom
import { expect, test, vi } from 'vite-plus/test';
const copyText = vi.hoisted(() => vi.fn().mockResolvedValue(true));
vi.mock('../DS1/0-face/copy-text', () => ({ copyText }));
import { connectCodeCopy } from '../website/src/lib/code-copy';
test('code copy uses one DS1 message path and preserves the original source', () => {
  const host = document.createElement('div');
  host.className = 'expressive-code';
  host.innerHTML = '<div class="copy"><button data-code=""><span>Copy</span></button></div>';
  const button = host.querySelector('button')!;
  button.dataset.code = 'const a = "<>&";\u007f  save(a);';
  const pluginFeedback = vi.fn(); button.addEventListener('click', pluginFeedback);
  document.body.append(host);
  const stop = connectCodeCopy();
  try {
    host.querySelector('span')!.click();
    expect(copyText).toHaveBeenCalledExactlyOnceWith('const a = "<>&";\n  save(a);');
    expect(pluginFeedback).not.toHaveBeenCalled();
    const ordinary = document.createElement('button'); host.append(ordinary);
    ordinary.addEventListener('click', pluginFeedback); ordinary.click();
    expect(pluginFeedback).toHaveBeenCalledOnce();
    expect(copyText).toHaveBeenCalledOnce();
  } finally { stop(); host.remove(); }
});
