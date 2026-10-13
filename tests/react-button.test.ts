// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from 'vite-plus/test';
import React, { act, createElement, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '../DS1/react/button';
vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')));
await import('../DS1/2-core/ds-button');
afterEach(() => document.body.replaceChildren());

test('the shared button preserves native refs, event targets, labels and changing disabled state', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const mount = document.createElement('div'); document.body.append(mount);
  const root = createRoot(mount); const ref = createRef<HTMLButtonElement>(); const click = vi.fn();
  const render = async (disabled = false) => act(async () => root.render(createElement(Button, { ref, disabled, primary: true, id: 'save', className: 'layout', 'aria-label': 'Save document', onClick: e => click(e.currentTarget) }, 'Save')));
  try {
    await render();
    const host = mount.querySelector('ds-button')!; await host.updateComplete;
    const native = mount.querySelector('button')!;
    expect(ref.current).toBe(native); expect(native.id).toBe('save');
    expect(native.getAttribute('aria-label')).toBe('Save document');
    expect(host.className).toBe('layout'); expect(host.hasAttribute('role')).toBe(false);
    expect(host.shadowRoot!.querySelector('button')).toBeNull();
    host.focus(); expect(document.activeElement).toBe(native);
    native.click(); expect(click).toHaveBeenCalledExactlyOnceWith(native);
    await render(true); await host.updateComplete; native.click();
    expect(native.disabled).toBe(true); expect(click).toHaveBeenCalledTimes(1);
    await render(false); await host.updateComplete; native.click();
    expect(click).toHaveBeenCalledTimes(2);
  } finally { await act(async () => root.unmount()); }
});

test('HTML slotted controls forward disabled and preserve their form owner', async () => {
  document.body.innerHTML = '<form id="document"><ds-button control="slotted" disabled><button type="submit" name="action" value="save">Save</button></ds-button></form>';
  const host = document.querySelector('ds-button')!; await host.updateComplete;
  const native = host.querySelector('button')!;
  expect(native.form?.id).toBe('document'); expect(native.disabled).toBe(true);
  host.disabled = false; await host.updateComplete; expect(native.disabled).toBe(false);
});
