// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { afterEach, expect, test, vi } from "vite-plus/test";
import type { Row } from "../DS1/3-unit/ds-row";

await import("../DS1/3-unit/ds-row");
afterEach(() => document.body.replaceChildren());

async function row(attributes: string, content = "<span>Atlas</span><span>12</span>") {
  document.body.innerHTML = `<ds-row ${attributes}>${content}</ds-row>`;
  const element = document.querySelector("ds-row") as Row;
  await element.updateComplete;
  return element;
}
const target = (element: Row) => element.shadowRoot!.querySelector<HTMLElement>(".target");
const click = (element: HTMLElement, init: MouseEventInit = {}) => {
  const event = new MouseEvent("click", { bubbles: true, composed: true, cancelable: true, ...init });
  element.dispatchEvent(event);
  return event;
};

test("a row without href or interactive stays a layout row with no press target", async () => {
  const element = await row("fill");
  expect(target(element)).toBeNull();
  expect(element.shadowRoot!.querySelector("slot:not([name])")).not.toBeNull();
  expect(element.shadowRoot!.querySelector('slot[name="end"]')).toBeNull();
});

test("href makes the whole row one link that keeps its content in the default slot and controls in end outside it", async () => {
  const element = await row('href="/atlas/"', '<span>Atlas</span><button slot="end">Buy</button>');
  const link = target(element)!;
  expect(link.localName).toBe("a");
  expect(link.getAttribute("href")).toBe("/atlas/");
  expect(link.querySelector("slot:not([name])")).not.toBeNull();
  const end = element.shadowRoot!.querySelector('slot[name="end"]')!;
  expect(link.contains(end)).toBe(false);
  expect(link.hasAttribute("aria-current")).toBe(false);
});

test("current marks the destination with aria-current, page unless another value is given", async () => {
  expect(target(await row('href="/a/" current'))!.getAttribute("aria-current")).toBe("page");
  expect(target(await row('href="/a/" current="step"'))!.getAttribute("aria-current")).toBe("step");
  expect(target(await row('href="/a/" current="nonsense"'))!.getAttribute("aria-current")).toBe("page");
  expect(target(await row('href="/a/" current="false"'))!.hasAttribute("aria-current")).toBe(false);
  const element = await row('href="/a/"');
  element.current = "page";
  await element.updateComplete;
  expect(target(element)!.getAttribute("aria-current")).toBe("page");
  expect(element.getAttribute("current")).toBe("page");
});

test("interactive makes the row a button, and a disabled one cannot be pressed", async () => {
  const element = await row("interactive");
  const button = target(element) as HTMLButtonElement;
  expect(button.localName).toBe("button");
  expect(button.type).toBe("button");
  const press = vi.fn();
  element.addEventListener("ds-row-press", press);
  button.click();
  expect(press).toHaveBeenCalledOnce();
  element.disabled = true;
  await element.updateComplete;
  expect(button.disabled).toBe(true);
});

test("a disabled link has no href and stays a link announced as unavailable", async () => {
  const link = target(await row('href="/a/" disabled'))!;
  expect(link.hasAttribute("href")).toBe(false);
  expect(link.getAttribute("role")).toBe("link");
  expect(link.getAttribute("aria-disabled")).toBe("true");
});

test("a press can be taken over, while modified clicks on a link are the browser's", async () => {
  const element = await row('href="/atlas/"');
  const press = vi.fn((event: Event) => event.preventDefault());
  element.addEventListener("ds-row-press", press);
  const plain = click(target(element)!);
  expect(press).toHaveBeenCalledOnce();
  expect((press.mock.calls[0]![0] as CustomEvent).detail).toEqual({ href: "/atlas/" });
  expect(plain.defaultPrevented).toBe(true);
  const modified = click(target(element)!, { metaKey: true });
  expect(modified.defaultPrevented).toBe(false);
  expect(press).toHaveBeenCalledOnce();
});

test("a control in the end slot presses itself, not the row", async () => {
  const element = await row("interactive", '<span>Atlas</span><button slot="end" type="button">Buy</button>');
  const press = vi.fn();
  element.addEventListener("ds-row-press", press);
  element.querySelector("button")!.click();
  expect(press).not.toHaveBeenCalled();
});

test("label names the target, and focus() lands on it", async () => {
  const element = await row('href="/a/" label="Open Atlas"');
  expect(target(element)!.getAttribute("aria-label")).toBe("Open Atlas");
  element.focus();
  expect(element.shadowRoot!.activeElement).toBe(target(element));
});

const css = (path: string) => readFileSync(path, "utf8");

