// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
import { act, createElement, createRef } from "react";
import { createRoot } from "react-dom/client";
import type { Progress as ProgressElement } from "../DS1/2-core/ds-progress";
// The adapters write figures through the language module, so they load after fetch is stubbed.
vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
const { Progress } = await import("../DS1/react/progress");
const { Stat } = await import("../DS1/react/stat");
await import("../DS1/2-core/ds-stat");
await import("../DS1/2-core/ds-progress");
afterEach(() => document.body.replaceChildren());

async function render(element: ReturnType<typeof createElement>) {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const mount = document.createElement("div"); document.body.append(mount);
  const root = createRoot(mount);
  await act(async () => root.render(element));
  return { mount, unmount: () => act(async () => root.unmount()) };
}

test("a stat from React shows its slotted figure, and the element draws the change", async () => {
  // A test id is a native attribute on the host, as in JSX.
  const props = { label: "Revenue", value: 1200, format: "money" as const, currency: "USD", whole: true, change: -0.05, changeFormat: "percent" as const, tone: "danger" as const, "data-testid": "stat" };
  const { mount, unmount } = await render(createElement(Stat, props));
  try {
    const host = mount.querySelector("ds-stat")!; await host.updateComplete;
    expect(host.getAttribute("data-testid")).toBe("stat");
    expect(host.querySelector('[slot="figure"]')!.textContent).toBe("$1,200");
    expect(host.tone).toBe("danger");
    expect(host.changeFormat).toBe("percent");
    expect(host.shadowRoot!.querySelector('[part~="change"]')!.textContent!.trim()).toBe("-5%");
  } finally { await unmount(); }
});

test("a value against its range from React is the element with its values", async () => {
  const { mount, unmount } = await render(createElement(Progress, { label: "Seats", value: 7, max: 10, squares: 10 }));
  try {
    const host = mount.querySelector("ds-progress")!; await host.updateComplete;
    expect(host.getAttribute("role")).toBe("meter");
    expect(host.getAttribute("aria-valuetext")).toBe("7 of 10");
    expect(host.getAttribute("aria-label")).toBe("Seats");
    expect(host.shadowRoot!.querySelectorAll(".ds-progress__square--on")).toHaveLength(7);
  } finally { await unmount(); }
});

test("steps from React arrive as a property, with the current step marked", async () => {
  const ref = createRef<ProgressElement>();
  const { mount, unmount } = await render(createElement(Progress, { ref, steps: ["Apply", "Approval", "Connect"], current: 2, label: "Getting started" }));
  try {
    const host = mount.querySelector("ds-progress")!; await host.updateComplete;
    expect(ref.current).toBe(host);
    expect(host.literal).toBe(true);
    const items = [...host.shadowRoot!.querySelectorAll("li")];
    expect(items.map(item => item.getAttribute("aria-current"))).toEqual([null, "step", null]);
    expect(host.shadowRoot!.querySelector("ol")!.getAttribute("aria-label")).toBe("Getting started");
  } finally { await unmount(); }
});
