// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
import { LONG_PRESS } from "../DS1/3-unit/context-trigger";
await import("../DS1/3-unit/ds-context");
afterEach(() => { document.body.replaceChildren(); vi.useRealTimers(); });

const settle = async (host: HTMLElement & { updateComplete: Promise<unknown> }) => {
  for (let i = 0; i < 3; i++) { await host.updateComplete; await Promise.resolve(); }
};

async function context(rows = '<button role="menuitem">Rename</button><hr data-ds-menu-separator><button role="menuitem" data-danger>Delete</button>', attributes = "") {
  document.body.innerHTML = `<ul id="items"><li tabindex="0">Alpha</li><li tabindex="0">Beta</li></ul><ds-context for="items" ${attributes}>${rows}</ds-context>`;
  const host = document.querySelector("ds-context")!;
  await settle(host);
  const open = async (target: Element = document.querySelector("li")!, x = 40, y = 30) => {
    target.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, button: 2 }));
    await settle(host);
  };
  return { host, open };
}

test("a right click on the element for names opens it at the pointer, as a floating menu", async () => {
  const { host, open } = await context();
  expect(host.getAttribute("role")).toBe("menu");
  expect(host.triggerMode).toBe("context");
  expect(host.floating).toBe(true);
  expect(host.trigger).toBe(document.getElementById("items"));
  expect(host.open).toBe(false);
  await open();
  expect(host.open).toBe(true);
});

test("choosing a row closes it, unless the row keeps it open or its click was prevented", async () => {
  const { host, open } = await context('<button role="menuitem">Rename</button><button role="menuitem" data-keep-open>Colour</button><button role="menuitem" id="ask">Ask</button>');
  await open();
  host.querySelector<HTMLButtonElement>("[data-keep-open]")!.click();
  await settle(host);
  expect(host.open).toBe(true);
  host.querySelector("#ask")!.addEventListener("click", event => event.preventDefault());
  host.querySelector<HTMLButtonElement>("#ask")!.click();
  await settle(host);
  expect(host.open).toBe(true);
  host.querySelector<HTMLButtonElement>("button")!.click();
  await settle(host);
  expect(host.open).toBe(false);
});

test("pending holds every free row and keeps the menu open, then frees only those rows", async () => {
  const { host, open } = await context('<button role="menuitem">Rename</button><button role="menuitem" aria-disabled="true">Locked</button>');
  await open();
  host.pending = true; await settle(host);
  const [rename, locked] = host.querySelectorAll("button");
  expect(rename!.getAttribute("aria-disabled")).toBe("true");
  expect(host.getAttribute("aria-busy")).not.toBeNull();
  host.requestClose("escape"); await settle(host);
  expect(host.open).toBe(true);
  rename!.click(); await settle(host);
  expect(host.open).toBe(true);
  host.pending = false; await settle(host);
  expect(rename!.hasAttribute("aria-disabled")).toBe(false);
  expect(locked!.getAttribute("aria-disabled")).toBe("true");
  host.requestClose("escape"); await settle(host);
  expect(host.open).toBe(false);
});

test("a refused change shows on its row a moment", async () => {
  vi.useFakeTimers();
  const { host } = await context();
  const row = host.querySelector("button")!;
  host.refuse(row);
  expect(row.hasAttribute("data-ds-refused")).toBe(true);
  vi.advanceTimersByTime(1400);
  expect(row.hasAttribute("data-ds-refused")).toBe(false);
});

test("groups are gaps, and a group left empty leaves none", async () => {
  const { host } = await context('<hr data-ds-menu-separator><button role="menuitem">One</button><hr data-ds-menu-separator><hr data-ds-menu-separator><button role="menuitem">Two</button><hr data-ds-menu-separator><button role="menuitem" hidden>Gone</button>');
  const separators = [...host.querySelectorAll("hr")];
  expect(separators.map(separator => separator.hasAttribute("data-ds-quiet"))).toEqual([true, false, true, true]);
  host.querySelector<HTMLButtonElement>("[hidden]")!.hidden = false;
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(separators.map(separator => separator.hasAttribute("data-ds-quiet"))).toEqual([true, false, true, false]);
});

test("a touch held half a second opens it, a shorter one does not", async () => {
  expect(LONG_PRESS).toBe(500);
  vi.useFakeTimers();
  const { host } = await context();
  const row = document.querySelector("li")!;
  const press = () => row.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, composed: true, pointerType: "touch", button: 0, clientX: 20, clientY: 20 }));
  press();
  vi.advanceTimersByTime(LONG_PRESS - 1);
  await host.updateComplete;
  expect(host.open).toBe(false);
  vi.advanceTimersByTime(1);
  await host.updateComplete;
  expect(host.open).toBe(true);
});

test("its rows are its own: arrows move between them, skipping a disabled one", async () => {
  const { host, open } = await context('<button role="menuitem">One</button><button role="menuitem" disabled>Two</button><button role="menuitem">Three</button>');
  await open();
  const [one, , three] = host.querySelectorAll("button");
  one!.focus();
  one!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, composed: true, cancelable: true }));
  expect(document.activeElement).toBe(three);
});

test("a bar lays its rows side by side over its anchor, leaves the focus where it is, and steps with ← and →", async () => {
  const { host } = await context('<button role="menuitem" aria-label="Bold"><ds-icon type="bold"></ds-icon></button><button role="menuitem" aria-label="Italic"><ds-icon type="italic"></ds-icon></button><hr data-ds-menu-separator><button role="menuitem">Turn into</button>', "bar");
  expect(host.getAttribute("aria-orientation")).toBe("horizontal");
  expect(host.hasAttribute("data-ds-hug")).toBe(false);
  const [bold, italic, turn] = host.querySelectorAll("button");
  expect([bold, italic, turn].map(row => row!.hasAttribute("data-ds-context-icon"))).toEqual([true, true, false]);
  const writing = document.querySelector<HTMLElement>("li")!;
  writing.focus();
  host.openOver({ left: 40, top: 100, right: 120, bottom: 120, width: 80, height: 20 });
  await settle(host);
  expect(host.open).toBe(true);
  expect(document.activeElement).toBe(writing);
  const press = (row: Element, key: string) => row.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, composed: true, cancelable: true }));
  bold!.focus();
  press(bold!, "ArrowRight");
  expect(document.activeElement).toBe(italic);
  press(italic!, "ArrowDown");
  expect(document.activeElement).toBe(italic);
  press(italic!, "ArrowLeft");
  expect(document.activeElement).toBe(bold);
  host.bar = false; await settle(host);
  expect(host.hasAttribute("aria-orientation")).toBe(false);
  expect(host.hasAttribute("data-ds-hug")).toBe(true);
  expect(bold!.hasAttribute("data-ds-context-icon")).toBe(false);
});
