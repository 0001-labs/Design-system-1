// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test, vi } from "vite-plus/test";
import type { Button } from "../DS1/2-core/ds-button";
import { ButtonLink } from "../DS1/react/button";

vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
await import("../DS1/2-core/ds-button");
afterEach(() => document.body.replaceChildren());

const read = (path: string) => readFileSync(join(import.meta.dirname, "..", path), "utf8");

async function button(markup: string) {
  document.body.innerHTML = markup;
  const host = document.querySelector<Button>("ds-button")!;
  await host.updateComplete;
  return host;
}
const face = (host: Button) => host.shadowRoot!.querySelector<HTMLElement>('[part="control"]')!;

test("a button with href is a real link the browser navigates", async () => {
  const host = await button('<ds-button secondary href="#icons">Icons</ds-button>');
  const link = face(host);
  expect(link.localName).toBe("a");
  expect(link.getAttribute("href")).toBe("#icons");
  expect(link.hasAttribute("target")).toBe(false);
  expect(link.hasAttribute("secondary")).toBe(true);
  expect(host.shadowRoot!.querySelector("button")).toBeNull();
  const open = vi.spyOn(window, "open");
  const reached = vi.fn();
  document.addEventListener("click", reached);
  try {
    // The component neither cancels nor redirects a plain or a modified click: the browser does what links do.
    for (const init of [{}, { metaKey: true }, { ctrlKey: true }, { button: 1 }]) {
      const click = new MouseEvent("click", { bubbles: true, composed: true, cancelable: true, ...init });
      link.dispatchEvent(click);
      expect(click.defaultPrevented).toBe(false);
    }
    expect(reached).toHaveBeenCalledTimes(4);
    expect(open).not.toHaveBeenCalled();
  } finally { document.removeEventListener("click", reached); open.mockRestore(); }
  host.focus();
  expect(host.shadowRoot!.activeElement).toBe(link);
});

test("blank opens a new tab safely, and target and rel are the link's own", async () => {
  let host = await button('<ds-button href="/docs/" blank>Docs</ds-button>');
  expect(face(host).getAttribute("target")).toBe("_blank");
  expect(face(host).getAttribute("rel")).toBe("noopener noreferrer");
  host = await button('<ds-button href="/docs/" target="docs" rel="external">Docs</ds-button>');
  expect(face(host).getAttribute("target")).toBe("docs");
  expect(face(host).getAttribute("rel")).toBe("external");
});

test("a disabled link has no destination and cannot navigate", async () => {
  const host = await button('<ds-button primary href="#icons" blank disabled>Icons</ds-button>');
  const link = face(host);
  expect(link.localName).toBe("a");
  expect(link.hasAttribute("href")).toBe(false);
  expect(link.hasAttribute("target")).toBe(false);
  expect(link.getAttribute("aria-disabled")).toBe("true");
  expect(link.getAttribute("role")).toBe("link");
  const click = new MouseEvent("click", { bubbles: true, composed: true, cancelable: true });
  link.dispatchEvent(click);
  expect(click.defaultPrevented).toBe(true);
  host.disabled = false;
  await host.updateComplete;
  expect(link.getAttribute("href")).toBe("#icons");
  expect(link.hasAttribute("aria-disabled")).toBe(false);
  expect(link.hasAttribute("role")).toBe(false);
});

test("the link face is drawn by every rule that draws the button face", () => {
  const css = read("DS1/2-core/styles/ds-button.css");
  const selectors = css.replace(/\/\*[\s\S]*?\*\//g, "").split("{").map(part => part.split("}").pop()!.trim());
  expect(selectors.filter(selector => /(^|[\s,(])button(?![\w-])/.test(selector.replace(/:is\(button[^)]*\)/g, "")))).toEqual([]);
  for (const rule of [":is(button, a) {", ":is(button, a)[primary] {", ":is(button, a)[secondary] {", ":host([icon]) :is(button, a) {", ':is(button:disabled, a[aria-disabled="true"]) {']) expect(css).toContain(rule);
});

test("ButtonLink matches the element: a safe new tab, and a disabled link stays a link", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const mount = document.createElement("div"); document.body.append(mount);
  const root = createRoot(mount);
  try {
    await act(async () => root.render(h(ButtonLink, { href: "/docs/", target: "_blank" }, "Docs")));
    const link = mount.querySelector("a")!;
    expect(link.rel).toBe("noopener noreferrer");
    await act(async () => root.render(h(ButtonLink, { href: "/docs/", target: "_blank", disabled: true }, "Docs")));
    expect(link.hasAttribute("href")).toBe(false);
    expect(link.hasAttribute("target")).toBe(false);
    expect(link.getAttribute("role")).toBe("link");
    expect(link.getAttribute("aria-disabled")).toBe("true");
  } finally { await act(async () => root.unmount()); }
});

test("a native link drawn as a button keeps every face and state of the button", () => {
  const css = read("DS1/1-root/controls.css");
  const rule = (selector: string) => {
    const start = css.indexOf(`${selector} {`);
    expect(start, selector).toBeGreaterThanOrEqual(0);
    return css.slice(start, css.indexOf("}", start));
  };
  expect(rule("a.ds-button:is(:hover, :focus, :active)")).toContain("text-decoration: none");
  expect(css).toMatch(/a\.ds-button,\s*a\.ds-button:is\(:hover, :focus, :active\) \{\s*text-decoration: none;/);
  expect(rule("a.ds-button:is(:link, :visited)")).toContain("color: var(--ds-button-color, var(--ds-button-text-color))");
  expect(rule("a.ds-button.ds-button--icon:is(:link, :visited)")).toContain("var(--ds-text-color-muted)");
  expect(rule('a.ds-button[aria-disabled="true"]')).toContain("pointer-events: none");
  expect(css).toContain('.ds-button[aria-disabled="true"]');
  // Hover fills never light up a disabled link.
  expect(css).not.toMatch(/\.ds-button[^{]*:hover:not\(:disabled\)/);
  for (const hover of ['.ds-button--icon:hover:not(:disabled, [aria-disabled="true"])', '.ds-button--secondary:hover:not(:disabled, [aria-disabled="true"])', '.ds-tabs[role="group"] > .ds-button:hover:not(:disabled, [aria-disabled="true"])']) expect(css).toContain(hover);
});

test("a text link has tokens, a hover line, a visited ink and a focus ring, and no capitals", () => {
  const css = read("DS1/1-root/controls.css");
  const rule = (selector: string) => {
    const start = css.indexOf(`${selector} {`);
    expect(start, selector).toBeGreaterThanOrEqual(0);
    return css.slice(start, css.indexOf("}", start));
  };
  const link = rule(".ds-link");
  expect(link).toContain("color: var(--ds-link-color, currentColor)");
  expect(link).toContain("text-decoration-line: underline");
  expect(link).toContain("text-decoration-thickness: 1px");
  expect(link).not.toMatch(/text-transform|transition/);
  expect(rule(".ds-link:visited")).toContain("var(--ds-link-visited-color");
  expect(rule(".ds-link:hover")).toContain("var(--ds-link-hover-line-color, currentColor)");
  expect(rule(".ds-link:focus-visible")).toContain("outline: 2px solid var(--ds-focus-ring)");
  expect(rule('.ds-link[aria-disabled="true"]')).toContain("pointer-events: none");
});
