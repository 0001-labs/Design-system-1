// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
await import("../DS1/4-page/ds-dialog");
await import("../DS1/3-unit/ds-menu");
afterEach(() => { document.body.replaceChildren(); document.documentElement.removeAttribute("style"); });

test("anchored panels follow content and the visible viewport, and stop after close", async () => {
  const host = document.createElement('ds-dialog'); host.nonModal = true;
  host.anchor = { x: 980, y: 700 };
  host.innerHTML = '<dialog style="margin:10px" aria-label="Actions"><button>Action</button></dialog>';
  document.body.append(host);
  const native = host.querySelector('dialog')!;
  const viewport = Object.assign(new EventTarget(), { offsetLeft: 0, offsetTop: 0, width: 1000, height: 720 });
  vi.stubGlobal('visualViewport', viewport);
  vi.spyOn(native, 'getBoundingClientRect').mockReturnValue({ width: 240, height: 200 } as DOMRect);
  await host.show();
  expect(native.style.getPropertyValue('--ds-dialog-anchor-left')).toBe('740px');
  expect(native.style.getPropertyValue('--ds-dialog-anchor-top')).toBe('500px');
  viewport.height = 400; viewport.dispatchEvent(new Event('resize'));
  expect(native.style.getPropertyValue('--ds-dialog-anchor-top')).toBe('180px');
  expect(native.style.getPropertyValue('--ds-dialog-available-height')).toBe('380px');
  host.close(); viewport.height = 300; viewport.dispatchEvent(new Event('resize'));
  expect(native.style.getPropertyValue('--ds-dialog-anchor-top')).toBe('180px');
  vi.unstubAllGlobals();
});

async function dialog() {
  const host = document.createElement("ds-dialog");
  host.innerHTML = '<dialog aria-label="Example"><button data-ds-dialog-dismiss>Close</button></dialog>';
  document.body.append(host); host.open = true; await host.updateComplete;
  return { host, native: host.querySelector("dialog")! };
}

test("nested dialogs retain scroll locking and restore the exact original declaration", async () => {
  document.documentElement.style.setProperty("overflow", "scroll", "important");
  document.body.style.setProperty("position", "relative");
  document.body.style.setProperty("top", "20px", "important");
  const first = await dialog(); const second = await dialog();
  expect(first.native.open).toBe(true); expect(second.native.open).toBe(true);
  expect(document.body.style.position).toBe("fixed");
  first.host.remove();
  expect(document.documentElement.style.overflow).toBe("hidden");
  second.host.remove();
  expect(second.native.open).toBe(false);
  expect(document.documentElement.style.overflow).toBe("scroll");
  expect(document.documentElement.style.getPropertyPriority("overflow")).toBe("important");
  expect(document.body.style.position).toBe("relative");
  expect(document.body.style.top).toBe("20px");
  expect(document.body.style.getPropertyPriority("top")).toBe("important");
  document.body.removeAttribute("style");
});

test("Escape requests can be disabled or vetoed and close controls preserve the reason", async () => {
  const { host, native } = await dialog(); const requests: string[] = [];
  const veto = (event: Event) => { event.preventDefault(); requests.push((event as CustomEvent).detail.reason); };
  host.addEventListener("ds-close-request", veto);
  host.closeOnEscape = false;
  native.dispatchEvent(new Event("cancel", { cancelable: true }));
  expect(requests).toEqual([]);
  host.closeOnEscape = true;
  native.dispatchEvent(new Event("cancel", { cancelable: true }));
  await host.updateComplete;
  expect(requests).toEqual(["escape"]); expect(native.open).toBe(true);
  native.querySelector("button")!.click();
  expect(requests).toEqual(["escape", "button"]);
  host.removeEventListener("ds-close-request", veto);
  native.querySelector("button")!.click(); await host.updateComplete;
  expect(native.open).toBe(false); expect(document.documentElement.style.overflow).toBe("");
});