test("the element and the native class draw the same states from the same tokens", () => {
  const element = css("DS1/3-unit/styles/ds-row.css");
  const native = css("DS1/1-root/row.css");
  for (const sheet of [element, native]) {
    for (const token of ["--ds-row-fill-hover", "--ds-row-fill-press", "--ds-row-fill-current", "--ds-row-current-weight", "--ds-row-padding"]) expect(sheet).toContain(`var(${token}`);
    expect(sheet).toContain("outline: 2px solid var(--ds-focus-ring);");
    expect(sheet).toContain("outline-offset: -2px;");
    expect(sheet).toContain("--ds-row-radius: calc(2px * var(--ds-sf));");
    expect(sheet).toContain("opacity: 0.5;");
  }
  expect(element).toContain('::slotted([slot="end"]) { position: relative; z-index: 2; }');
  expect(native).toMatch(/\.ds-row:has\(\.ds-row__target\) :where\(a\[href\], button, input, select, textarea, label, summary, \[tabindex\]\):not\(\.ds-row__target\) \{\s*position: relative;\s*z-index: 2;/);
});

test("the sidebar's rows read the row tokens, so the current row looks the same everywhere", () => {
  const tokens = css("DS1/1-root/component-tokens.css");
  expect(tokens).toContain("--ds-row-fill-hover: var(--ds-fill);");
  expect(tokens).toContain("--ds-row-fill-current: var(--ds-fill-hover);");
  expect(tokens).toContain("--ds-row-current-weight: var(--ds-type-weight-bold);");
  const sidebar = css("DS1/3-unit/styles/ds-sidebar.css");
  expect(sidebar).toContain(".row:hover { background: var(--ds-row-fill-hover, var(--ds-fill)); }");
  expect(sidebar).toContain(".row[data-current] { background: var(--ds-row-fill-current, var(--ds-fill-hover)); }");
  expect(sidebar).toContain("border-radius: calc(2px * var(--ds-sf));");
});

test("controls.css imports the row sheet, and the tree's arrow is the library's right icon", () => {
  expect(css("DS1/1-root/controls.css")).toContain('@import "./row.css";');
  const path = /<path d="([^"]+)"/.exec(css("DS1/x-icon/right.svg"))![1]!;
  const native = css("DS1/1-root/row.css");
  const embedded = [...native.matchAll(/url\("data:image\/svg\+xml,([^"]+)"\)/g)].map(([, data]) => decodeURIComponent(data!));
  expect(embedded.length).toBe(2);
  for (const svg of embedded) expect(svg).toContain(`d='${path}'`);
});

test("open details are controlled independently of navigation and reset on close", async () => {
  const element = await row("interactive");
  expect(target(element)!.hasAttribute("aria-expanded")).toBe(false);
  element.open = true;
  await element.updateComplete;
  expect(element.hasAttribute("open")).toBe(true);
  expect(target(element)!.getAttribute("aria-expanded")).toBe("true");
  expect(target(element)!.hasAttribute("aria-current")).toBe(false);
  target(element)!.click();
  expect(element.open).toBe(true);
  element.open = false;
  await element.updateComplete;
  expect(element.hasAttribute("open")).toBe(false);
  expect(target(element)!.getAttribute("aria-expanded")).toBe("false");
});

test("a record's name and value are drawn alike by the element and the native class", () => {
  const element = css("DS1/3-unit/styles/ds-row.css");
  const native = css("DS1/1-root/row.css");
  // Comments can hold braces (a page's `* { margin: 0 }` reset): read the rules without them.
  const rule = (css: string, selector: string) => css.replace(/\/\*[\s\S]*?\*\//g, "").match(new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\{([^}]*)\\}"))?.[1];
  const name = [rule(element, "::slotted(.ds-row__name)"), rule(native, ".ds-row .ds-row__name")];
  for (const css of name) {
    expect(css).toContain("flex: 0 1 auto");
    expect(css).toContain("min-width: 0");
    expect(css).toContain("text-overflow: clip");
    expect(css).not.toContain("ellipsis");
  }
  const cut = [rule(element, '::slotted(.ds-row__name[data-cut="end"])'), rule(native, '.ds-row .ds-row__name[data-cut="end"]')];
  for (const css of cut) expect(css).toContain("calc(100% - var(--ds-unit))");
  const value = [rule(element, "::slotted(.ds-row__value)"), rule(native, ".ds-row .ds-row__value")];
  for (const css of value) {
    expect(css).toContain("margin-inline-start: auto");
    expect(css).toContain("font-variant-numeric: tabular-nums");
  }
});

test("the element marks a name cut while its words are wider than its box, and unmarks it when they fit", async () => {
  const element = await row("", '<span class="ds-row__name">A long name</span><span class="ds-row__value">12</span>');
  const name = element.querySelector<HTMLElement>(".ds-row__name")!;
  // happy-dom has no layout: stand in for the measures a browser would give.
  Object.defineProperty(name, "scrollWidth", { value: 120, configurable: true });
  Object.defineProperty(name, "clientWidth", { value: 80, configurable: true });
  const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  (element as unknown as { measureNames: () => void }).measureNames();
  await frame();
  expect(name.getAttribute("data-cut")).toBe("end");
  Object.defineProperty(name, "clientWidth", { value: 120, configurable: true });
  (element as unknown as { measureNames: () => void }).measureNames();
  await frame();
  expect(name.hasAttribute("data-cut")).toBe(false);
});
