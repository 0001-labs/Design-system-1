// @vitest-environment happy-dom
import { afterEach, expect, test } from "vite-plus/test";
import { act, createElement as h, createRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ColorInput } from "../DS1/react/choice";
import "../DS1/2-core/ds-color";
import "../DS1/2-core/ds-swatch";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
afterEach(() => document.body.replaceChildren());
// The native value setter, as a browser sets the value, so React sees the change.
const nativeValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!;
const setValue = (element: HTMLInputElement, value: string) => nativeValue.set!.call(element, value);

test("native colour edits preserve React acceptance, labels, refs and form values", async () => {
  const mount = document.createElement("div"); document.body.append(mount);
  const root = createRoot(mount), ref = createRef<HTMLInputElement>();
  function Example({ accept = true }) {
    const [value, change] = useState("#99ff73");
    return h("form", null, h("label", null, "Accent", h(ColorInput, {
      ref, name: "accent", value, onChange: event => { if (accept) change(event.currentTarget.value); },
    })));
  }
  try {
    await act(async () => root.render(h(Example)));
    const input = ref.current!;
    expect(input.labels?.[0]?.textContent).toBe("Accent");
    await act(async () => { setValue(input, "#594dff"); input.dispatchEvent(new Event("input", { bubbles: true })); });
    expect(input.value).toBe("#594dff"); expect(new FormData(input.form!).get("accent")).toBe("#594dff");
    await act(async () => root.render(h(Example, { accept: false })));
    await act(async () => { setValue(input, "#ff5f5f"); input.dispatchEvent(new Event("input", { bubbles: true })); });
    expect(input.value).toBe("#594dff");
    mount.querySelector("ds-color")!.focus(); expect(document.activeElement).toBe(input);
  } finally { await act(async () => root.unmount()); }
});

test("native colour fields reset and keep disabled controls and external forms", async () => {
  const mount = document.createElement("div"); document.body.append(mount);
  const root = createRoot(mount);
  try {
    await act(async () => root.render(h("div", null, h("form", { id: "palette" }),
      h("fieldset", { disabled: true }, h(ColorInput, { name: "disabled", disabled: true, defaultValue: "#ff5f5f", form: "palette" })),
      h(ColorInput, { name: "accent", defaultValue: "#99ff73", form: "palette" }))));
    const input = mount.querySelector<HTMLInputElement>('[name="accent"]')!, form = mount.querySelector("form")!;
    expect(input.form).toBe(form); expect(mount.querySelector('[name="disabled"]')!.matches(":disabled")).toBe(true);
    input.value = "#594dff"; form.reset(); expect(input.value).toBe("#99ff73");
    expect(mount.querySelectorAll("input")).toHaveLength(2);
  } finally { await act(async () => root.unmount()); }
});

test("swatches follow changing product colours and selection without accepting CSS declarations", async () => {
  const swatch = document.createElement("ds-swatch"); document.body.append(swatch);
  swatch.value = "#99ff73"; swatch.selected = true; await swatch.updateComplete;
  expect(swatch.shadowRoot!.querySelector("span")!.style.backgroundColor).toBe("#99ff73");
  expect(swatch.hasAttribute("selected")).toBe(true);
  swatch.value = "#594dff"; swatch.selected = false; await swatch.updateComplete;
  expect(swatch.shadowRoot!.querySelector("span")!.style.backgroundColor).toBe("#594dff");
  expect(swatch.hasAttribute("selected")).toBe(false);
  swatch.value = "red; position: fixed"; await swatch.updateComplete;
  expect(swatch.shadowRoot!.querySelector("span")!.style.position).toBe("");
});
