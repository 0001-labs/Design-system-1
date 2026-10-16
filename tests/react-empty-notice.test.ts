// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
import { act, createElement, createRef } from "react";
import { createRoot } from "react-dom/client";
import { Empty } from "../DS1/react/empty";
import { Notice } from "../DS1/react/notice";
import type { Notice as NoticeElement } from "../DS1/2-core/ds-notice";
vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
await import("../DS1/2-core/ds-empty");
await import("../DS1/2-core/ds-notice");
afterEach(() => document.body.replaceChildren());

test("a dismissed notice asks the product, which removes it, and an unhandled one hides itself", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const mount = document.createElement("div"); document.body.append(mount);
  const root = createRoot(mount); const ref = createRef<NoticeElement>(); const dismiss = vi.fn();
  try {
    await act(async () => root.render(createElement(Notice, { ref, tone: "warning", onDismiss: dismiss, actions: createElement("button", null, "Keep mine") }, "Edited somewhere else")));
    const host = mount.querySelector("ds-notice")!; await host.updateComplete;
    expect(ref.current).toBe(host);
    expect(host.dismissible).toBe(true);
    expect(host.getAttribute("role")).toBe("status");
    expect(host.textContent).toContain("Edited somewhere else");
    expect(host.shadowRoot!.querySelector('[part="actions"]')!.hasAttribute("hidden")).toBe(false);
    host.shadowRoot!.querySelector<HTMLButtonElement>('[part="dismiss"]')!.click();
    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(host.hidden).toBe(false);

    await act(async () => root.render(createElement(Notice, { dismissible: true }, "Saved")));
    const plain = mount.querySelector("ds-notice")!; await plain.updateComplete;
    plain.shadowRoot!.querySelector<HTMLButtonElement>('[part="dismiss"]')!.click();
    expect(plain.hidden).toBe(true);
  } finally { await act(async () => root.unmount()); }
});

test("an empty state takes its heading, text and actions as slotted content", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const mount = document.createElement("div"); document.body.append(mount);
  const root = createRoot(mount);
  try {
    // A test id is a native attribute on the host, as in JSX.
    const props = { heading: "No results", centered: true, level: 3, "data-testid": "empty" };
    await act(async () => root.render(createElement(Empty, props, "Try another word.")));
    const host = mount.querySelector("ds-empty")!; await host.updateComplete;
    expect(host.centered).toBe(true);
    expect(host.getAttribute("data-testid")).toBe("empty");
    expect(host.querySelector('[slot="heading"]')!.textContent).toBe("No results");
    expect(host.shadowRoot!.querySelector('[part="title"]')!.getAttribute("aria-level")).toBe("3");
    expect(host.shadowRoot!.querySelector('[part="text"]')!.hasAttribute("hidden")).toBe(false);
    expect(host.shadowRoot!.querySelector('[part="actions"]')!.hasAttribute("hidden")).toBe(true);
  } finally { await act(async () => root.unmount()); }
});
