// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
await import("../DS1/4-page/ds-dialog");
afterEach(() => { document.body.replaceChildren(); document.documentElement.removeAttribute("style"); });

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
