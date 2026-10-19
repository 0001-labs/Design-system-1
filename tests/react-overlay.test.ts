// @vitest-environment happy-dom
import { expect, test, vi } from "vite-plus/test";
import { act, createElement as h, useState } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { Overlay, OverlayContent, OverlayTitle, OverlayDescription } from "../DS1/react/overlay";
vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
await import("../DS1/4-page/ds-overlay");

test("React keeps close decisions controlled, forwards events and links accessible text", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const mount = document.createElement("div"); document.body.append(mount);
  const root = createRoot(mount); const requested = vi.fn(); const submit = vi.fn();
  function Example({ allow = false }) {
    const [open, setOpen] = useState(true);
    return h(Overlay, { open, onOpenChange: (value, reason) => { requested(value, reason); if (allow) setOpen(value); } },
      h(OverlayContent, { closeLabel: "Dismiss example" },
        h(OverlayTitle, null, "Example title"), h(OverlayDescription, null, "Example description"),
        h("form", { onSubmit: event => { event.preventDefault(); submit(event.currentTarget); } }, h("button", { type: "submit" }, "Save"))));
  }
  try {
    await act(async () => root.render(h(Example)));
    const native = document.querySelector("dialog")!;
    expect(native.open).toBe(true);
    expect(document.getElementById(native.getAttribute("aria-labelledby")!)?.textContent).toBe("Example title");
    expect(document.getElementById(native.getAttribute("aria-describedby")!)?.textContent).toBe("Example description");
    await act(async () => native.querySelector('button[type="submit"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(submit).toHaveBeenCalledExactlyOnceWith(native.querySelector("form"));
    await act(async () => native.querySelector<HTMLButtonElement>('[aria-label="Dismiss example"]')!.click());
    expect(requested).toHaveBeenCalledWith(false, "button"); expect(native.open).toBe(true);
    await act(async () => root.render(h(Example, { allow: true })));
    await act(async () => native.dispatchEvent(new Event("cancel", { cancelable: true })));
    expect(document.querySelector("dialog")).toBeNull();
    expect(document.documentElement.style.overflow).toBe("");
  } finally { await act(async () => root.unmount()); mount.remove(); }
});

test("an initially open modal hydrates without a mismatched portal or duplicate dialog", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const view = h(Overlay, { open: true }, h(OverlayContent, null, h(OverlayTitle, null, "Hydrated dialog")));
  const mount = document.createElement("div");
  mount.innerHTML = renderToString(view);
  document.body.append(mount);
  const recover = vi.fn();
  let root: ReturnType<typeof hydrateRoot>;
  await act(async () => { root = hydrateRoot(mount, view, { onRecoverableError: recover }); });
  try {
    expect(recover).not.toHaveBeenCalled();
    expect(document.querySelectorAll("dialog")).toHaveLength(1);
    expect(document.querySelector("dialog")!.open).toBe(true);
    expect(document.querySelector('dialog [data-ds-overlay="title"]')!.textContent).toBe("Hydrated dialog");
  } finally { await act(async () => root!.unmount()); mount.remove(); }
});

test("React modeless panels retain their layout, native ref and controlled outside close", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const mount = document.createElement('div'); document.body.append(mount);
  const root = createRoot(mount); const requested = vi.fn(); const nativeRef = { current: null as HTMLDialogElement | null };
  const outside = document.createElement('button'); document.body.append(outside);
  function Example({ allow = false }) {
    const [open, setOpen] = useState(true);
    return h(Overlay, { open, onOpenChange: (value, reason) => { requested(value, reason); if (allow) setOpen(value); } },
      h(OverlayContent, { nonModal: true, portal: false, closeOnOutside: true, showClose: false, ref: nativeRef, 'aria-label': 'Floating tools' },
        h('button', null, 'Local action')));
  }
  try {
    await act(async () => root.render(h(Example)));
    const native = nativeRef.current!;
    expect(mount.contains(native)).toBe(true); expect(native.open).toBe(true);
    expect(document.documentElement.style.overflow).toBe('');
    await act(async () => { outside.dispatchEvent(new Event('pointerdown', { bubbles: true })); outside.click(); });
    expect(requested).toHaveBeenCalledWith(false, "outside"); expect(native.open).toBe(true);
    await act(async () => root.render(h(Example, { allow: true })));
    await act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(nativeRef.current).toBeNull(); expect(mount.querySelector('dialog')).toBeNull();
  } finally { await act(async () => root.unmount()); mount.remove(); outside.remove(); }
});

test('a modeless panel returns focus to a launcher remounted by React', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const mount = document.createElement('div'); document.body.append(mount);
  const root = createRoot(mount);
  function Example() {
    const [open, setOpen] = useState(false);
    return h('div', null,
      !open && h('button', { 'data-launcher': '', onClick: () => setOpen(true) }, 'Open tools'),
      h(Overlay, { open, onOpenChange: setOpen },
        h(OverlayContent, { nonModal: true, portal: false, returnFocus: () => mount.querySelector<HTMLElement>('[data-launcher]'), 'aria-label': 'Tools' },
          h('button', null, 'Tool action'))));
  }
  try {
    await act(async () => root.render(h(Example)));
    await act(async () => mount.querySelector<HTMLButtonElement>('[data-launcher]')!.click());
    mount.querySelector<HTMLButtonElement>('dialog button')!.focus();
    await act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(mount.querySelector('dialog')).toBeNull();
    expect(document.activeElement).toBe(mount.querySelector('[data-launcher]'));
  } finally { await act(async () => root.unmount()); mount.remove(); }
});