test("a gesture starting inside cannot dismiss on release outside", async () => {
  const { host, native } = await dialog();
  vi.spyOn(native, "getBoundingClientRect").mockReturnValue({ left: 10, top: 10, right: 100, bottom: 100 } as DOMRect);
  const outside = { clientX: 2, clientY: 2, bubbles: true };
  native.dispatchEvent(new PointerEvent("pointerdown", { clientX: 20, clientY: 20, bubbles: true }));
  native.dispatchEvent(new MouseEvent("click", outside)); await host.updateComplete;
  expect(native.open).toBe(true);
  host.closeOnBackdrop = false;
  native.dispatchEvent(new PointerEvent("pointerdown", outside)); native.dispatchEvent(new MouseEvent("click", outside));
  await host.updateComplete; expect(native.open).toBe(true);
  host.closeOnBackdrop = true;
  native.dispatchEvent(new PointerEvent("pointerdown", outside)); native.dispatchEvent(new MouseEvent("click", outside));
  await host.updateComplete; expect(native.open).toBe(false);
});

test("modeless panels leave page styles alone and share close controls", async () => {
  const host = document.createElement("ds-dialog");
  host.nonModal = true;
  host.innerHTML = '<dialog data-ds-dialog-inline aria-label="Preferences"><button data-ds-dialog-dismiss>Close</button></dialog>';
  document.body.append(host);
  await host.show();
  expect(host.querySelector("dialog")!.open).toBe(true);
  expect(document.body.style.position).toBe("");
  expect(document.documentElement.style.overflow).toBe("");
  host.querySelector("button")!.click();
  expect(host.querySelector("dialog")!.open).toBe(false);
});

test("a stationary panel and nested modal release only their own scroll hold", async () => {
  const panel = document.createElement("ds-dialog");
  panel.nonModal = true; panel.holdScroll = true;
  panel.innerHTML = '<dialog aria-label="Camera"><button>Capture</button></dialog>';
  document.body.append(panel); await panel.show();
  expect(document.documentElement.style.overflow).toBe("hidden");
  expect(document.body.style.position).toBe("");
  const nested = await dialog();
  expect(document.body.style.position).toBe("fixed");
  nested.host.close();
  expect(document.body.style.position).toBe("");
  expect(document.documentElement.style.overflow).toBe("hidden");
  panel.close();
  expect(document.documentElement.style.overflow).toBe("");
  expect(document.body.style.touchAction).toBe("");
});

test("outside dismissal consumes its click and stops holding gestures immediately", async () => {
  const panel = document.createElement("ds-dialog");
  panel.nonModal = true; panel.holdScroll = true; panel.closeOnOutside = true; panel.blockOutside = true;
  panel.innerHTML = '<dialog aria-label="Camera"><button>Capture</button></dialog>';
  const behind = document.createElement("button"); const action = vi.fn();
  behind.addEventListener("click", action); document.body.append(behind, panel);
  await panel.show();
  const wheel = new Event("wheel", { cancelable: true }); document.dispatchEvent(wheel);
  expect(wheel.defaultPrevented).toBe(true);
  behind.click();
  expect(action).not.toHaveBeenCalled(); expect(panel.open).toBe(false);
  behind.click(); expect(action).toHaveBeenCalledOnce();
  const after = new Event("wheel", { cancelable: true }); document.dispatchEvent(after);
  expect(after.defaultPrevented).toBe(false);
});

test("modeless Escape only closes the top panel, and an inside gesture does not dismiss outside", async () => {
  const first = document.createElement("ds-dialog"), second = document.createElement("ds-dialog");
  for (const panel of [first, second]) {
    panel.nonModal = true; panel.closeOnOutside = true;
    panel.innerHTML = '<dialog aria-label="Example"><button>Inside</button></dialog>';
    document.body.append(panel); await panel.show();
  }
  second.querySelector("button")!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
  document.body.click(); expect(second.open).toBe(true);
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", cancelable: true }));
  expect(second.open).toBe(false); expect(first.open).toBe(true);
});

