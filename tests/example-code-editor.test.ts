// @vitest-environment happy-dom
import { expect, test } from 'vite-plus/test';
import { codeDocument, mountCodeEditors } from '../website/src/lib/example-code-editor';

test('code fences remain literal and the editor cannot accept edits', () => {
  const source = '<script>const sample = ````literal``` important`;</script>';
  expect(codeDocument(source, 'html')).toBe('`````html\n' + source + '\n`````');
  const container = document.createElement('div');
  container.innerHTML = '<div class="example-code-block"><div data-code-editor></div><pre><code data-source="html"></code></pre></div>';
  container.querySelector('code')!.textContent = source;
  document.body.append(container);
  mountCodeEditors(container);
  const host = container.querySelector<HTMLElement>('[data-code-editor]')!;
  expect(host.getAttribute('aria-readonly')).toBe('true');
  expect(host.querySelector('[contenteditable="true"]')).toBeNull();
  expect(host.querySelector('script')).toBeNull();
  expect(host.textContent).toContain(source);
  expect(container.querySelector('pre')!.hidden).toBe(true);
  expect(container.querySelector('code')!.textContent).toBe(source);
  const event = new InputEvent('beforeinput', { inputType: 'insertText', data: 'changed', bubbles: true, cancelable: true });
  host.querySelector('.aa-block')!.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  expect(host.textContent).toContain(source);
  container.remove();
});
