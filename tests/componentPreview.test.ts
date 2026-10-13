// @vitest-environment happy-dom
import { expect, test, vi } from 'vite-plus/test';
import { EXAMPLES } from '../website/src/lib/component-examples';

vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')));
const documentationStorage = window.localStorage;
document.body.innerHTML = `<main id="sample">${EXAMPLES.tooltip.html}</main><output id="event-output"></output>`;
document.body.dataset.exampleId = 'tooltip';
await import('../website/src/lib/example-runtime');

test('the actual preview entry registers and renders the button and opens its tooltip', async () => {
  const button = document.querySelector('ds-button')!;
  const tooltip = document.querySelector('ds-tooltip')!;
  await button.updateComplete;
  await tooltip.updateComplete;
  expect(button.shadowRoot?.querySelector('button')?.hasAttribute('secondary')).toBe(true);
  await tooltip.updateComplete;
  const bubble = tooltip.shadowRoot?.querySelector<HTMLElement>('.bubble');
  const visible = () => bubble?.getAttribute('role') === 'tooltip' ? !bubble.hidden : bubble?.classList.contains('visible');
  expect(bubble?.textContent).toBe('Save your changes');
  expect(visible()).toBe(true);
  button.shadowRoot!.querySelector('button')!.click();
  expect(document.querySelector('#event-output')?.textContent).toContain('click: Hover or focus me');
  tooltip.dispatchEvent(new MouseEvent('mouseleave'));
  await tooltip.updateComplete;
  expect(visible()).toBe(false);
});

test('trying a preview setting never writes the documentation storage', () => {
  window.localStorage.setItem('preview-only', 'value');
  expect(window.localStorage.getItem('preview-only')).toBe('value');
  expect(documentationStorage.getItem('preview-only')).toBeNull();
});
