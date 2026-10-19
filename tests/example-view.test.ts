// @vitest-environment happy-dom
import { expect, test, vi } from 'vite-plus/test';
import { wireExampleView } from '../website/src/lib/example-view';
test('switches back and forth while retaining the preview and reflecting the selected view', () => {
  const example = document.createElement('section');
  example.innerHTML = '<span><button data-example-view-choice="example" aria-pressed="true">Example</button></span><span><button data-example-view-choice="code" aria-pressed="false">Code</button></span><div data-example-preview><input value="Keep this"></div><div data-example-source hidden>Source</div>';
  const preview = example.querySelector<HTMLElement>('[data-example-preview]')!;
  const source = example.querySelector<HTMLElement>('[data-example-source]')!;
  const input = preview.querySelector('input')!;
  const buttons = example.querySelectorAll('button');
  const mount = vi.fn();
  wireExampleView(example, mount);
  buttons[1].click();
  expect(preview.hidden).toBe(true);
  expect(source.hidden).toBe(false);
  expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
  expect(mount).toHaveBeenCalledWith(source);
  buttons[0].click();
  expect(preview.hidden).toBe(false);
  expect(source.hidden).toBe(true);
  expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
  expect(preview.querySelector('input')).toBe(input);
  expect(input.value).toBe('Keep this');
});
