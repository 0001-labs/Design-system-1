import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vite-plus/test";
import { LIBRARY_TOKENS } from "../DS1/1-root/library-tokens";

/**
 * Each component's own tokens are public hooks, unset by default: nothing in DS1 gives them a
 * value, and every face reads them first with exactly the expression it used before as the
 * fallback, so a page that sets none draws as it always did (e2e/tests/component-tokens.spec.ts
 * measures it in a browser).
 */

const root = fileURLToPath(new URL("../DS1/", import.meta.url));
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => (statSync(join(dir, name)).isDirectory() ? walk(join(dir, name)) : [join(dir, name)]));
const read = (file: string) => readFileSync(join(root, file), "utf8");
/** A stylesheet without comments, its whitespace folded, so each declaration reads on one line. */
const flat = (file: string) => read(file).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ");

/** Token → the unscaled internal it resolves into on the component's host (null: read as it is). */
const TOKENS: Record<string, { sheet: string; internal: string | null }> = {
  "--ds-button-size": { sheet: "2-core/styles/ds-button.css", internal: "--_button-size" },
  "--ds-button-corner-size": { sheet: "2-core/styles/ds-button.css", internal: "--_button-corner-size" },
  "--ds-button-text-size": { sheet: "2-core/styles/ds-button.css", internal: "--_button-text-size" },
  "--ds-button-padding-size": { sheet: "2-core/styles/ds-button.css", internal: "--_button-padding-size" },
  "--ds-button-inline-size": { sheet: "2-core/styles/ds-button.css", internal: "--_button-inline-size" },
  "--ds-button-primary-fill": { sheet: "2-core/styles/ds-button.css", internal: null },
  "--ds-button-primary-text": { sheet: "2-core/styles/ds-button.css", internal: null },
  "--ds-button-secondary-fill": { sheet: "2-core/styles/ds-button.css", internal: null },
  "--ds-input-size": { sheet: "2-core/styles/ds-input.css", internal: "--_input-size" },
  "--ds-input-padding-size": { sheet: "2-core/styles/ds-input.css", internal: "--_input-padding-size" },
  "--ds-input-corner-size": { sheet: "2-core/styles/ds-input.css", internal: "--_input-corner-size" },
  "--ds-input-inline-size": { sheet: "2-core/styles/ds-input.css", internal: null },
  "--ds-checkbox-size": { sheet: "2-core/styles/ds-checkbox.css", internal: "--_checkbox-size" },
  "--ds-checkbox-corner-size": { sheet: "2-core/styles/ds-checkbox.css", internal: "--_checkbox-corner-size" },
  "--ds-checkbox-fill": { sheet: "2-core/styles/ds-checkbox.css", internal: null },
  "--ds-switch-size": { sheet: "2-core/styles/ds-switch.css", internal: "--_switch-size" },
  "--ds-switch-track-off": { sheet: "2-core/styles/ds-switch.css", internal: null },
  "--ds-tag-size": { sheet: "2-core/styles/ds-tag.css", internal: "--_tag-size" },
  "--ds-tag-padding-size": { sheet: "2-core/styles/ds-tag.css", internal: "--_tag-padding-size" },
  "--ds-tag-corner-size": { sheet: "2-core/styles/ds-tag.css", internal: "--_tag-corner-size" },
  "--ds-tag-text-size": { sheet: "2-core/styles/ds-tag.css", internal: "--_tag-text-size" },
};

