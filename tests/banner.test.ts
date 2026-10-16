// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";

vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
await import("../DS1/2-core/ds-banner");

afterEach(() => document.body.replaceChildren());

test("a banner's action fires an event, is a button without a destination, and can be dismissed", async () => {
  const banner = document.createElement("ds-banner");
  banner.text = "Update ready"; banner.action = "Reload";
  document.body.append(banner);
  await banner.updateComplete;
  const action = vi.fn((event: Event) => event.preventDefault());
  banner.addEventListener("ds-banner-action", action);
  const button = banner.shadowRoot!.querySelector<HTMLButtonElement>(".action-wrapper button")!;
  expect(button).not.toBeNull();
  expect(banner.shadowRoot!.querySelector(".action-wrapper a")).toBeNull();
  button.click();
  expect((action.mock.calls[0]![0] as CustomEvent).detail).toEqual({ action: "Reload", href: null });

  banner.href = "/notes"; await banner.updateComplete;
  const link = banner.shadowRoot!.querySelector<HTMLAnchorElement>(".action-wrapper a")!;
  expect(link.getAttribute("href")).toBe("/notes");
  const click = new MouseEvent("click", { bubbles: true, cancelable: true });
  link.dispatchEvent(click);
  // A cancelled action keeps the link from being followed.
  expect(click.defaultPrevented).toBe(true);
  expect((action.mock.calls[1]![0] as CustomEvent).detail).toEqual({ action: "Reload", href: "/notes" });

  expect(banner.shadowRoot!.querySelector(".dismiss")).toBeNull();
  banner.dismissible = true; await banner.updateComplete;
  banner.shadowRoot!.querySelector<HTMLButtonElement>(".dismiss")!.click();
  expect(banner.hidden).toBe(true);
});
