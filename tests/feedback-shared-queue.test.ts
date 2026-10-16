// @vitest-environment happy-dom
import { expect, test, vi } from "vite-plus/test";
vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));

test("the page toaster stays quiet where a <ds-toast> draws, so a page shows one stack", async () => {
  vi.useFakeTimers();
  const feedback = await import("../DS1/0-face/feedback");
  const page = feedback.pageToaster()!;
  // A page that loads the element after the page toaster: the element takes the toasts.
  const element = await import("../DS1/2-core/ds-toast");
  expect(element.toast).toBe(feedback.toast);
  feedback.toast("Saved");
  await vi.advanceTimersByTimeAsync(20);
  const toaster = document.querySelector("ds-toast")!;
  await toaster.updateComplete;
  expect([...toaster.shadowRoot!.querySelectorAll(".title")].map(title => title.textContent)).toEqual(["Saved"]);
  expect(page.shadowRoot!.querySelectorAll("li.toast")).toHaveLength(0);
  // copyText's toast goes to the same stack.
  vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn(async () => undefined) } });
  await feedback.copyText("abc");
  await vi.advanceTimersByTimeAsync(20);
  await toaster.updateComplete;
  expect([...toaster.shadowRoot!.querySelectorAll(".title")].map(title => title.textContent)).toEqual(["Copied", "Saved"]);
  expect(page.shadowRoot!.querySelectorAll("li.toast")).toHaveLength(0);
  expect(document.querySelectorAll("ds-toast")).toHaveLength(1);
  vi.useRealTimers();
});
