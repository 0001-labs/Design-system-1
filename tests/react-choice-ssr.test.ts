// @vitest-environment node
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import { Checkbox, Switch } from "../DS1/react/choice";

test("choice adapters render usable native controls without browser globals", () => {
  expect(typeof HTMLElement).toBe("undefined");
  const checkbox = renderToStaticMarkup(h(Checkbox, { name: "updates", defaultChecked: true, "aria-label": "Updates" }));
  expect(checkbox).toContain('<ds-checkbox><input'); expect(checkbox).toContain('type="checkbox"'); expect(checkbox).toContain('checked=""');
  const toggle = renderToStaticMarkup(h(Switch, { checked: true, disabled: true, "aria-label": "Sharing" }));
  expect(toggle).toContain('<ds-switch><button'); expect(toggle).toContain('aria-checked="true"'); expect(toggle).toContain('role="switch"');
});
