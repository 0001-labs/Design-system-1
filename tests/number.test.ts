// @vitest-environment happy-dom
import { afterEach, expect, test } from 'vite-plus/test';
import '../DS1/2-core/ds-number';
import { formatNumberValue, readNumberExpression, stepPlaces } from '../DS1/2-core/number-expression';
import type { NumberField } from '../DS1/2-core/ds-number';
afterEach(() => document.body.replaceChildren());

async function field(html: string) {
  document.body.innerHTML = html;
  const element = document.querySelector('ds-number') as NumberField;
  await element.updateComplete;
  return { element, input: element.shadowRoot!.querySelector('input')!, lead: element.shadowRoot!.querySelector('.lead') as HTMLElement | null };
}
const key = (input: HTMLInputElement, key: string, shiftKey = false) => input.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true }));

test('typed arithmetic, with an operator first working on the value already there', () => {
  expect(readNumberExpression('12')).toBe(12);
  expect(readNumberExpression('10 + 5')).toBe(15);
  expect(readNumberExpression('(3 − 1) × 4')).toBe(8);
  expect(readNumberExpression('*2', 21)).toBe(42);
  expect(readNumberExpression('/2', 112)).toBe(56);
  expect(readNumberExpression('÷4', 10)).toBe(2.5);
  expect(readNumberExpression('+10', 5)).toBe(15);
  expect(readNumberExpression('-9', 5)).toBe(-9);
  expect(readNumberExpression('−9')).toBe(-9);
  expect(readNumberExpression('12px')).toBe(12);
  expect(readNumberExpression('1,5')).toBe(1.5);
  for (const text of ['', 'abc', '2 +', '(1', '1/0']) expect(readNumberExpression(text)).toBeNull();
});

test('values are written with the step’s decimals, no trailing zeros and a true minus', () => {
  expect(stepPlaces(1)).toBe(0);
  expect(stepPlaces(0.05)).toBe(2);
  expect(stepPlaces(0.001)).toBe(3);
  expect(formatNumberValue(1.03, 2)).toBe('1.03');
  expect(formatNumberValue(1, 2)).toBe('1');
  expect(formatNumberValue(-9, 0)).toBe('−9');
  expect(formatNumberValue(-0.001, 2)).toBe('0');
});

test('a spinbutton named by its label, the value and unit read out', async () => {
  const { input, lead } = await field('<ds-number label="x" value="-9" unit="cells" min="-100" max="100"></ds-number>');
  expect(input.getAttribute('role')).toBe('spinbutton');
  expect(input.getAttribute('aria-label')).toBe('x');
  expect(input.getAttribute('aria-valuenow')).toBe('-9');
  expect(input.getAttribute('aria-valuetext')).toBe('−9 cells');
  expect(input.value).toBe('−9');
  expect(lead!.textContent!.trim()).toBe('x');
  expect(lead!.getAttribute('aria-hidden')).toBe('true');
});

test('the arrows step from the value, Shift by the big step, inside min and max, each a change', async () => {
  const { element, input } = await field('<ds-number value="1.03" step="0.05" min="0.5" max="4"></ds-number>');
  const changes: number[] = [];
  element.addEventListener('change', () => changes.push(element.value));
  input.dispatchEvent(new FocusEvent('focus'));
  key(input, 'ArrowUp'); await element.updateComplete;
  expect(element.value).toBe(1.08);
  key(input, 'ArrowUp', true); await element.updateComplete;
  expect(element.value).toBe(1.58);
  for (let i = 0; i < 10; i++) key(input, 'ArrowDown', true);
  await element.updateComplete;
  expect(element.value).toBe(0.5);
  expect(changes).toEqual([1.08, 1.58, 1.08, 0.58, 0.5]);
});

test('what is typed is taken on Enter or on leaving, Escape puts the value back', async () => {
  const { element, input } = await field('<ds-number label="y" value="21"></ds-number>');
  let changes = 0;
  element.addEventListener('change', () => changes++);
  input.dispatchEvent(new FocusEvent('focus')); await element.updateComplete;
  input.value = '*2'; input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  key(input, 'Enter'); await element.updateComplete;
  expect(element.value).toBe(42); expect(changes).toBe(1);
  input.value = '7'; input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  key(input, 'Escape'); input.dispatchEvent(new FocusEvent('blur')); await element.updateComplete;
  expect(element.value).toBe(42); expect(input.value).toBe('42'); expect(changes).toBe(1);
  input.dispatchEvent(new FocusEvent('focus')); await element.updateComplete;
  input.value = 'nonsense'; input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  input.dispatchEvent(new FocusEvent('blur')); await element.updateComplete;
  expect(element.value).toBe(42); expect(input.value).toBe('42');
  input.dispatchEvent(new FocusEvent('focus')); await element.updateComplete;
  input.value = '10 + 5'; input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  input.dispatchEvent(new FocusEvent('blur')); await element.updateComplete;
  expect(element.value).toBe(15); expect(changes).toBe(2);
});

