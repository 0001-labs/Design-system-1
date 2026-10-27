import { expect, test, vi } from 'vite-plus/test';
import { define } from '../DS1/0-face/define';

test('registers elements when a registry exists without a document', () => {
  const register = vi.fn();
  vi.stubGlobal('customElements', { get: () => undefined, define: register });
  class Element { createRenderRoot() {} }
  try {
    expect(() => define('test-element', Element as unknown as CustomElementConstructor)).not.toThrow();
    expect(register).toHaveBeenCalledOnce();
  } finally {
    vi.unstubAllGlobals();
  }
});
