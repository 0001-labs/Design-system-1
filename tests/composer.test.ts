// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
import { act, createElement as h, createRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { Composer } from "../DS1/react/composer";
import "../DS1/2-core/ds-composer";
afterEach(() => document.body.replaceChildren());
// The native value setter, as a browser sets the value, so React sees the change.
const nativeValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!;
const setValue = (element: HTMLTextAreaElement, value: string) => nativeValue.set!.call(element, value);

test("highlights preserve every original character, escape markup and reject invalid or overlapping ranges", async () => {
  document.body.innerHTML = '<ds-composer><textarea name="message" rows="2"></textarea></ds-composer>';
  const host = document.querySelector("ds-composer")!, input = host.querySelector("textarea")!;
  input.value = "Hello 雪 <b>\nNext line";
  host.highlights = [{start: 6, end: 7}, {start: 6, end: 10}, {start: -1, end: 2}, {start: 100, end: 101}];
  await host.updateComplete;
  host.refresh(); await host.updateComplete;
  expect(host.shadowRoot!.querySelector(".mirror")!.textContent).toBe(input.value + "\n");
  expect(host.shadowRoot!.querySelectorAll("mark")).toHaveLength(1);
  expect(host.shadowRoot!.querySelector("b")).toBeNull();
  input.scrollTop = 40; input.scrollLeft = 20; input.dispatchEvent(new Event("scroll"));
  expect(host.shadowRoot!.querySelector(".mirror")!.scrollTop).toBe(40);
  expect(host.shadowRoot!.querySelector(".mirror")!.scrollLeft).toBe(20);
});

test("React preserves native refs, labels, ARIA links, forms, rejected edits and keyboard cancellation", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const mount = document.createElement("div"); document.body.append(mount);
  const root = createRoot(mount), ref = createRef<HTMLTextAreaElement>(), changed = vi.fn();
  function Example() {
    const [value, setValue] = useState("Hi Snow");
    return h("form", {}, h("label", {htmlFor: "message"}, "Message"), h(Composer, {
      ref, id: "message", name: "body", value, highlights: [{start: 3, end: 7}],
      "aria-controls": "people", "aria-activedescendant": "snow", maxLength: 80,
      onChange: event => { changed(event.target.value); if (!event.target.value.includes("reject")) setValue(event.target.value); },
      onKeyDown: event => { if (event.key === "Enter") event.preventDefault(); },
    }), h("div", {id: "people", role: "listbox"}, h("div", {id: "snow", role: "option"}, "Snow")));
  }
  try {
    await act(async () => root.render(h(Example)));
    const input = ref.current!, host = input.parentElement as HTMLElementTagNameMap["ds-composer"];
    await host.updateComplete;
    expect(input.getRootNode()).toBe(document);
    expect(input.labels![0].textContent).toBe("Message");
    expect(document.getElementById(input.getAttribute("aria-activedescendant")!)?.textContent).toBe("Snow");
    input.focus(); input.setSelectionRange(3, 7);
    expect(document.activeElement).toBe(input); expect(input.selectionEnd).toBe(7);
    await act(async () => { setValue(input, "Hi Snow\nAgain"); input.dispatchEvent(new Event("input", {bubbles: true})); });
    expect(changed).toHaveBeenLastCalledWith("Hi Snow\nAgain");
    expect(new FormData(mount.querySelector("form")!).getAll("body")).toEqual(["Hi Snow\nAgain"]);
    await act(async () => { setValue(input, "reject"); input.dispatchEvent(new Event("input", {bubbles: true})); });
    expect(input.value).toBe("Hi Snow\nAgain");
    await host.updateComplete;
    expect(host.shadowRoot!.querySelector(".mirror")!.textContent).toBe(input.value + "\n");
    const enter = new KeyboardEvent("keydown", {key: "Enter", bubbles: true, cancelable: true});
    input.dispatchEvent(enter); expect(enter.defaultPrevented).toBe(true);
  } finally { await act(async () => root.unmount()); }
});

test("uncontrolled form reset and reconnect refresh the overlay; SSR keeps the native field", async () => {
  document.body.innerHTML = '<form><ds-composer><textarea name="body">Original</textarea></ds-composer></form>';
  const host = document.querySelector("ds-composer")!, input = host.querySelector("textarea")!;
  host.highlights = [{start: 0, end: 8}]; await host.updateComplete;
  input.value = "Modified"; input.dispatchEvent(new Event("input")); await host.updateComplete;
  input.form!.reset(); await Promise.resolve(); await host.updateComplete;
  expect(host.shadowRoot!.querySelector(".mirror")!.textContent).toBe("Original\n");
  host.remove(); input.value = "Returned"; document.body.append(host); await host.updateComplete;
  expect(host.shadowRoot!.querySelector(".mirror")!.textContent).toBe("Returned\n");
  expect(renderToString(h(Composer, {name: "message", defaultValue: "Server text"}))).toContain('<textarea name="message">Server text</textarea>');
});

test("a filled highlight lies behind the words in its own colour, the accent included", async () => {
  document.body.innerHTML = '<ds-composer><textarea></textarea></ds-composer>';
  const host = document.querySelector("ds-composer")!, input = host.querySelector("textarea")!;
  input.value = "#594dff and the last change";
  host.highlights = [{start: 0, end: 7, color: "#594dff", fill: true}, {start: 12, end: 27, fill: true}];
  await host.updateComplete;
  host.refresh(); await host.updateComplete;
  const marks = [...host.shadowRoot!.querySelectorAll("mark")];
  expect(marks.map(mark => mark.className)).toEqual(["fill", "fill"]);
  expect(marks[0]!.style.getPropertyValue("--composer-highlight-color")).toBe("#594dff");
  expect(marks[1]!.style.getPropertyValue("--composer-highlight-color")).toBe("");
  host.highlights = [{start: 0, end: 7}]; await host.updateComplete;
  expect(host.shadowRoot!.querySelector("mark")!.className).toBe("");
});

test("a filled highlight keeps the words readable over every palette colour, on light and dark", async () => {
  const { readFileSync } = await import("node:fs");
  const path = await import("node:path");
  const { named, isInk, toHsl } = await import("../DS1/1-root/palette");
  const css = readFileSync(path.join(import.meta.dirname, "../DS1/2-core/styles/ds-composer.css"), "utf8");
  const fill = css.slice(css.indexOf("mark.fill {"), css.indexOf("}", css.indexOf("mark.fill {")));
  expect(fill).toContain("color: var(--ds-text-color)");
  const [light, dark] = [...fill.matchAll(/var\(--ds-accent-color\)\) (\d+)%, transparent/g)].map(match => Number(match[1]) / 100);
  expect([light, dark]).toEqual([0.5, 0.3]);
  const rgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const lum = (c: number[]) => { const [r, g, b] = c.map(x => x / 255).map(x => x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4); return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!; };
  const contrast = (a: number[], b: number[]) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };
  const over = (colour: string, paper: string, share: number) => rgb(colour).map((c, i) => c * share + rgb(paper)[i]! * (1 - share));
  for (const [name, hex] of named) {
    if (isInk(toHsl(hex))) continue;
    // The field's fill and the paper, under the light and dark text colours.
    for (const paper of ["#e6e6e6", "#f4f4f4"]) expect(contrast(rgb("#2a2a2a"), over(hex, paper, light!)), `${name} on ${paper}`).toBeGreaterThanOrEqual(4.5);
    for (const paper of ["#3c3c3c", "#2c2c2c"]) expect(contrast(rgb("#ffffff"), over(hex, paper, dark!)), `${name} on ${paper}`).toBeGreaterThanOrEqual(4.5);
  }
});
