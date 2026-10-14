// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
await import("../DS1/2-core/ds-badge");
afterEach(() => document.body.replaceChildren());

test("compact status keeps the label and adds no action or tab stop", async () => {
  const badge = document.createElement("ds-badge");
  badge.icon = "lock"; badge.iconOnly = true; badge.textContent = "Password on";
  document.body.append(badge); await badge.updateComplete;
  expect(badge.textContent).toBe("Password on");
  expect(badge.shadowRoot!.querySelector(".icon-only .label slot")).not.toBeNull();
  expect(badge.shadowRoot!.querySelector("ds-icon")?.getAttribute("aria-hidden")).toBe("true");
  expect(badge.hasAttribute("tabindex")).toBe(false);
  expect(badge.shadowRoot!.querySelector("button")).toBeNull();
  badge.iconOnly = false; badge.textContent = "Access restored"; await badge.updateComplete;
  expect(badge.shadowRoot!.querySelector(".icon-only")).toBeNull();
  expect(badge.textContent).toBe("Access restored");
});

test("icon-only without an icon falls back to readable status text", async () => {
  const badge = document.createElement("ds-badge");
  badge.iconOnly = true; badge.textContent = "Draft";
  document.body.append(badge); await badge.updateComplete;
  expect(badge.shadowRoot!.querySelector(".icon-only")).toBeNull();
  expect(badge.shadowRoot!.querySelector("ds-icon")).toBeNull();
  expect(badge.shadowRoot!.querySelector("slot")).not.toBeNull();
});