test("shared frame styles reach a consumer shadow root and reopening ignores old close events", async () => {
  const consumer = document.createElement("div"), root = consumer.attachShadow({ mode: "open" });
  const panel = document.createElement("ds-dialog"); panel.nonModal = true;
  panel.innerHTML = '<dialog aria-label="Example"><button>Inside</button></dialog>';
  root.append(panel); document.body.append(consumer); await panel.show();
  expect(root.adoptedStyleSheets).toHaveLength(1);
  panel.close(); await panel.show(); panel.querySelector("dialog")!.dispatchEvent(new Event("close"));
  expect(panel.open).toBe(true); expect(panel.querySelector("dialog")!.open).toBe(true);
});

test("a queued native close cannot cancel a new opening awaiting a child render", async () => {
  const panel = document.createElement("ds-dialog"); panel.nonModal = true;
  panel.innerHTML = '<dialog aria-label="Example"><button>Inside</button></dialog>';
  document.body.append(panel); await panel.show(); panel.close();
  let ready!: () => void;
  Object.defineProperty(panel.querySelector("button"), "updateComplete", { value: new Promise<void>(resolve => { ready = resolve; }) });
  const opened = panel.show(); await panel.updateComplete;
  panel.querySelector("dialog")!.dispatchEvent(new Event("close"));
  expect(panel.open).toBe(true);
  ready(); await opened;
  expect(panel.querySelector("dialog")!.open).toBe(true);
});

test("immediate opening exposes a control inside the gesture while children render", async () => {
  const host = document.createElement("ds-dialog"); host.nonModal = true;
  host.innerHTML = '<dialog aria-label="Search"><input aria-label="Query"><span></span></dialog>';
  let ready!: () => void;
  Object.defineProperty(host.querySelector("span"), "updateComplete", { value: new Promise<void>(resolve => { ready = resolve; }) });
  document.body.append(host);
  const shown = host.show({ immediate: true });
  expect(host.shadowRoot!.querySelector('slot')?.assignedElements()).toContain(host.querySelector('dialog'));
  expect(host.querySelector("dialog")!.open).toBe(true);
  const input = host.querySelector("input")!; input.focus();
  expect(document.activeElement).toBe(input);
  host.close(); ready(); await shown;
  expect(host.querySelector("dialog")!.open).toBe(false);
  expect(host.open).toBe(false);
});

test("immediate opening renders nested menu slots before initial focus", () => {
  const host = document.createElement('ds-dialog'); host.nonModal = true;
  host.innerHTML = '<dialog aria-label="Actions"><ds-menu><button role="menuitem">Share</button></ds-menu></dialog>';
  document.body.append(host); void host.show({ immediate: true });
  const menu = host.querySelector('ds-menu')!;
  expect(menu.shadowRoot!.querySelector('slot')!.assignedElements()).toContain(menu.querySelector('button'));
});

test("a modeless panel respects an editor's Escape and lets its content scroll by keyboard", async () => {
  const host = document.createElement("ds-dialog"); host.nonModal = true; host.holdScroll = true;
  host.innerHTML = '<dialog aria-label="Search"><input aria-label="Rename"><button>Result</button></dialog>';
  document.body.append(host); await host.show();
  const input = host.querySelector("input")!;
  input.addEventListener("keydown", event => { if (event.key === "Escape") event.preventDefault(); });
  input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  expect(host.open).toBe(true);
  const inside = new KeyboardEvent("keydown", { key: "PageDown", bubbles: true, cancelable: true });
  host.querySelector("button")!.dispatchEvent(inside);
  expect(inside.defaultPrevented).toBe(false);
  const outside = new KeyboardEvent("keydown", { key: "PageDown", bubbles: true, cancelable: true });
  document.body.dispatchEvent(outside); expect(outside.defaultPrevented).toBe(true);
  host.querySelector("button")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  expect(host.open).toBe(false);
});
