// @vitest-environment happy-dom
import { act, createElement as h, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";
import {
  Context, ContextTrigger, ContextContent, ContextItem,
  ContextSub, ContextSubTrigger, ContextSubContent,
  ContextCheckboxItem, ContextRadioGroup, ContextRadioItem, ContextFilePicker,
} from "../DS1/react/context";
await import("../DS1/3-unit/ds-menu");
await import("../DS1/3-unit/ds-select");
await import("../DS1/3-unit/ds-context");
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let root: Root, host: HTMLDivElement;
beforeEach(() => { host = document.createElement("div"); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); document.body.replaceChildren(); vi.useRealTimers(); });
async function fire(element: HTMLElement, event: Event) { await act(async () => { element.dispatchEvent(event); }); }
async function key(element: HTMLElement, key: string, options: KeyboardEventInit = {}) {
  await fire(element, new KeyboardEvent("keydown", { key, ...options, bubbles: true, composed: true, cancelable: true }));
}
function trigger() { return host.querySelector<HTMLButtonElement>("[data-slot=context-trigger]")!; }
function item(label: string) { return [...host.querySelectorAll<HTMLButtonElement>("button")].find(node => node.textContent === label)!; }
function menu() { return host.querySelector("ds-context")!; }
function Example({ choose = () => {}, closeFocus = undefined as ((e: Event) => void) | undefined, disabled = false }) {
  return h(Context, null,
    h(ContextTrigger, { asChild: true, disabled }, h("button", { type: "button" }, "Open")),
    h(ContextContent, { onCloseAutoFocus: closeFocus },
      h(ContextItem, { disabled: true }, "Unavailable"),
      h(ContextItem, { onClick: choose }, "First"),
      h(ContextSub, null, h(ContextSubTrigger, null, "More"), h(ContextSubContent, null,
        h(ContextItem, { onClick: choose }, "Nested"))),
      h(ContextItem, null, "Last")));
}
test("context triggers retain left-click behavior and support keyboard opening, nested back and branch selection", async () => {
  const choose = vi.fn(); await act(async () => root.render(h(Example, { choose })));
  await fire(trigger(), new MouseEvent("click", { bubbles: true })); expect(menu().open).toBe(false);
  trigger().focus(); await key(trigger(), "F10", { shiftKey: true });
  expect(menu().open).toBe(true); expect(document.activeElement).toBe(item("First"));
  await key(item("First"), "ArrowDown"); expect(document.activeElement).toBe(item("More"));
  await key(item("More"), "ArrowRight"); expect(document.activeElement).toBe(item("Nested"));
  await key(item("Nested"), "ArrowLeft"); expect(document.activeElement).toBe(item("More"));
  expect(menu().open).toBe(true);
  await key(item("More"), "ArrowRight");
  await fire(item("Nested"), new MouseEvent("click", { bubbles: true, cancelable: true }));
  expect(choose).toHaveBeenCalledOnce(); expect(menu().open).toBe(false); expect(document.activeElement).toBe(trigger());
});
test("Escape closes only the nested branch and an outside pointer closes the whole tree without stealing focus", async () => {
  await act(async () => root.render(h(Example)));
  await key(trigger(), "ContextMenu"); await key(item("More"), "ArrowRight");
  await key(item("Nested"), "Escape"); expect(menu().open).toBe(true); expect(document.activeElement).toBe(item("More"));
  await key(item("More"), "ArrowRight");
  const outside = document.createElement("button"); document.body.append(outside);
  await fire(outside, new PointerEvent("pointerdown", { bubbles: true, composed: true }));
  outside.focus(); expect(menu().open).toBe(false); expect(document.activeElement).toBe(outside);
});
test("controlled state can decline opening; disabled and previously canceled triggers do not request it", async () => {
  const change = vi.fn();
  await act(async () => root.render(h(Context, { open: false, onOpenChange: change },
    h(ContextTrigger, { asChild: true }, h("button", null, "Open")), h(ContextContent, null, h(ContextItem, null, "Choice")))));
  await key(trigger(), "ContextMenu"); expect(change).toHaveBeenCalledWith(true); expect(menu().open).toBe(false);
  await act(async () => root.render(h(Example, { disabled: true })));
  await key(trigger(), "ContextMenu"); expect(menu().open).toBe(false);
});
test("checkbox and radio entries report real values; a canceled selection remains open", async () => {
  const changed = vi.fn();
  function Choices() {
    const [checked, setChecked] = useState(false), [value, setValue] = useState("a");
    return h(Context, null, h(ContextTrigger, { asChild: true }, h("button", null, "Open")),
      h(ContextContent, null,
        h(ContextCheckboxItem, { checked, onCheckedChange: next => { setChecked(next); changed(next); } }, "Show"),
        h(ContextRadioGroup, { value, onValueChange: next => { setValue(next); changed(next); } },
          h(ContextRadioItem, { value: "a" }, "Alpha"), h(ContextRadioItem, { value: "b" }, "Beta")),
        h(ContextItem, { onSelect: event => event.preventDefault() }, "Keep")));
  }
  await act(async () => root.render(h(Choices)));
  await key(trigger(), "ContextMenu"); await fire(item("Show"), new MouseEvent("click", { bubbles: true }));
  expect(changed).toHaveBeenLastCalledWith(true); expect(menu().open).toBe(false);
  await key(trigger(), "ContextMenu"); expect(item("Show").getAttribute("aria-checked")).toBe("true");
  await key(item("Show"), "b"); expect(document.activeElement).toBe(item("Beta"));
  await fire(item("Beta"), new MouseEvent("click", { bubbles: true })); expect(changed).toHaveBeenLastCalledWith("b");
  await key(trigger(), "ContextMenu"); expect(item("Beta").getAttribute("aria-checked")).toBe("true");
  await fire(item("Keep"), new MouseEvent("click", { bubbles: true })); expect(menu().open).toBe(true);
});
test("an action that focuses a new field retains that focus through dismissal", async () => {
  const field = document.createElement("input"); document.body.append(field);
  await act(async () => root.render(h(Example, { choose: () => field.focus(), closeFocus: event => event.preventDefault() })));
  await key(trigger(), "ContextMenu"); await fire(item("First"), new MouseEvent("click", { bubbles: true }));
  expect(document.activeElement).toBe(field); expect(menu().open).toBe(false);
});
test("native file choices stay mounted through selection and cancellation and clear the value before notifying", async () => {
  const selected = vi.fn(), cancel = vi.fn();
  await act(async () => root.render(h(Context, null,
    h(ContextTrigger, { asChild: true }, h("button", null, "Open")),
    h(ContextContent, null, h(ContextFilePicker, { label: "Choose", onFiles: selected, onCancel: cancel })))));
  await key(trigger(), "ContextMenu"); const input = host.querySelector<HTMLInputElement>('input[type=file]')!;
  await fire(input, new MouseEvent("click", { bubbles: true })); expect(input.isConnected).toBe(true);
  const file = new File(["example"], "example.txt"); Object.defineProperty(input, "files", { value: [file], configurable: true });
  await fire(input, new Event("change", { bubbles: true })); expect(selected).toHaveBeenCalledWith([file]); expect(input.value).toBe("");
  await fire(input, new Event("cancel", { bubbles: true })); expect(cancel).toHaveBeenCalledOnce(); expect(input.isConnected).toBe(true);
});
test("long press opens once and consumes its synthetic click while movement cancels the gesture", async () => {
  vi.useFakeTimers(); const click = vi.fn();
  await act(async () => root.render(h(Context, null,
    h(ContextTrigger, { asChild: true }, h("button", { onClick: click }, "Open")), h(ContextContent, null, h(ContextItem, null, "Choice")))));
  await fire(trigger(), new PointerEvent("pointerdown", { pointerType: "touch", button: 0, clientX: 20, clientY: 20, bubbles: true }));
  await fire(trigger(), new PointerEvent("pointermove", { pointerType: "touch", clientX: 40, clientY: 20, bubbles: true }));
  await act(async () => { vi.advanceTimersByTime(700); }); expect(menu().open).toBe(false);
  await fire(trigger(), new PointerEvent("pointerdown", { pointerType: "touch", button: 0, clientX: 20, clientY: 20, bubbles: true }));
  await act(async () => { vi.advanceTimersByTime(600); }); expect(menu().open).toBe(true);
  await fire(trigger(), new MouseEvent("click", { bubbles: true, cancelable: true })); expect(click).not.toHaveBeenCalled();
  await key(host.querySelector('[role=menuitem]')!, "Escape");
  await fire(trigger(), new MouseEvent("click", { bubbles: true, cancelable: true })); expect(click).toHaveBeenCalledOnce();
});


test("Tab exits a menu even when the browser's next focus is outside the document", async () => {
  await act(async () => root.render(h(Example)));
  await key(trigger(), "ContextMenu"); await key(item("First"), "Tab");
  expect(menu().open).toBe(false);
  await key(trigger(), "ContextMenu"); await key(item("First"), "Tab", { shiftKey: true });
  expect(menu().open).toBe(false);
});
