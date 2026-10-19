// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
import { act, createElement as h, createRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { TokenField, Token } from "../DS1/react/token-field";
import "../DS1/3-unit/ds-token-field";
// The native value setter, as a browser sets the value, so React sees the change.
const nativeValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!;
const setValue = (element: HTMLInputElement, value: string) => nativeValue.set!.call(element, value);
afterEach(() => document.body.replaceChildren());
async function settle() { await Promise.all(Array.from(document.querySelectorAll<any>('ds-token-field, ds-token, ds-menu, ds-button'), node => node.updateComplete)); }
function key(input: HTMLInputElement, key: string, options = {}) { const event = new KeyboardEvent('keydown', {key, bubbles: true, cancelable: true, ...options}); input.dispatchEvent(event); return event; }

test('native labels, forms, validation and external options remain connected; suggestions retain focus and Enter selects once', async () => {
  document.body.innerHTML = '<form><label for="entry">People</label><ds-token-field choose-label="Choose people"><input id="entry" name="draft" required><ds-menu><button role="option">One</button><button role="option" disabled>Disabled</button><button role="option">Two</button></ds-menu></ds-token-field><button>Send</button></form>';
  const host = document.querySelector('ds-token-field')!, input = host.querySelector('input')!, menu = host.querySelector('ds-menu')!, select = vi.fn(), commit = vi.fn();
  menu.lastElementChild!.addEventListener('click', select); host.addEventListener('ds-token-commit', commit);
  await settle(); input.focus(); await settle();
  expect(input.labels![0].textContent).toBe('People'); expect(input.getRootNode()).toBe(menu.getRootNode());
  expect(input.getAttribute('aria-expanded')).toBe('true'); expect(input.checkValidity()).toBe(false);
  key(input, 'ArrowDown'); await settle();
  expect(document.getElementById(input.getAttribute('aria-activedescendant')!)?.textContent).toBe('Two');
  expect(key(input, 'Enter').defaultPrevented).toBe(true); expect(select).toHaveBeenCalledTimes(1); expect(commit).not.toHaveBeenCalled(); expect(document.activeElement).toBe(input);
  menu.lastElementChild!.setAttribute('aria-disabled','true'); await settle();
  expect(document.getElementById(input.getAttribute('aria-activedescendant')!)?.textContent).toBe('One');
  expect(menu.lastElementChild!.getAttribute('aria-selected')).toBe('false');
  key(input, 'Escape'); await settle(); expect(input.getAttribute('aria-expanded')).toBe('false'); expect(input.hasAttribute('aria-activedescendant')).toBe(false);
  input.value = 'hello@example.com'; expect(new FormData(input.form!).get('draft')).toBe('hello@example.com');
  key(input,'Enter'); expect(commit).toHaveBeenCalledTimes(1);
});

test('IME and editing modifiers do not commit; separators, blur and empty Backspace request changes without mutating values', async () => {
  document.body.innerHTML = '<ds-token-field><ds-token value="one" label="One" remove-label="Remove One"></ds-token><input value="original"></ds-token-field><button id="outside">Outside</button>';
  const host = document.querySelector('ds-token-field')!, input = host.querySelector('input')!, commit = vi.fn(), remove = vi.fn();
  host.addEventListener('ds-token-commit', commit); host.addEventListener('ds-token-remove', remove); await settle();
  key(input,'Enter',{isComposing:true}); key(input,',',{ctrlKey:true}); expect(commit).not.toHaveBeenCalled();
  key(input,','); expect(commit).toHaveBeenCalledTimes(1); expect(input.value).toBe('original');
  input.value=''; key(input,'Backspace'); expect(remove).toHaveBeenCalledTimes(1); expect(host.querySelector('ds-token')).not.toBeNull();
  input.value='another'; input.focus(); document.getElementById('outside')!.focus(); expect(commit).toHaveBeenCalledTimes(2);
  input.disabled=true; await settle(); host.refresh(); key(input,'Enter'); expect(commit).toHaveBeenCalledTimes(2);
  host.querySelector('ds-token')!.requestRemove(); expect(remove).toHaveBeenCalledTimes(1);
});

test('controlled edits, token removal, paste, refs and SSR preserve product ownership', async () => {
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  const mount=document.createElement('div'); document.body.append(mount); const root=createRoot(mount), ref=createRef<HTMLInputElement>(), commit=vi.fn();
  function Example() {
    const [draft,setDraft]=useState(''),[values,setValues]=useState(['one']);
    return h(TokenField,{ref,name:'draft',value:draft,onChange:event=>{if(event.target.value!=='reject')setDraft(event.target.value);},onCommit:request=>{commit(request);setDraft('');}, tokens:values.map(value=>h(Token,{key:value,value,label:value,removeLabel:'Remove '+value,onRemove:removed=>setValues(current=>current.filter(entry=>entry!==removed))}))});
  }
  try {
    await act(async()=>root.render(h(Example))); await settle();
    await act(async()=>{setValue(ref.current!,'reject');ref.current!.dispatchEvent(new Event('input',{bubbles:true}));}); expect(ref.current!.value).toBe('');
    await act(async()=>{setValue(ref.current!,'one,two');ref.current!.dispatchEvent(new Event('input',{bubbles:true}));});
    expect(commit).toHaveBeenCalledWith({text:'one,two',reason:'input'}); expect(ref.current!.value).toBe('');
    await act(async()=>key(ref.current!,'Backspace')); expect(mount.querySelector('ds-token')).toBeNull(); expect(document.activeElement).toBe(ref.current);
    expect(renderToString(h(TokenField,{name:'draft',defaultValue:'Server'}))).toContain('<input name="draft" value="Server"');
  } finally {await act(async()=>root.unmount());}
});

test('reconnect restores semantics and disabling a native fieldset blocks edits', async()=>{
  document.body.innerHTML='<fieldset><ds-token-field><input role="searchbox"><ds-menu><button role="option">One</button></ds-menu></ds-token-field></fieldset>';
  const host=document.querySelector('ds-token-field')!,input=host.querySelector('input')!,commit=vi.fn(); host.addEventListener('ds-token-commit',commit); await settle();
  host.remove(); expect(input.getAttribute('role')).toBe('searchbox'); document.querySelector('fieldset')!.append(host); await settle(); expect(input.getAttribute('role')).toBe('combobox');
  document.querySelector('fieldset')!.disabled=true; host.formDisabledCallback(true); input.value='one'; key(input,'Enter'); expect(commit).not.toHaveBeenCalled();
});

test('a Select takes the suggestions as the engine did: the field steers it and it stays open on a choice', async () => {
  await import('../DS1/3-unit/ds-select');
  document.body.innerHTML = '<label for="who">People</label><ds-token-field choose-label="Choose people"><input id="who"><ds-select slot="suggestions" role="listbox" aria-label="Choose people"><button role="option">One</button><button role="option">Two</button></ds-select></ds-token-field>';
  const host = document.querySelector('ds-token-field')!, input = host.querySelector('input')!, list = host.querySelector('ds-select')!;
  const settled = async () => { await settle(); await list.updateComplete; await settle(); };
  await settled(); input.focus(); await settled();
  expect(list.controller).toBe(input);
  expect(list.getAttribute('role')).toBe('listbox');
  expect(input.getAttribute('aria-expanded')).toBe('true');
  key(input, 'ArrowDown'); await settled();
  expect(document.getElementById(input.getAttribute('aria-activedescendant')!)?.textContent).toBe('Two');
  list.querySelector<HTMLButtonElement>('button')!.click(); await Promise.resolve(); await settled();
  expect(list.open).toBe(true);
});
