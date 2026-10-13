// @vitest-environment happy-dom
import { afterEach, expect, test } from "vite-plus/test";
import React, { act, createElement as h, createRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Checkbox, Switch } from "../DS1/react/choice";
import "../DS1/2-core/ds-checkbox";
import "../DS1/2-core/ds-switch";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
afterEach(() => document.body.replaceChildren());

test("switch activation stays controlled, cancellable and disabled through the native button", async () => {
  const mount = document.createElement("div"); document.body.append(mount);
  const root = createRoot(mount); const ref = createRef<HTMLButtonElement>();
  const changes: boolean[] = [];
  const render = (checked = false, disabled = false, cancel = false) => act(async () => root.render(h(Switch, {
    checked, disabled, ref, "aria-label": "Email updates", "aria-busy": disabled,
    onClick: e => { if (cancel) e.preventDefault(); }, onCheckedChange: next => changes.push(next),
  })));
  try {
    await render();
    const button = mount.querySelector("button")!;
    expect(ref.current).toBe(button); expect(button.type).toBe("button");
    button.click(); expect(changes).toEqual([true]); expect(button.getAttribute("aria-checked")).toBe("false");
    await render(true); expect(button.getAttribute("aria-checked")).toBe("true");
    button.click(); expect(changes).toEqual([true, false]);
    await render(true, false, true); button.click(); expect(changes).toHaveLength(2);
    await render(true, true); button.click(); expect(changes).toHaveLength(2);
    expect(button.getAttribute("aria-busy")).toBe("true");
    await render(); mount.querySelector("ds-switch")!.focus(); expect(document.activeElement).toBe(button);
  } finally { await act(async () => root.unmount()); }
});

test("checkbox keeps native form ownership, controlled events, labels and refs", async () => {
  const mount = document.createElement("div"); document.body.append(mount);
  const root = createRoot(mount); const ref = createRef<HTMLInputElement>();
  function Example() {
    const [checked, setChecked] = useState(false);
    return h("form", { id: "preferences" }, h("label", { htmlFor: "updates" }, "Updates"), h(Checkbox, {
      id: "updates", name: "updates", value: "yes", checked, ref,
      onChange: e => setChecked(e.currentTarget.checked),
    }));
  }
  try {
    await act(async () => root.render(h(Example)));
    const native = mount.querySelector("input")!;
    expect(ref.current).toBe(native); expect(native.form?.id).toBe("preferences");
    expect(native.labels?.[0]?.textContent).toBe("Updates");
    await act(async () => native.click()); expect(native.checked).toBe(true);
    expect(new FormData(native.form!).get("updates")).toBe("yes");
    await act(async () => native.click()); expect(native.checked).toBe(false);
    expect(new FormData(native.form!).has("updates")).toBe(false);
    mount.querySelector("ds-checkbox")!.focus(); expect(document.activeElement).toBe(native);
  } finally { await act(async () => root.unmount()); }
});

test("checkbox preserves uncontrolled reset, external forms and mixed state without a second input", async () => {
  const mount = document.createElement("div"); document.body.append(mount);
  const root = createRoot(mount);
  try {
    await act(async () => root.render(h(React.Fragment, null, h("form", { id: "external" }), h(Checkbox, { form: "external", name: "choice", defaultChecked: true, indeterminate: true }))));
    const input = mount.querySelector("input")!;
    expect(input.indeterminate).toBe(true); expect(input.form?.id).toBe("external");
    input.checked = false; input.form!.reset(); expect(input.checked).toBe(true);
    expect(mount.querySelectorAll("input")).toHaveLength(1);
    await act(async () => root.render(h(Checkbox, { indeterminate: false, disabled: true, hidden: true })));
    const next = mount.querySelector("input")!; expect(next.indeterminate).toBe(false); expect(next.disabled).toBe(true);
    expect(mount.querySelector("ds-checkbox")!.hidden).toBe(true);
  } finally { await act(async () => root.unmount()); }
});
