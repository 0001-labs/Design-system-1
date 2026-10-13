// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
await import("../DS1/3-unit/ds-menu");
afterEach(() => document.body.replaceChildren());

test("menu navigation skips disabled and hidden choices without taking a field's keys", () => {
  const menu = document.createElement("ds-menu");
  menu.innerHTML = '<button role="menuitem">First</button><button role="menuitem" disabled>Disabled</button><button role="menuitem" hidden>Hidden</button><button role="menuitem">Last</button><input aria-label="Recipient">';
  document.body.append(menu);
  const [first, , , last] = menu.querySelectorAll('button');
  first.focus();
  first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true, cancelable: true }));
  expect(document.activeElement).toBe(last);
  last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, composed: true, cancelable: true }));
  expect(document.activeElement).toBe(first);
  const input = menu.querySelector('input')!; input.focus();
  const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, composed: true, cancelable: true });
  input.dispatchEvent(event);
  expect(document.activeElement).toBe(input); expect(event.defaultPrevented).toBe(false);
});

test("a nested menu handles its own keys once", () => {
  const parent = document.createElement('ds-menu'), child = document.createElement('ds-menu');
  parent.innerHTML = '<button role="menuitem">Parent</button>';
  child.innerHTML = '<button role="menuitem">One</button><button role="menuitem">Two</button>';
  parent.append(child); document.body.append(parent);
  child.querySelector('button')!.focus();
  child.querySelector('button')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true, cancelable: true }));
  expect(document.activeElement).toBe(child.lastElementChild);
});

function key(target: HTMLElement, key: string, extra: KeyboardEventInit = {}) {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, composed: true, cancelable: true, ...extra });
  target.dispatchEvent(event);
  return event;
}

test("suggestions keep native field focus and editing keys while requesting controlled choices", async () => {
  const field = document.createElement("textarea"), menu = document.createElement("ds-menu");
  menu.innerHTML = '<button id="first" role="option">First</button><button id="disabled" role="option" disabled>Disabled</button><button id="last" role="option">Last</button>';
  menu.floating = menu.open = true; menu.controller = menu.anchor = field; menu.activeId = "first";
  document.body.append(field, menu); field.focus(); await menu.updateComplete;
  const request = vi.fn((event: Event) => event.preventDefault());
  menu.addEventListener("ds-menu-active", request);
  expect(key(field, "ArrowDown").defaultPrevented).toBe(true);
  expect((request.mock.calls[0]![0] as CustomEvent).detail.id).toBe("last");
  expect(menu.activeId).toBe("first"); // The owner can decline a request.
  expect(document.activeElement).toBe(field);
  expect([...menu.querySelectorAll("button")].every(button => button.tabIndex === -1)).toBe(true);
  menu.activeId = "last"; await menu.updateComplete;
  const choose = vi.fn(); menu.lastElementChild!.addEventListener("click", choose);
  for (const [name, extra] of [["Home", {}], ["End", {}], ["Enter", {isComposing: true}], ["Enter", {metaKey: true}], ["ArrowUp", {shiftKey: true}]] as const) {
    expect(key(field, name, extra).defaultPrevented).toBe(false);
  }
  expect(choose).not.toHaveBeenCalled();
  expect(key(field, "Enter").defaultPrevented).toBe(true); expect(choose).toHaveBeenCalledTimes(1);
  const press = new PointerEvent("pointerdown", {button: 0, bubbles: true, composed: true, cancelable: true});
  menu.lastElementChild!.dispatchEvent(press); expect(press.defaultPrevented).toBe(true);
  menu.remove(); expect(key(field, "ArrowDown").defaultPrevented).toBe(false);
});

