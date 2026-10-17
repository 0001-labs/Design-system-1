// @vitest-environment happy-dom
import { expect, it } from 'vite-plus/test';
import '../../../../DS1/2-core/ds-button';
import '../../../../DS1/2-core/ds-checkbox';
import '../../../../DS1/2-core/ds-color';
import '../../../../DS1/2-core/ds-file-picker';
import '../../../../DS1/2-core/ds-input';
import '../../../../DS1/2-core/ds-select';
import '../../../../DS1/2-core/ds-swatch';
import '../../../../DS1/3-unit/ds-tabs';
import type { Button } from '../../../../DS1/2-core/ds-button';
import { builderMarkup } from './markup';

it('draws the builder with Design system 1 controls and keeps the editor wired to them', async () => {
  localStorage.clear();
  document.body.innerHTML = builderMarkup();
  await import('./editor');
  const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

  // No browser tooltips and no glyph icons are left in the markup.
  expect(document.querySelector('[title]')).toBeNull();
  expect([...document.querySelectorAll('button, a')].map(control => control.textContent).join(' ')).not.toMatch(/[↶↷↻↔↗↓＋−×]/);

  // The tools are a segmented control: the chosen one is pressed and active.
  const triangle = document.querySelector<HTMLButtonElement>('[data-tool="triangle"]')!;
  expect(triangle.closest('ds-tabs')?.getAttribute('role')).toBe('group');
  triangle.click();
  expect(triangle.getAttribute('aria-pressed')).toBe('true');
  expect(triangle.closest('ds-button')!.hasAttribute('active')).toBe(true);
  expect(document.querySelector('[data-tool="paint"]')!.closest('ds-button')!.hasAttribute('active')).toBe(false);

  // Inks are swatches on choice buttons; adding one also opens the history.
  const inks = () => $('inks').querySelectorAll('ds-button[choice] ds-swatch').length;
  const before = inks();
  const history = $<Button>('history');
  expect(history.segments?.map(segment => segment.disabled)).toEqual([true, true]);
  $('add-ink').click();
  expect(inks()).toBe(before + 1);
  expect(history.segments?.map(segment => segment.disabled)).toEqual([false, true]);
  history.dispatchEvent(new CustomEvent('press', { detail: { value: 'undo' } }));
  expect(inks()).toBe(before);
  expect(history.segments?.map(segment => segment.disabled)).toEqual([true, false]);

  // The shape is a segmented control too; a circle has no corners to set.
  document.querySelector<HTMLButtonElement>('[data-mask="circle"]')!.click();
  expect(document.querySelector('[data-mask="circle"]')!.closest('ds-button')!.hasAttribute('active')).toBe(true);
  expect($<HTMLInputElement>('radius').disabled).toBe(true);

  // The fields are the shared ones, and the open-file control is the shared file picker.
  expect($('drawing-name').localName).toBe('ds-input');
  expect($('ink-hex').localName).toBe('ds-input');
  expect($('file-input').parentElement!.localName).toBe('ds-file-picker');
});
