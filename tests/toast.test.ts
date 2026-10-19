// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
const { toast } = await import("../DS1/2-core/ds-toast");

afterEach(async () => {
  toast.dismiss();
  await vi.advanceTimersByTimeAsync(500);
  document.body.replaceChildren();
  vi.useRealTimers();
});

async function toaster(attributes = "") {
  vi.useFakeTimers();
  document.body.innerHTML = `<ds-toast ${attributes}></ds-toast>`;
  const element = document.querySelector("ds-toast")!;
  await element.updateComplete;
  return element;
}
const toasts = (element: HTMLElement) => [...element.shadowRoot!.querySelectorAll<HTMLElement>("li.toast:not([data-removed='true'])")];
const settle = async (element: HTMLElement & { updateComplete: Promise<boolean> }, ms = 0) => {
  await vi.advanceTimersByTimeAsync(ms);
  await element.updateComplete;
};

test("shows a toast as Sonner does and closes it after four seconds", async () => {
  const element = await toaster('duration="4000"');
  const onAutoClose = vi.fn();
  toast("Event created", { description: "Monday at 9:00", onAutoClose });
  await settle(element, 20);
  const [item] = toasts(element);
  expect(item.querySelector(".title")?.textContent).toBe("Event created");
  expect(item.querySelector(".description")?.textContent).toBe("Monday at 9:00");
  expect(item.getAttribute("role")).toBe("status");
  expect(item.dataset.mounted).toBe("true");
  await settle(element, 3900);
  expect(toasts(element)).toHaveLength(1);
  await settle(element, 200);
  expect(toasts(element)).toHaveLength(0);
  expect(onAutoClose).toHaveBeenCalledOnce();
});

test("the same id updates a toast in place and a promise settles it", async () => {
  const element = await toaster();
  let resolve!: (value: string) => void;
  const id = toast.promise(new Promise<string>(done => { resolve = done; }), { loading: "Saving", success: name => `Saved ${name}`, error: "Could not save" });
  await settle(element, 20);
  expect(toasts(element)[0]!.dataset.type).toBe("loading");
  await settle(element, 10000);
  expect(toasts(element)).toHaveLength(1);
  resolve("draft");
  await settle(element);
  expect(toasts(element)).toHaveLength(1);
  expect(toasts(element)[0]!.dataset.type).toBe("success");
  expect(toasts(element)[0]!.querySelector(".title")?.textContent).toBe("Saved draft");
  toast.dismiss(id);
  await settle(element, 300);
  expect(toasts(element)).toHaveLength(0);
});

test("stacks the newest in front and shows three at once", async () => {
  const element = await toaster();
  for (const title of ["One", "Two", "Three", "Four"]) toast(title);
  await settle(element, 20);
  const items = toasts(element);
  expect(items.map(item => item.querySelector(".title")?.textContent)).toEqual(["Four", "Three", "Two", "One"]);
  expect(items.map(item => item.dataset.front)).toEqual(["true", "false", "false", "false"]);
  expect(items.map(item => item.dataset.visible)).toEqual(["true", "true", "true", "false"]);
});

test("hovering spreads the stack and pauses its time", async () => {
  const element = await toaster('duration="4000"');
  toast("Paused");
  await settle(element, 20);
  const list = element.shadowRoot!.querySelector("ol")!;
  list.dispatchEvent(new PointerEvent("pointerenter"));
  await settle(element);
  expect(list.dataset.expanded).toBe("true");
  await settle(element, 10000);
  expect(toasts(element)).toHaveLength(1);
  list.dispatchEvent(new PointerEvent("pointerleave"));
  await settle(element, 4100);
  expect(toasts(element)).toHaveLength(0);
});

test("an action runs and closes the toast; the close button dismisses it", async () => {
  const element = await toaster("close-button");
  const onClick = vi.fn();
  const onDismiss = vi.fn();
  toast("Item archived", { action: { label: "Undo", onClick } });
  await settle(element, 20);
  const action = toasts(element)[0]!.querySelector<HTMLButtonElement>("button.action")!;
  expect(action.textContent).toBe("Undo");
  action.click();
  await settle(element);
  expect(onClick).toHaveBeenCalledOnce();
  expect(toasts(element)).toHaveLength(0);
  toast("Closable", { onDismiss });
  await settle(element, 20);
  const close = toasts(element)[0]!.querySelector<HTMLButtonElement>("button.close")!;
  expect(close.getAttribute("aria-label")).toBe("Close toast");
  close.click();
  await settle(element);
  expect(onDismiss).toHaveBeenCalledOnce();
  expect(toasts(element)).toHaveLength(0);
});

test("toast() adds a toaster when the page has none", async () => {
  vi.useFakeTimers();
  toast("Alone");
  const element = document.querySelector("ds-toast")!;
  expect(element).not.toBeNull();
  await settle(element, 20);
  expect(toasts(element)[0]!.querySelector(".title")?.textContent).toBe("Alone");
});

test("moving the toaster keeps its toasts and the time they had left", async () => {
  const element = await toaster('contained duration="4000"');
  toast("Moved");
  await settle(element, 3000);
  const parent = document.createElement("div");
  document.body.append(parent);
  parent.append(element);
  await settle(element, 900);
  expect(toasts(element)).toHaveLength(1);
  await settle(element, 300);
  expect(toasts(element)).toHaveLength(0);
});

test("an action can be a link, and following it closes the toast", async () => {
  const element = await toaster();
  toast("Invite sent", { action: { label: "Open", href: "#people" } });
  await settle(element, 20);
  const link = toasts(element)[0]!.querySelector<HTMLAnchorElement>("a.action")!;
  expect(link.getAttribute("href")).toBe("#people");
  link.click();
  await settle(element);
  expect(toasts(element)).toHaveLength(0);
});

 test("default toasts and resolved promises remain until explicitly dismissed", async () => {
  const element = await toaster();
  const onAutoClose = vi.fn();
  toast("Keep this", { onAutoClose });
  await settle(element, 60000);
  expect(toasts(element)).toHaveLength(1);
  expect(onAutoClose).not.toHaveBeenCalled();
  toasts(element)[0]!.querySelector<HTMLButtonElement>("button.close")!.click();
  await settle(element, 300);
  expect(toasts(element)).toHaveLength(0);
  toast.promise(Promise.resolve(), { loading: "Saving", success: "Saved", error: "Failed" });
  await settle(element, 60000);
  expect(toasts(element)).toHaveLength(1);
  expect(toasts(element)[0]!.querySelector(".title")?.textContent).toBe("Saved");
});


test("pressing a close icon inside shadow DOM does not capture the pointer", async () => {
  const element = await toaster();
  const onDismiss = vi.fn();
  toast.success("Copied", { duration: Infinity, onDismiss });
  await settle(element, 10000);
  const item = toasts(element)[0]!;
  const capture = vi.fn();
  item.setPointerCapture = capture;
  const close = item.querySelector<HTMLButtonElement>("button.close")!;
  const icon = close.querySelector("ds-icon")!;
  await icon.updateComplete;
  const glyph = icon.shadowRoot!.querySelector("svg")!;
  expect(glyph).not.toBeNull();
  glyph.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true, pointerId: 1 }));
  expect(capture).not.toHaveBeenCalled();
  glyph.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
  await settle(element, 500);
  expect(onDismiss).toHaveBeenCalledOnce();
  expect(toasts(element)).toHaveLength(0);
});
