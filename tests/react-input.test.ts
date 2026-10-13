// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, test, vi } from 'vite-plus/test';
import React, { act, createElement, createRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Input, type InputElement } from '../DS1/react/input';
vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')));
await import('../DS1/2-core/ds-input');
let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
async function input() {
  const field = host.querySelector('ds-input')!; await field.updateComplete;
  return { field, native: field.shadowRoot!.querySelector('input')! };
}
async function type(native: HTMLInputElement, value: string) {
  await act(async () => {
    native.value = value; native.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  });
  await host.querySelector('ds-input')!.updateComplete;
}

test('controlled values, formatted edits, focus and selection use the shared control', async () => {
  const ref = createRef<InputElement>();
  function Field() {
    const [value, setValue] = useState('First');
    return createElement(Input, { ref, value, onChange: event => setValue(event.target.value.toUpperCase()), 'aria-label': 'Name' });
  }
  await act(async () => root.render(createElement(Field)));
  const { field, native } = await input();
  expect(ref.current).toBe(field);
  expect(native.value).toBe('First');
  await type(native, 'edited');
  expect(native.value).toBe('EDITED');
  expect(field.value).toBe('EDITED');
  ref.current!.focus(); ref.current!.setSelectionRange(1, 3);
  expect(host.ownerDocument.activeElement).toBe(field);
  expect(field.selectionStart).toBe(1); expect(field.selectionEnd).toBe(3);
});

test('a rejected controlled edit is restored even without a parent state change', async () => {
  const changed = vi.fn();
  await act(async () => root.render(createElement(Input, { value: 'Fixed', onChange: changed })));
  const { native } = await input();
  await type(native, 'Rejected');
  expect(changed).toHaveBeenCalledTimes(1);
  expect(native.value).toBe('Fixed');
});

test('uncontrolled values survive parent renders and reset to the initial value', async () => {
  const render = (disabled = false) => createElement(Input, { defaultValue: 'Initial', disabled });
  await act(async () => root.render(render()));
  const { native, field } = await input();
  await type(native, 'Edited');
  await act(async () => root.render(render(true)));
  await field.updateComplete;
  expect(native.value).toBe('Edited');
  field.formResetCallback(); await field.updateComplete;
  expect(native.value).toBe('Initial');
});

test('controlled form reset retains application state and forwards native hints', async () => {
  await act(async () => root.render(createElement(Input, { value: 'Current', readOnly: true, inputMode: 'numeric', autoComplete: 'one-time-code', maxLength: 6, 'aria-invalid': false })));
  const { native, field } = await input();
  await act(async () => field.formResetCallback()); await field.updateComplete;
  expect(native.value).toBe('Current');
  expect(native.readOnly).toBe(true); expect(native.inputMode).toBe('numeric');
  expect(native.maxLength).toBe(6); expect(native.autocomplete).toBe('one-time-code');
  expect(native.getAttribute('aria-invalid')).toBe('false');
});

test('application Enter handlers can cancel implicit submission', async () => {
  const submit = vi.fn((event: Event) => event.preventDefault());
  const render = (cancel: boolean) => createElement('form', { onSubmit: submit }, createElement(Input, { onKeyDown: event => { if (cancel) event.preventDefault(); } }), createElement('button', { type: 'submit' }, 'Save'));
  await act(async () => root.render(render(true)));
  const { field, native } = await input();
  // happy-dom does not associate custom controls with forms; native browser
  // coverage separately verifies ElementInternals and validation.
  Object.defineProperty(field, 'form', { get: () => host.querySelector('form') });
  await act(async () => native.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true, cancelable: true })));
  await act(async () => new Promise(resolve => setTimeout(resolve, 0)));
  expect(submit).not.toHaveBeenCalled();
  await act(async () => root.render(render(false)));
  await act(async () => native.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true, cancelable: true })));
  await act(async () => new Promise(resolve => setTimeout(resolve, 0)));
  expect(submit).toHaveBeenCalledTimes(1);
});

test('external descriptions, form ownership and spelling hints reach the field', async () => {
  const render = (spellCheck: boolean) => createElement(React.Fragment, null,
    createElement('p', { id: 'hint' }, 'Use your project name'),
    createElement(Input, { form: 'editor', 'aria-describedby': 'hint', spellCheck }));
  await act(async () => root.render(render(false)));
  const { field, native } = await input();
  expect(field.getAttribute('form')).toBe('editor');
  expect(native.getAttribute('spellcheck')).toBe('false');
  expect(native.getAttribute('aria-describedby')).toBe('description');
  expect(field.shadowRoot!.getElementById('description')!.textContent).toBe('Use your project name');
  await act(async () => root.render(render(true)));
  await field.updateComplete;
  expect(native.getAttribute('spellcheck')).toBe('true');
});

test('focus and keyboard handlers get the current element and native event methods', async () => {
  const focus = vi.fn(); const keys = vi.fn();
  await act(async () => root.render(createElement(Input, { onFocus: focus, onKeyDown: event => {
    event.preventDefault(); keys(event.currentTarget, event.nativeEvent, event.isDefaultPrevented());
  } })));
  const { field, native } = await input();
  await act(async () => native.dispatchEvent(new FocusEvent('focusin', { bubbles: true, composed: true })));
  expect(focus.mock.calls[0][0].currentTarget).toBe(field);
  const key = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true, cancelable: true });
  await act(async () => native.dispatchEvent(key));
  expect(keys).toHaveBeenCalledWith(field, key, true);
});