test('typing never leaks the inner field’s own input events', async () => {
  const { element, input } = await field('<ds-number value="1"></ds-number>');
  let inputs = 0;
  element.addEventListener('input', () => inputs++);
  input.value = '5'; input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  expect(inputs).toBe(0);
});

test('dragging the lead scrubs a step a pixel, input as it moves and one change at the end; a double-click puts back the default', async () => {
  const { element, lead } = await field('<ds-number label="zoom" value="1" step="0.05" default="1" min="0.5" max="4"></ds-number>');
  lead!.setPointerCapture = () => {};
  const inputs: number[] = []; let changes = 0;
  element.addEventListener('input', () => inputs.push(element.value));
  element.addEventListener('change', () => changes++);
  const pointer = (type: string, clientX: number) => lead!.dispatchEvent(new PointerEvent(type, { pointerId: 1, clientX, button: 0, bubbles: true }));
  pointer('pointerdown', 100); pointer('pointermove', 102); expect(inputs).toEqual([]);
  pointer('pointermove', 104); pointer('pointermove', 110); pointer('pointerup', 110);
  expect(element.value).toBe(1.5); expect(inputs).toEqual([1.2, 1.5]); expect(changes).toBe(1);
  lead!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
  expect(element.value).toBe(1); expect(changes).toBe(2);
});

test('Escape during a drag puts the value back where it began', async () => {
  const { element, lead } = await field('<ds-number label="x" value="21"></ds-number>');
  lead!.setPointerCapture = () => {};
  let changes = 0; element.addEventListener('change', () => changes++);
  const pointer = (type: string, clientX: number) => lead!.dispatchEvent(new PointerEvent(type, { pointerId: 1, clientX, button: 0, bubbles: true }));
  pointer('pointerdown', 0); pointer('pointermove', 5); pointer('pointermove', 15);
  expect(element.value).toBe(36);
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  pointer('pointerup', 15);
  expect(element.value).toBe(21); expect(changes).toBe(0);
});

test('a whole number of squares wide, four by default, and locked when disabled', async () => {
  const { element, lead } = await field('<ds-number label="x" value="3" width="3" disabled></ds-number>');
  expect(element.style.getPropertyValue('--ds-number-squares')).toBe('3');
  lead!.setPointerCapture = () => {};
  lead!.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: 0, button: 0 }));
  lead!.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 50 }));
  expect(element.value).toBe(3);
});

test('drag="value" makes the field the handle: up raises it a step every three pixels, a press without a drag types, a double-click puts back the default', async () => {
  const { element, input } = await field('<ds-number drag="value" value="112" min="70" max="160" default="112" aria-label="Tempo"></ds-number>');
  const face = element.shadowRoot!.querySelector('.face') as HTMLElement;
  face.setPointerCapture = () => {};
  const inputs: number[] = []; let changes = 0;
  element.addEventListener('input', () => inputs.push(element.value));
  element.addEventListener('change', () => changes++);
  const pointer = (type: string, clientY: number) => face.dispatchEvent(new PointerEvent(type, { pointerId: 1, clientY, button: 0, bubbles: true }));
  pointer('pointerdown', 100); pointer('pointermove', 98); expect(inputs).toEqual([]);
  pointer('pointermove', 91); pointer('pointermove', 70); pointer('pointerup', 70);
  expect(inputs).toEqual([115, 122]); expect(element.value).toBe(122); expect(changes).toBe(1);
  pointer('pointerdown', 0); pointer('pointermove', 900); pointer('pointerup', 900);
  expect(element.value).toBe(70);
  let focused = false; input.focus = () => { focused = true; };
  pointer('pointerdown', 50); pointer('pointerup', 50);
  expect(focused).toBe(true); expect(element.value).toBe(70);
  face.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
  expect(element.value).toBe(112);
});
