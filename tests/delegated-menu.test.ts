// @vitest-environment happy-dom
import { act, createElement as h, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";
import { Menu } from "../DS1/react/menu";
import { Button } from "../DS1/react/button";
await import("../DS1/3-unit/ds-menu");
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let root: Root, host: HTMLDivElement;
beforeEach(() => { host = document.createElement("div"); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); document.body.replaceChildren(); vi.useRealTimers(); });
async function fire(element: HTMLElement, event: Event) { await act(async () => { element.dispatchEvent(event); }); }
const key = (element: HTMLElement, key: string, options: KeyboardEventInit = {}) => fire(element, new KeyboardEvent("keydown", {key, ...options, bubbles:true, composed:true, cancelable:true}));
const row = (id: string) => host.querySelector<HTMLElement>(`[data-row="${id}"]`)!;
const menu = () => host.querySelector('ds-menu')!;
const item = (label: string) => [...host.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')].find(e => e.textContent === label)!;
function Example({capture = () => {}, added = false, decline = false}) {
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);
  const [selected, setSelected] = useState("");
  const [confirm, setConfirm] = useState(false);
  return h("div", {onClickCapture: capture},
    h("section", {ref:setTrigger},
      ...["Alpha", "Beta", ...(added ? ["Gamma"] : [])].map(id => h("button", {key:id, "data-row":id}, h("span", null, id))),
      h("button", {"data-row":"Disabled", disabled:true}, "Disabled"),
      h("button", null, "Unmatched")),
    h(Menu, {open:!!selected, trigger, triggerMode:"context", contextSelector:"[data-row]", role:"menu",
      onOpenChange:(open, _reason, detail) => {
        if (decline && open) return;
        setSelected(open ? detail?.trigger?.dataset.row ?? "" : ""); setConfirm(false);
      }}, selected ? (confirm ? [
        h("ds-text", {key:"question",literal:true,"data-ds-menu-label":""}, "Are you sure?"),
        h(Button, {key:"yes",role:"menuitem",menuItem:true}, "Confirm"),
        h(Button, {key:"cancel",role:"menuitem",menuItem:true}, "Cancel"),
      ] : h(Button, {role:"menuitem",menuItem:true,onClick:()=>setConfirm(true)}, `Delete ${selected}`)) : null));
}
test("one delegated menu handles inserted rows and returns keyboard focus to the actual row", async () => {
  await act(async () => root.render(h(Example)));
  expect(host.querySelector('section')?.hasAttribute('aria-haspopup')).toBe(false);
  row('Beta').focus(); await key(row('Beta'), 'F10', {shiftKey:true});
  expect(item('Delete Beta')).toBeTruthy(); expect(document.activeElement).toBe(item('Delete Beta'));
  await key(item('Delete Beta'),'Escape'); expect(document.activeElement).toBe(row('Beta'));
  await act(async () => root.render(h(Example,{added:true})));
  await fire(row('Gamma').firstElementChild as HTMLElement,new MouseEvent('contextmenu',{bubbles:true,composed:true,cancelable:true,clientX:25,clientY:50}));
  expect(item('Delete Gamma')).toBeTruthy(); expect(host.querySelectorAll('ds-menu')).toHaveLength(1);
  await key(item('Delete Gamma'),'Escape');
  await key(row('Disabled'),'ContextMenu'); expect(menu().open).toBe(false);
  await fire(host.querySelector('button:not([data-row])')!,new MouseEvent('contextmenu',{bubbles:true,cancelable:true}));
  expect(menu().open).toBe(false);
});
test("a controlled owner may decline the delegated request",async()=>{
  await act(async()=>root.render(h(Example,{decline:true})));
  await key(row('Alpha'),'ContextMenu');expect(menu().open).toBe(false);
});
test("replacing the focused action with confirmation choices retains keyboard navigation",async()=>{
  await act(async()=>root.render(h(Example)));
  await key(row('Alpha'),'ContextMenu');
  await fire(item('Delete Alpha'),new MouseEvent('click',{bubbles:true,cancelable:true}));
  expect(document.activeElement).toBe(item('Confirm'));
  await key(item('Confirm'),'ArrowDown'); expect(document.activeElement).toBe(item('Cancel'));
});
test("long press consumes only that row's click before React capture; movement and removed rows cancel",async()=>{
  vi.useFakeTimers();const capture=vi.fn();
  await act(async()=>root.render(h(Example,{capture})));
  const press=()=>fire(row('Alpha'),new PointerEvent('pointerdown',{pointerType:'touch',button:0,clientX:10,clientY:10,bubbles:true}));
  await press();await fire(document.body,new PointerEvent('pointermove',{clientX:40,clientY:10,bubbles:true}));
  await act(async()=>vi.advanceTimersByTime(600));expect(menu().open).toBe(false);
  await press();await act(async()=>vi.advanceTimersByTime(600));expect(menu().open).toBe(true);
  await fire(row('Alpha'),new PointerEvent('pointerup',{bubbles:true}));
  await fire(row('Alpha'),new MouseEvent('click',{bubbles:true,cancelable:true}));expect(capture).not.toHaveBeenCalled();
  await key(item('Delete Alpha'),'Escape');
  await fire(row('Beta'),new MouseEvent('click',{bubbles:true,cancelable:true}));expect(capture).toHaveBeenCalledOnce();
  await press();row('Alpha').remove();await act(async()=>vi.advanceTimersByTime(600));expect(menu().open).toBe(false);
});