/** Each face's read: the new hook first, then exactly the expression the face had before. */
const READERS: [sheet: string, declaration: string][] = [
  ["2-core/styles/ds-button.css", "width: var(--ds-button-width, var(--_button-inline-size, max-content));"],
  ["2-core/styles/ds-button.css", "height: var(--_button-height, var(--ds-control-height));"],
  ["2-core/styles/ds-button.css", "min-height: var(--_button-height, var(--ds-control-height));"],
  ["2-core/styles/ds-button.css", "max-height: var(--_button-height, var(--ds-control-height));"],
  ["2-core/styles/ds-button.css", "border-radius: var(--_button-radius, var(--ds-radius));"],
  ["2-core/styles/ds-button.css", "font-size: var(--_button-font-size, var(--ds-type-size-default));"],
  ["2-core/styles/ds-button.css", "--ds-type-size-default: var(--_button-font-size, calc(var(--ds-text-size, 14px) * var(--ds-sf, 1)));"],
  ["2-core/styles/ds-button.css", "background-color: var(--ds-button-primary-fill, var(--accent-color));"],
  ["2-core/styles/ds-button.css", "color: var(--ds-button-primary-text, var(--button-text-color-on-light, var(--black)));"],
  ["2-core/styles/ds-button.css", "background-color: var(--ds-button-secondary-fill, var(--button-background-color-secondary));"],
  ["2-core/styles/ds-button.css", "padding: 0 var(--_button-padding, calc(var(--ds-button-inset, 4px) * var(--ds-sf)));"],
  ["2-core/styles/ds-button-host.css", "height: var(--ds-button-height, var(--_button-height, var(--ds-control-height))) !important;"],
  ["2-core/styles/ds-button-host.css", "min-height: var(--ds-button-height, var(--_button-height, var(--ds-control-height))) !important;"],
  ["2-core/styles/ds-button-host.css", "max-height: var(--ds-button-height, var(--_button-height, var(--ds-control-height))) !important;"],
  ["2-core/styles/ds-button-host.css", "border-radius: var(--_button-radius, var(--ds-radius)) !important;"],
  ["2-core/styles/ds-button-host.css", "font-size: var(--_button-font-size, var(--ds-type-size-default)) !important;"],
  ["2-core/styles/ds-button-host.css", "--ds-button-padding: 0 var(--_button-padding, calc(var(--ds-button-inset, 4px) * var(--ds-sf)));"],
  ["2-core/styles/ds-button-host.css", "--ds-button-background: var(--ds-button-primary-fill, var(--ds-button-background-color-primary));"],
  ["2-core/styles/ds-button-host.css", "--ds-button-color: var(--ds-button-primary-text, var(--ds-button-text-color-on-accent));"],
  ["2-core/styles/ds-button-host.css", "--ds-button-background: var(--ds-button-secondary-fill, var(--ds-button-background-color-secondary));"],
  ["2-core/styles/ds-button-host.css", "width: var(--ds-button-width, var(--_button-inline-size, max-content));"],
  ["2-core/styles/ds-input.css", ':host([variant="field"]) { width: var(--ds-input-inline-size, 100%); }'],
  ["2-core/styles/ds-input.css", "--_field-height: var(--ds-input-height, var(--_input-height, var(--ds-control-height)));"],
  ["2-core/styles/ds-input.css", "padding: var(--ds-input-padding, 0 var(--_input-padding, calc(4px * var(--ds-sf))));"],
  ["2-core/styles/ds-input.css", "border-radius: var(--ds-input-radius, var(--_input-radius, var(--ds-radius)));"],
  ["2-core/styles/ds-input.css", "background: var(--ds-input-field-background, var(--ds-fill));"],
  ["2-core/styles/ds-checkbox.css", "width: var(--_checkbox-box, var(--ds-control-height)) !important;"],
  ["2-core/styles/ds-checkbox.css", "height: var(--_checkbox-box, var(--ds-control-height)) !important;"],
  ["2-core/styles/ds-checkbox.css", "border-radius: var(--_checkbox-radius, var(--ds-radius)) !important;"],
  ["2-core/styles/ds-checkbox.css", "background: var(--ds-checkbox-fill, var(--ds-accent-color)) !important;"],
  ["2-core/styles/ds-switch.css", "--ds-choice-unit: var(--_switch-unit, var(--ds-control-height));"],
  ["2-core/styles/ds-switch.css", "background: var(--ds-switch-track-off, var(--ds-fill)) !important;"],
  ["2-core/styles/ds-switch.css", ":host([compact]) { --ds-choice-unit: var(--ds-control-height);"],
  ["2-core/styles/ds-tag.css", "padding-inline: var(--_tag-padding, calc(4px * var(--ds-sf, 1)));"],
  ["2-core/styles/ds-tag.css", "border-radius: var(--_tag-radius, var(--ds-radius));"],
  ["2-core/styles/ds-tag.css", "font-size: var(--_tag-font-size, var(--ds-type-size-default));"],
  ["2-core/styles/ds-tag.css", "line-height: var(--_tag-height, var(--ds-control-height));"],
];

describe("Component tokens", () => {
  const sources = walk(root).filter((file) => /\.(css|ts)$/.test(file) && !file.includes("/generated/"));

  test("nothing in DS1 gives a component token a value", () => {
    const declared: string[] = [];
    for (const file of sources) {
      const text = readFileSync(file, "utf8");
      for (const name of Object.keys(TOKENS)) if (new RegExp(`${name}\\s*['"\`]?\\s*:`).test(text)) declared.push(`${file}: ${name}`);
    }
    expect(declared).toEqual([]);
  });

  test("the libraries' token map and the shared token sheets leave them alone", () => {
    const mapped = new Set<string>(LIBRARY_TOKENS.flat());
    const shared = read("1-root/component-tokens.css") + read("1-root/component-metrics.css");
    for (const name of Object.keys(TOKENS)) {
      expect(mapped.has(name), name).toBe(false);
      expect(shared, name).not.toContain(name);
    }
  });

  test("each token is passed on to its internal on the component's host, and read", () => {
    for (const [name, { sheet, internal }] of Object.entries(TOKENS)) {
      const text = flat(sheet);
      if (internal) expect(text, name).toContain(`${internal}: var(${name});`);
      else expect(text, name).toContain(`var(${name}, `);
    }
  });

  test.each(READERS)("%s reads %s", (sheet, declaration) => {
    expect(flat(sheet)).toContain(declaration);
  });

  test("controls drawn on the button's face keep their own measures", () => {
    const text = flat("2-core/styles/ds-button.css");
    const at = text.indexOf("--_button-height: initial;");
    expect(at).toBeGreaterThan(0);
    const open = text.lastIndexOf("{", at);
    const selector = text.slice(text.lastIndexOf("}", open) + 1, open);
    const body = text.slice(open, text.indexOf("}", at));
    for (const variant of ["[icon]", "[square]", "[split]", "[menu-item]", '[role="tab"]', "[choice]", "[segment]", "[paper]"]) expect(selector).toContain(variant);
    for (const internal of ["--_button-height", "--_button-radius", "--_button-font-size", "--_button-padding", "--_button-inline-size"])
      expect(body).toContain(`${internal}: initial;`);
  });
});
