// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";

vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
await import("../DS1/2-core/ds-notice");

afterEach(() => document.body.replaceChildren());

test("a banner is the notice on one line across the top, its actions real controls, and it can be dismissed", async () => {
  document.body.innerHTML = `<ds-notice banner tone="success" text="Update ready" literal><button slot="actions" type="button">Reload</button></ds-notice>`;
  const notice = document.querySelector("ds-notice")!;
  await notice.updateComplete;
  const block = notice.shadowRoot!.querySelector(".ds-notice")!;
  expect(block.classList.contains("ds-notice--banner")).toBe(true);
  expect(block.classList.contains("ds-notice--success")).toBe(true);
  expect(notice.getAttribute("role")).toBe("status");
  expect(notice.querySelector("[slot=actions]")!.textContent).toBe("Reload");
  expect(notice.shadowRoot!.querySelector(".ds-notice__dismiss")).toBeNull();
  notice.dismissible = true; await notice.updateComplete;
  const dismissed = vi.fn();
  notice.addEventListener("ds-notice-dismiss", dismissed);
  notice.shadowRoot!.querySelector<HTMLButtonElement>(".ds-notice__dismiss")!.click();
  expect(dismissed).toHaveBeenCalledOnce();
  expect(notice.hidden).toBe(true);
});

test("the banner's sheet puts it across the top, one square high, on the tone's fill", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const css = readFileSync(join(import.meta.dirname, "../DS1/1-root/notice.css"), "utf8");
  const rule = css.slice(css.indexOf(".ds-notice--banner {"), css.indexOf("}", css.indexOf(".ds-notice--banner {")));
  for (const line of ["position: absolute", "top: 0", "height: var(--ds-unit)", "color-mix(in srgb, var(--ds-notice-mark) 40%, transparent)"]) expect(rule).toContain(line);
});
