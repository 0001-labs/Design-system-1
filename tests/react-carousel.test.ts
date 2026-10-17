// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
import { act, createElement, createRef } from "react";
import { createRoot } from "react-dom/client";
import { Carousel } from "../DS1/react/carousel";
import type { Carousel as CarouselElement } from "../DS1/3-unit/ds-carousel";
vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
await import("../DS1/3-unit/ds-carousel");
afterEach(() => document.body.replaceChildren());

test("the carousel takes its slides as children and tells the product which slide a person moved to", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const mount = document.createElement("div"); document.body.append(mount);
  const root = createRoot(mount); const ref = createRef<CarouselElement>(); const change = vi.fn();
  const slides = ["White", "Black", "Olive"].map(name => createElement("figure", { key: name }, name));
  try {
    await act(async () => root.render(createElement(Carousel, { ref, label: "Colours", buttons: true, slideWidth: 12, onChange: change }, slides)));
    const host = mount.querySelector("ds-carousel")!; await host.updateComplete;
    expect(ref.current).toBe(host);
    expect(host.getAttribute("aria-label")).toBe("Colours");
    expect(host.buttons).toBe(true);
    expect(host.slideWidth).toBe(12);
    expect(host.querySelectorAll("figure")[1]!.getAttribute("aria-label")).toBe("2 of 3");
    host.shadowRoot!.querySelector<HTMLButtonElement>(".ds-carousel__next")!.click();
    expect(change).toHaveBeenCalledWith(1, 0);
    await act(async () => root.render(createElement(Carousel, { ref, label: "Colours", current: 2, dots: false }, slides)));
    await host.updateComplete;
    expect(host.current).toBe(2);
    expect(host.noDots).toBe(true);
  } finally { await act(async () => root.unmount()); }
});
