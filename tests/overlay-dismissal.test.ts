// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
import type { OverlayCloseReason, OverlayType } from "../DS1/4-page/ds-overlay";
vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
await import("../DS1/4-page/ds-overlay");

afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.removeAttribute("style");
  document.body.removeAttribute("style");
});

const presentations: { type: OverlayType; nonModal: boolean }[] = [
  { type: "modal", nonModal: false },
  { type: "sheet", nonModal: false },
  { type: "drawer", nonModal: false },
  { type: "sheet", nonModal: true },
  { type: "drawer", nonModal: true },
  { type: "popover", nonModal: true },
];

async function fixture(type: OverlayType, nonModal: boolean) {
  const opener = document.createElement("button");
  opener.textContent = "Open panel";
  const outside = document.createElement("button");
  outside.textContent = "Page action";
  const host = document.createElement("ds-overlay");
  host.type = type;
  host.nonModal = nonModal;
  host.closeOnOutside = true;
  host.blockOutside = false;
  host.holdScroll = false;
  host.innerHTML = '<dialog aria-label="Example"><input aria-label="Draft"><button data-ds-overlay-dismiss>Close</button></dialog>';
  document.body.append(opener, outside, host);
  const native = host.querySelector("dialog")!;
  vi.spyOn(native, "getBoundingClientRect").mockReturnValue({ left: 100, top: 100, right: 400, bottom: 500, width: 300, height: 400 } as DOMRect);
  const reasons: OverlayCloseReason[] = [];
  host.addEventListener("ds-close-request", event => reasons.push((event as CustomEvent).detail.reason));
  return { host, native, opener, outside, reasons };
}

for (const { type, nonModal } of presentations) {
  test(`${nonModal ? "modeless" : "modal"} ${type} opens, closes by every route, and reopens`, async () => {
    const { host, native, opener, outside, reasons } = await fixture(type, nonModal);
    const input = host.querySelector("input")!;
    input.value = "Unsaved local draft";
    const actions = ["button", "escape", "outside", "programmatic"] as const;
    for (const action of actions) {
      opener.focus();
      await host.show();
      expect(host.open).toBe(true);
      expect(native.open).toBe(true);
      expect(host.hasAttribute("open")).toBe(true);
      // Interacting inside must leave the frame open.
      input.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
      input.click();
      input.focus();
      expect(native.open).toBe(true);
      const before = reasons.length;
      if (action === "button") host.querySelector<HTMLButtonElement>("[data-ds-overlay-dismiss]")!.click();
      else if (action === "escape") {
        // Modal Escape is delivered by the browser as cancel; modeless frames own keydown.
        if (host.modeless) input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true, composed: true }));
        else native.dispatchEvent(new Event("cancel", { cancelable: true }));
      } else if (action === "outside") {
        if (host.modeless) {
          outside.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
          outside.focus();
          outside.click();
        } else {
          const point = { clientX: 20, clientY: 20, bubbles: true, composed: true };
          native.dispatchEvent(new PointerEvent("pointerdown", point));
          native.dispatchEvent(new MouseEvent("click", point));
        }
      } else host.close();
      await host.updateComplete;
      expect(host.open).toBe(false);
      expect(native.open).toBe(false);
      expect(host.hasAttribute("open")).toBe(false);
      expect(input.value).toBe("Unsaved local draft");
      expect(reasons.slice(before)).toEqual(action === "programmatic" ? [] : [action === "outside" && !host.modeless ? "backdrop" : action]);
      expect(document.activeElement).toBe(action === "outside" && host.modeless ? outside : opener);
      expect(document.documentElement.style.overflow).toBe("");
    }
    // A closed frame must not retain its document Escape handler.
    const escape = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    outside.dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(false);
  });
}

for (const type of ["sheet", "drawer"] as const) {
  test(`${type} outside dismissal leaves the page action usable and supports a veto`, async () => {
    const { host, native, outside } = await fixture(type, true);
    const pageAction = vi.fn();
    outside.addEventListener("click", pageAction);
    const veto = (event: Event) => event.preventDefault();
    host.addEventListener("ds-close-request", veto);
    await host.show();
    outside.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    outside.click();
    await host.updateComplete;
    expect(native.open).toBe(true);
    expect(pageAction).toHaveBeenCalledOnce();
    host.removeEventListener("ds-close-request", veto);
    outside.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    outside.click();
    await host.updateComplete;
    expect(native.open).toBe(false);
    expect(pageAction).toHaveBeenCalledTimes(2);
  });
}
