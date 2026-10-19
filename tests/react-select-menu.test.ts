// @vitest-environment happy-dom
import { act, createElement as h, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";
import { Select, type SelectEntry } from "../DS1/react/select";
await import("../DS1/3-unit/ds-select");
await import("../DS1/2-core/ds-button");

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let root: Root, host: HTMLDivElement;
beforeEach(() => { host = document.createElement("div"); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); document.body.replaceChildren(); });

const rows = () => [...host.querySelectorAll<HTMLElement>('[role^="menuitem"]')];
const row = (label: string) => rows().find(node => node.textContent?.includes(label))!;
const click = async (element: HTMLElement) => { await act(async () => { element.click(); await Promise.resolve(); }); };

function Example({ items, onChange = () => {} }: { items: SelectEntry[]; onChange?: (open: boolean) => void }) {
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(true);
  return h("div", null,
    h("button", { ref: setTrigger, type: "button" }, "More"),
    h(Select, { trigger, open, items, onOpenChange: (next: boolean) => { onChange(next); setOpen(next); } }));
}

test("a menu Select draws entries as data: headings, separators, icons, details, shortcuts and checks", async () => {
  const items: SelectEntry[] = [
    { heading: "Workspace" },
    { label: "Rename", icon: "pen", shortcut: "mod+r" },
    { label: "Pinned", checked: true, details: "On top" },
    { separator: true },
    { label: "Delete", danger: true },
  ];
  await act(async () => root.render(h(Example, { items })));
  const menu = host.querySelector("ds-select")!;
  expect(menu.getAttribute("role")).toBe("menu");
  expect(menu.querySelector("[data-ds-menu-label]")!.textContent).toBe("Workspace");
  expect(menu.querySelector("hr[data-ds-menu-separator]")).not.toBeNull();
  expect(row("Rename").querySelector('ds-icon[type="pen"]')).not.toBeNull();
  expect(row("Rename").textContent).toMatch(/R$/);
  expect(row("Pinned").getAttribute("role")).toBe("menuitemcheckbox");
  expect(row("Pinned").getAttribute("aria-checked")).toBe("true");
  expect(row("Pinned").textContent).toContain("On top");
  expect(row("Delete").closest("ds-button")!.hasAttribute("danger")).toBe(true);
});

test("choosing a row runs its action and closes; keepOpen and a prevented choice keep it open", async () => {
  const rename = vi.fn(), cycle = vi.fn(), changes = vi.fn();
  const items: SelectEntry[] = [
    { label: "Rename", onSelect: rename },
    { label: "Colour", keepOpen: true, onSelect: cycle },
    { label: "Ask", onSelect: event => event.preventDefault() },
  ];
  await act(async () => root.render(h(Example, { items, onChange: changes })));
  await click(row("Colour"));
  expect(cycle).toHaveBeenCalledOnce();
  expect(changes).not.toHaveBeenCalled();
  await click(row("Ask"));
  expect(changes).not.toHaveBeenCalled();
  await click(row("Rename"));
  expect(rename).toHaveBeenCalledOnce();
  expect(changes).toHaveBeenLastCalledWith(false);
});

test("a row with items opens a nested menu beside it", async () => {
  const items: SelectEntry[] = [{ label: "Move to", items: [{ label: "Inbox" }, { label: "Archive" }] }];
  await act(async () => root.render(h(Example, { items })));
  const nested = host.querySelectorAll("ds-select")[1]!;
  expect(nested.triggerMode).toBe("submenu");
  expect(nested.trigger).toBe(row("Move to"));
  await click(row("Move to"));
  expect(nested.open).toBe(true);
  expect([...nested.querySelectorAll('[role="menuitem"]')].map(node => node.textContent)).toEqual(["Inbox", "Archive"]);
});

test("with option children it is a field: a native select inside ds-select", async () => {
  await act(async () => root.render(h(Select, { name: "size", defaultValue: "m", native: true }, h("option", { value: "s" }, "Small"), h("option", { value: "m" }, "Medium"))));
  const field = host.querySelector("ds-select")!;
  expect(field.querySelector("select")!.value).toBe("m");
  expect(field.hasAttribute("native")).toBe(true);
});
