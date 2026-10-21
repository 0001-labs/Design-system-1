// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from 'vite-plus/test';
vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')));
await import('../DS1/3-unit/ds-form');
await import('../DS1/2-core/ds-input');
await import('../DS1/2-core/ds-button');
import type { Form } from '../DS1/3-unit/ds-form';

afterEach(() => document.body.replaceChildren());

async function form(inside: string) {
  document.body.innerHTML = `<ds-form><ds-input name="name" value="Ada"></ds-input>${inside}</ds-form>`;
  const element = document.querySelector('ds-form') as Form;
  await element.updateComplete;
  await document.querySelector('ds-input')!.updateComplete;
  const submitted = vi.fn(), reset = vi.fn();
  element.addEventListener('form-submit', event => submitted((event as CustomEvent).detail.data));
  element.addEventListener('form-reset', reset);
  return { element, submitted, reset };
}

test('a slotted submit button submits the form drawn in the shadow', async () => {
  const { submitted } = await form('<ds-button control="slotted" primary><button type="submit">Join</button></ds-button>');
  document.querySelector('button')!.click();
  await Promise.resolve();
  expect(submitted).toHaveBeenCalledWith({ name: 'Ada' });
});

test('a slotted reset button clears the form', async () => {
  const { reset, submitted } = await form('<ds-button control="slotted"><button type="reset">Clear</button></ds-button>');
  document.querySelector('button')!.click();
  expect(reset).toHaveBeenCalledTimes(1);
  expect(submitted).not.toHaveBeenCalled();
  expect((document.querySelector('ds-input') as HTMLElement & { value: string }).value).toBe('');
});

test('ds-button with type="submit" submits, and a plain button does not', async () => {
  const { submitted } = await form('<button type="button">Other</button><ds-button primary type="submit">Join</ds-button>');
  document.querySelector<HTMLButtonElement>('button[type="button"]')!.click();
  await Promise.resolve();
  expect(submitted).not.toHaveBeenCalled();
  (document.querySelector('ds-button') as HTMLElement).click();
  await Promise.resolve();
  expect(submitted).toHaveBeenCalledTimes(1);
});

test('a disabled or prevented button does not submit', async () => {
  const { submitted } = await form('<button type="submit" disabled>Join</button><button type="submit" class="held">Join</button>');
  document.querySelector<HTMLButtonElement>('[disabled]')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  const held = document.querySelector<HTMLButtonElement>('.held')!;
  held.addEventListener('click', event => event.preventDefault());
  held.click();
  await Promise.resolve();
  expect(submitted).not.toHaveBeenCalled();
});

test('Enter submits from a field but not from a button or a textarea', async () => {
  const { submitted } = await form('<ds-input name="note" multiline></ds-input><button type="reset">Clear</button>');
  const enter = () => new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true });
  const [field, note] = [...document.querySelectorAll('ds-input')] as (HTMLElement & { updateComplete: Promise<boolean> })[];
  await note.updateComplete;
  note.shadowRoot!.querySelector('textarea')!.dispatchEvent(enter());
  document.querySelector('button')!.dispatchEvent(enter());
  await Promise.resolve();
  expect(submitted).not.toHaveBeenCalled();
  field.shadowRoot!.querySelector('input')!.dispatchEvent(enter());
  await Promise.resolve();
  expect(submitted).toHaveBeenCalledTimes(1);
});
