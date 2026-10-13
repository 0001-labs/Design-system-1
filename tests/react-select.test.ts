// @vitest-environment happy-dom
import { afterEach, expect, test } from "vite-plus/test";
import { act, createElement as h, createRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Select } from "../DS1/react/choice";
import "../DS1/2-core/ds-select";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
afterEach(() => document.body.replaceChildren());
const options = [h("option", { key: "empty", value: "" }, "Choose"), h("option", { key: "a", value: "a" }, "Alpha"), h("option", { key: "b", value: "b" }, "Beta")];

test("select preserves controlled native events, focus, labels and form validation", async () => {
  const mount = document.createElement("div"); document.body.append(mount);
  const root = createRoot(mount), ref = createRef<HTMLSelectElement>();
  function Example() {
    const [value, setValue] = useState("");
    return h("form", { id: "choice" }, h("label", { htmlFor: "project" }, "Project"), h(Select, {
      id: "project", name: "project", value, required: true, ref,
      onChange: event => setValue(event.currentTarget.value),
    }, options));
  }
  try {
    await act(async () => root.render(h(Example)));
    const select = mount.querySelector("select")!;
    expect(ref.current).toBe(select); expect(select.labels?.[0]?.textContent).toBe("Project");
    expect(select.checkValidity()).toBe(false);
    await act(async () => { select.value = "b"; select.dispatchEvent(new Event("change", { bubbles: true })); });
    expect(select.value).toBe("b"); expect(select.checkValidity()).toBe(true);
    expect(new FormData(select.form!).get("project")).toBe("b");
    mount.querySelector("ds-select")!.focus(); expect(document.activeElement).toBe(select);
  } finally { await act(async () => root.unmount()); }
});

test("select keeps multiple values, disabled options and native reset without duplicate controls", async () => {
  const mount = document.createElement("div"); document.body.append(mount);
  const root = createRoot(mount);
  try {
    await act(async () => root.render(h("form", null, h(Select, { name: "choices", multiple: true, size: 3, defaultValue: ["a", "b"] }, options, h("option", { disabled: true, value: "c" }, "Unavailable")))));
    const select = mount.querySelector("select")!;
    expect(Array.from(select.selectedOptions, option => option.value)).toEqual(["a", "b"]);
    expect(select.options[3]?.disabled).toBe(true);
    select.options[1]!.selected = false;
    select.form!.reset(); expect(Array.from(select.selectedOptions, option => option.value)).toEqual(["a", "b"]);
    expect(mount.querySelectorAll("select")).toHaveLength(1);
    await act(async () => root.render(h(Select, { disabled: true, hidden: true, "aria-label": "Hidden" }, options)));
    expect(mount.querySelector("select")!.disabled).toBe(true);
    expect(mount.querySelector("ds-select")!.hidden).toBe(true);
  } finally { await act(async () => root.unmount()); }
});
