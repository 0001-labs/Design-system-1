// @vitest-environment node
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import { Checkbox, Radio, Switch, ColorInput } from "../DS1/react/choice";
import { Select } from "../DS1/react/select";

test("choice adapters render usable native controls without browser globals", () => {
  expect(typeof HTMLElement).toBe("undefined");
  const radio = renderToStaticMarkup(h(Radio, { name: "access", value: "all", label: "All projects", choice: true }));
  expect(radio).toContain('type="radio"'); expect(radio).toContain('aria-label="All projects"'); expect(radio).toContain('choice=""');
  const color = renderToStaticMarkup(h(ColorInput, { name: "accent", defaultValue: "#99ff73", "aria-label": "Accent" }));
  expect(color).toContain('<ds-color><input'); expect(color).toContain('type="color"');
  expect(color).toContain('value="#99ff73"');
  const checkbox = renderToStaticMarkup(h(Checkbox, { name: "updates", defaultChecked: true, "aria-label": "Updates" }));
  expect(checkbox).toContain('<ds-checkbox><input'); expect(checkbox).toContain('type="checkbox"'); expect(checkbox).toContain('checked=""');
  const toggle = renderToStaticMarkup(h(Switch, { checked: true, disabled: true, "aria-label": "Sharing" }));
  expect(toggle).toContain('<ds-switch><button'); expect(toggle).toContain('aria-checked="true"'); expect(toggle).toContain('role="switch"');
  const select = renderToStaticMarkup(h(Select, { name: "project", defaultValue: "a" }, h("option", { value: "a" }, "Alpha")));
  expect(select).toContain('<ds-select><select name="project">');
  expect(select).toContain('value="a" selected=""');
});

test('compact monochrome belongs to the switch host, not the native button', () => {
 const markup=renderToStaticMarkup(h(Switch,{checked:true,compact:true,monochrome:true,'aria-label':'Spacing'}));
 expect(markup).toMatch(/<ds-switch[^>]*compact[^>]*monochrome/);
 expect(markup).not.toMatch(/<button[^>]*(compact|monochrome)/);
});
