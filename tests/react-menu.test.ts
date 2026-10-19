// @vitest-environment happy-dom
import { act, createElement as h, useState } from "react";
import { createRoot } from "react-dom/client";
import { expect, test, vi } from "vite-plus/test";
import { MenuHost as Menu } from "../DS1/react/menu-engine";
await import("../DS1/3-unit/ds-menu");

test("controlled React menus can decline selection and close requests, then unmount with focus return", async () => {
  Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
  const host = document.createElement("div"), field = document.createElement("textarea");
  document.body.append(field, host); field.focus();
  const root = createRoot(host), requested = vi.fn();
  function Example({allow = false}) {
    const [open, setOpen] = useState(true), [active, setActive] = useState("one");
    return open ? h(Menu, {open, controller: field, anchor: field, activeId: active,
      onActiveChange: value => { requested(value); if (allow) setActive(value); },
      onOpenChange: (value, reason) => { requested(reason); if (allow) setOpen(value); },
    }, h("button", {role: "option", id: "one"}, "One"), h("button", {role: "option", id: "two"}, "Two")) : null;
  }
  async function key(key: string) { await act(async () => field.dispatchEvent(new KeyboardEvent("keydown", {key, bubbles: true, cancelable: true}))); }
  try {
    await act(async () => root.render(h(Example)));
    await key("ArrowDown"); expect(requested).toHaveBeenLastCalledWith("two"); expect(host.querySelector("ds-menu")!.activeId).toBe("one");
    await key("Escape"); expect(requested).toHaveBeenLastCalledWith("escape"); expect(host.querySelector("ds-menu")!.open).toBe(true);
    await act(async () => root.render(h(Example, {allow: true})));
    await key("ArrowDown"); expect(host.querySelector("ds-menu")!.activeId).toBe("two"); expect(document.activeElement).toBe(field);
    await key("Escape"); expect(host.querySelector("ds-menu")).toBeNull(); expect(document.activeElement).toBe(field);
  } finally { await act(async () => root.unmount()); host.remove(); field.remove(); }
});
