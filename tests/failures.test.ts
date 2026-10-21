// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
import { toast } from "../DS1/0-face/toast-queue";
import { reportFailure } from "../DS1/0-face/failures";
vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
await import("../DS1/2-core/ds-message");
const failure = { code: "document.save", message: "Document save failed" };
afterEach(() => { document.body.replaceChildren(); vi.useRealTimers(); });

test("only classified errors report, without visible content or extra fields", () => {
  const heard = vi.fn();
  window.addEventListener("ds-failure", heard);
  try {
    toast.warning("Check your connection", { failure });
    toast.success("Saved", { failure });
    toast.error("Name is required");
    toast.error("Private document title", { description: "Private content", failure });
    expect(heard).toHaveBeenCalledTimes(1);
    expect((heard.mock.calls[0][0] as CustomEvent).detail).toEqual(failure);
  } finally { window.removeEventListener("ds-failure", heard); }
});

test("inline failures report once per change and never scrape slotted content", async () => {
  const heard = vi.fn();
  window.addEventListener("ds-failure", heard);
  try {
    const element = document.createElement("ds-message");
    element.tone = "danger";
    element.innerHTML = '<span slot="heading">Private heading</span>Private content';
    document.body.append(element);
    await element.updateComplete;
    expect(heard).not.toHaveBeenCalled();
    element.failure = failure;
    await element.updateComplete;
    element.requestUpdate();
    await element.updateComplete;
    element.failure = { ...failure };
    await element.updateComplete;
    expect(heard).toHaveBeenCalledTimes(1);
    expect((heard.mock.calls[0][0] as CustomEvent).detail).toEqual(failure);
    element.failure = { code: "document.load", message: "Document load failed" };
    await element.updateComplete;
    expect(heard).toHaveBeenCalledTimes(2);
  } finally { window.removeEventListener("ds-failure", heard); }
});

test("promise failures report after rejection, success and malformed diagnostics stay quiet", async () => {
  const heard = vi.fn();
  window.addEventListener("ds-failure", heard);
  try {
    reportFailure({ code: "invalid code", message: "No" });
    reportFailure({ code: "valid", message: " " });
    toast.promise(Promise.resolve(1), { loading: "Saving", success: "Saved", error: "Failed", failure });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(heard).not.toHaveBeenCalled();
    toast.promise(Promise.reject(new Error("Private server response")), { loading: "Saving", success: "Saved", error: "Failed", failure });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(heard).toHaveBeenCalledTimes(1);
    expect((heard.mock.calls[0][0] as CustomEvent).detail).toEqual(failure);
  } finally { window.removeEventListener("ds-failure", heard); }
});
