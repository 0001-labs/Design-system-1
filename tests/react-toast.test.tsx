// @vitest-environment happy-dom
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, expect, test, vi } from "vite-plus/test";
vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const { Toaster, toast } = await import("../DS1/react/toast");
afterEach(() => document.body.replaceChildren());

test("calls made before the element loads appear once it has", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const id = toast.success("Saved", { description: "All changes" });
  await act(async () => { createRoot(host).render(createElement(Toaster, { position: "top-center" })); });
  await vi.waitFor(() => {
    const titles = [...document.querySelectorAll("ds-toast")].flatMap(el => [...el.shadowRoot?.querySelectorAll(".title") ?? []].map(t => t.textContent));
    expect(titles).toContain("Saved");
  });
  expect(document.querySelectorAll("ds-toast")).toHaveLength(1);
  expect(typeof id).toBe("string");
});
