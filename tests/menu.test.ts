// @vitest-environment happy-dom
import { afterEach, expect, test } from "vite-plus/test";
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
