// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
const { message } = await import("../DS1/2-core/ds-message");
await import("../DS1/2-core/ds-notice");
afterEach(() => document.body.replaceChildren());

test("one message changes between inline, banner and assistant without losing its content", async () => {
  const element = document.createElement("ds-message");
  element.heading = "Assistant";
  element.text = "Your draft is ready.";
  element.literal = true;
  document.body.append(element);
  for (const form of ["inline", "banner", "assistant"] as const) {
    element.form = form;
    await element.updateComplete;
    expect(element.shadowRoot!.textContent).toContain("Your draft is ready.");
    expect(Boolean(element.shadowRoot!.querySelector(".ds-notice--banner"))).toBe(form === "banner");
    expect(element.getAttribute("role")).toBe("status");
  }
  element.tone = "danger";
  await element.updateComplete;
  expect(element.getAttribute("role")).toBe("alert");
});

test("dismissal is cancelable, and the old name retains its event", async () => {
  for (const tag of ["ds-message", "ds-notice"] as const) {
    const element = document.createElement(tag);
    document.body.append(element);
    await element.updateComplete;
    element.addEventListener(`${tag}-dismiss`, e => e.preventDefault(), { once: true });
    expect(element.dismiss()).toBe(false);
    expect(element.hidden).toBe(false);
    expect(element.dismiss()).toBe(true);
    expect(element.hidden).toBe(true);
  }
});

test("the toast form receives the shared queue and preserves its configuration", async () => {
  const element = document.createElement("ds-message");
  element.form = "toast";
  element.position = "top-center";
  element.duration = Infinity;
  element.closeButton = true;
  document.body.append(element);
  await element.updateComplete;
  const stack = element.shadowRoot!.querySelector("ds-toast")!;
  await stack.updateComplete;
  message.success("Saved", { id: "save" });
  await stack.updateComplete;
  expect(stack.shadowRoot!.textContent).toContain("Saved");
  expect(stack.position).toBe("top-center");
  expect(stack.duration).toBe(Infinity);
  expect(stack.closeButton).toBe(true);
  expect(document.querySelector("ds-toast")).toBeNull();
  expect(element.getAttribute("role")).toBe("presentation");
});