test("floating menus restore focus on controlled unmount, but do not steal an outside click", async () => {
  const opener = document.createElement("button"), outside = document.createElement("button");
  document.body.append(opener, outside); opener.focus();
  const menu = document.createElement("ds-menu");
  menu.innerHTML = '<button role="menuitem">Choice</button>';
  menu.anchor = opener; menu.floating = menu.open = true; document.body.append(menu); await menu.updateComplete;
  expect(document.activeElement).toBe(menu.firstElementChild);
  expect(menu.firstElementChild!.getAttribute("tabindex")).toBe("0");
  menu.addEventListener("ds-menu-close", event => { event.preventDefault(); menu.remove(); });
  expect(key(menu.firstElementChild as HTMLElement, "Escape").defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(opener);
  document.body.append(menu); await menu.updateComplete;
  outside.dispatchEvent(new PointerEvent("pointerdown", {bubbles: true, composed: true}));
  outside.focus(); expect(document.activeElement).toBe(outside);
  expect(key(outside, "Escape").defaultPrevented).toBe(false);
});

test("only the top floating menu receives Escape and declining dismissal keeps it open", async () => {
  const first = document.createElement("ds-menu"), second = document.createElement("ds-menu");
  for (const menu of [first, second]) { menu.floating = menu.open = true; menu.innerHTML = '<button role="menuitem">Choice</button>'; document.body.append(menu); await menu.updateComplete; }
  const close = vi.fn((event: Event) => event.preventDefault()); second.addEventListener("ds-menu-close", close);
  key(second.firstElementChild as HTMLElement, "Escape"); await second.updateComplete;
  expect(close).toHaveBeenCalledTimes(1); expect(second.open).toBe(true); expect(first.open).toBe(true);
  second.remove();
  key(first.firstElementChild as HTMLElement, "Escape"); await first.updateComplete;
  expect(first.open).toBe(false);
});

test("grid navigation preserves columns, skips disabled cells and handles a short last row", async () => {
  const menu = document.createElement("ds-menu"); menu.columns = 3;
  menu.innerHTML = Array.from({length: 8}, (_, i) => `<button role="menuitem" ${i === 4 ? 'disabled' : ''}>${i}</button>`).join("");
  document.body.append(menu); await menu.updateComplete;
  const buttons = menu.querySelectorAll("button"); buttons[1]!.focus();
  key(buttons[1]!, "ArrowDown"); expect(document.activeElement).toBe(buttons[7]);
  key(buttons[7]!, "ArrowUp"); expect(document.activeElement).toBe(buttons[1]);
  buttons[3]!.focus(); key(buttons[3]!, "ArrowRight"); expect(document.activeElement).toBe(buttons[5]);
  key(buttons[5]!, "ArrowDown"); expect(document.activeElement).toBe(buttons[7]);
});

test("triggers open at the selected choice, arrows skip disabled choices and typeahead cycles", async () => {
  const trigger = document.createElement("button"), menu = document.createElement("ds-menu");
  menu.floating = true; menu.trigger = menu.anchor = trigger;
  menu.innerHTML = '<button role="option">Apple</button><button role="option" disabled>Berry</button><button role="option" aria-selected="true">Banana</button><button role="option">Blueberry</button>';
  document.body.append(trigger, menu); trigger.focus(); await menu.updateComplete;
  key(trigger, "ArrowDown"); await menu.updateComplete;
  const choices = menu.querySelectorAll("button");
  expect(document.activeElement).toBe(choices[2]);
  key(choices[2]!, "b"); expect(document.activeElement).toBe(choices[3]);
  key(choices[3]!, "b"); expect(document.activeElement).toBe(choices[2]);
  key(choices[2]!, "Home"); expect(document.activeElement).toBe(choices[0]);
  key(choices[0]!, "ArrowDown"); expect(document.activeElement).toBe(choices[2]);
  key(choices[2]!, "Escape"); await menu.updateComplete; expect(document.activeElement).toBe(trigger);
  choices[2]!.removeAttribute("aria-selected");
  key(trigger, "ArrowUp"); await menu.updateComplete; expect(document.activeElement).toBe(choices[3]);
  menu.open = false; await menu.updateComplete;
  trigger.disabled = true; key(trigger, "ArrowDown"); await menu.updateComplete; expect(menu.open).toBe(false);
  menu.remove(); trigger.disabled = false; expect(key(trigger, "ArrowDown").defaultPrevented).toBe(false);
});

test("controlled trigger requests can be declined and a changed trigger releases its old listeners", async () => {
  const trigger = document.createElement("button"), next = document.createElement("button"), menu = document.createElement("ds-menu");
  menu.floating = true; menu.trigger = menu.anchor = trigger;
  document.body.append(trigger, next, menu); await menu.updateComplete;
  const request = vi.fn((event: Event) => event.preventDefault()); menu.addEventListener("ds-menu-toggle", request);
  trigger.click(); await menu.updateComplete; expect(menu.open).toBe(false); expect(request).toHaveBeenCalledTimes(1);
  menu.trigger = next; await menu.updateComplete;
  trigger.click(); expect(request).toHaveBeenCalledTimes(1);
  next.click(); expect(request).toHaveBeenCalledTimes(2);
  expect(key(next, "ArrowDown", {isComposing: true}).defaultPrevented).toBe(false);
});

test("hover menus preserve link navigation and page focus, while keyboard opening enters the menu", async () => {
  const trigger = document.createElement("a"), field = document.createElement("input"), menu = document.createElement("ds-menu");
  trigger.href = "#example"; trigger.setAttribute("aria-haspopup", "dialog");
  menu.id = "hover-example"; menu.hover = menu.floating = true; menu.trigger = menu.anchor = trigger;
  menu.innerHTML = '<button role="menuitem">Choice</button>';
  document.body.append(trigger, field, menu); field.focus(); await menu.updateComplete;
  trigger.dispatchEvent(new PointerEvent("pointerenter", {pointerType: "mouse"})); await menu.updateComplete;
  expect(menu.open).toBe(true); expect(document.activeElement).toBe(field);
  expect(trigger.getAttribute("aria-controls")).toBe(menu.id); expect(trigger.getAttribute("aria-expanded")).toBe("true");
  const navigation = vi.fn((event: MouseEvent) => { expect(event.defaultPrevented).toBe(false); event.preventDefault(); });
  trigger.addEventListener("click", navigation, {once: true});
  const click = new MouseEvent("click", {bubbles: true, cancelable: true, metaKey: true}); trigger.dispatchEvent(click);
  expect(navigation).toHaveBeenCalledOnce(); expect(menu.open).toBe(true);
  key(trigger, "ArrowDown"); expect(document.activeElement).toBe(menu.firstElementChild);
  key(menu.firstElementChild as HTMLElement, "Escape"); await menu.updateComplete; expect(document.activeElement).toBe(trigger);
  trigger.dispatchEvent(new PointerEvent("pointerenter", {pointerType: "touch"})); await menu.updateComplete; expect(menu.open).toBe(false);
  menu.remove(); expect(trigger.getAttribute("aria-haspopup")).toBe("dialog"); expect(trigger.hasAttribute("aria-controls")).toBe(false);
});
