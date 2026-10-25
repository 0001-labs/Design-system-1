import { expect, test, type Page } from "@playwright/test";

/**
 * Each component's own tokens (`--ds-button-size`, `--ds-tag-padding-size` …) are unset by default
 * and read first by its faces, falling back to exactly the expression the face used before. Unset,
 * every face measures as the recorded baseline; set one at a time, each changes only its own
 * property on its own component, and the controls drawn on the button's face (icon, square, fixed,
 * wide, tabs, menu entries, the compact switch) keep their measures.
 *
 * The baseline in `component-tokens.spec.ts-snapshots/baseline.json` was written before the
 * tokens existed (`--update-snapshots`), from the markup of the components' documentation pages.
 */

type Measures = Record<string, string>;

/** Width, height, padding, corners, colours and type of every specimen's host and face. */
const measure = (page: Page) => page.evaluate(() => {
  const out: Record<string, string> = {};
  const px = (value: number) => String(Math.round(value * 100) / 100);
  const face = (host: Element): Element | null => {
    const tag = host.tagName.toLowerCase();
    if (tag === "ds-button") {
      const control = host.getAttribute("control");
      if (control === "slotted") return host.querySelector(":scope > :is(button, a)");
      if (control === "host") return host;
      return host.shadowRoot?.querySelector(":is(button, a)") ?? null;
    }
    if (tag === "ds-input") return host.shadowRoot?.querySelector("input") ?? null;
    if (tag === "ds-checkbox") return host.querySelector("input");
    if (tag === "ds-switch") return host.querySelector("button");
    if (tag === "ds-tag") return host.shadowRoot?.querySelector(".frame") ?? null;
    return null;
  };
  for (const host of document.querySelectorAll("[id]")) {
    const target = face(host);
    if (!target) continue;
    const id = host.id;
    const hostBox = host.getBoundingClientRect();
    out[`${id}.host.width`] = px(hostBox.width);
    out[`${id}.host.height`] = px(hostBox.height);
    const box = target.getBoundingClientRect();
    const style = getComputedStyle(target);
    out[`${id}.face.width`] = px(box.width);
    out[`${id}.face.height`] = px(box.height);
    out[`${id}.face.padding`] = `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`;
    out[`${id}.face.radius`] = `${style.borderTopLeftRadius} ${style.borderBottomRightRadius}`;
    out[`${id}.face.background`] = style.backgroundColor;
    out[`${id}.face.color`] = style.color;
    out[`${id}.face.font`] = `${style.fontSize}/${style.lineHeight}`;
    const words = host.shadowRoot?.querySelector("ds-text");
    if (words) out[`${id}.words.font`] = getComputedStyle(words).fontSize;
    if (host.tagName.toLowerCase() === "ds-switch") {
      const thumb = getComputedStyle(target, "::after");
      out[`${id}.thumb.width`] = thumb.width;
      out[`${id}.thumb.transform`] = thumb.transform;
      out[`${id}.track.before`] = getComputedStyle(target, "::before").backgroundColor;
    }
    if (host.tagName.toLowerCase() === "ds-checkbox") out[`${id}.mark.width`] = getComputedStyle(target, "::before").width;
  }
  return out;
});

async function withToken(page: Page, name: string, value: string) {
  await page.evaluate(([name, value]) => document.documentElement.style.setProperty(name, value), [name, value]);
  // Past the switch thumb's 140ms travel.
  await page.waitForTimeout(400);
  const measures = await measure(page);
  await page.evaluate(name => document.documentElement.style.removeProperty(name), name);
  await page.waitForTimeout(400);
  return measures;
}

const changed = (before: Measures, after: Measures) => Object.keys({ ...before, ...after }).filter(key => before[key] !== after[key]);

test.beforeEach(async ({ page }) => {
  await page.goto("/e2e/fixtures/component-tokens.html");
  await page.evaluate(() => (window as unknown as { ready: Promise<unknown> }).ready);
  await page.evaluate(() => document.fonts.ready);
});

test("with every component token unset, each face measures as its baseline", async ({ page }) => {
  expect(JSON.stringify(await measure(page), null, 2)).toMatchSnapshot("baseline.json");
});

/** Buttons that follow every measure; fixed and wide keep only their widths. */
const BUTTONS = "button-(primary|secondary|text|disabled|icon-words|slotted|slotted-secondary|host|key|in-row|fixed|wide)";
const PADDED = "button-(primary|secondary|disabled|icon-words|slotted|slotted-secondary|host|key|in-row|fixed|wide)";
const HUGGING = "button-(primary|secondary|text|disabled|icon-words|slotted|slotted-secondary|host|key|in-row)";
const PRIMARY = "button-(primary|disabled|icon-words|slotted|key|wide)";
const SECONDARY = "button-(secondary|slotted-secondary|host|in-row|square|fixed)";

/** Each token, a value, the measures it may change, and some it must change to what. */
const cases: { token: string; value: string; may: RegExp; must: Record<string, string> }[] = [
  { token: "--ds-button-size", value: "24px", may: new RegExp(`^${BUTTONS}\\.(host|face)\\.height$`),
    must: { "button-primary.face.height": "24", "button-text.face.height": "24", "button-slotted.face.height": "24", "button-host.face.height": "24" } },
  { token: "--ds-button-corner-size", value: "8px", may: new RegExp(`^${BUTTONS}\\.face\\.radius$`),
    must: { "button-primary.face.radius": "8px 8px", "button-slotted.face.radius": "8px 8px", "button-host.face.radius": "8px 8px" } },
  { token: "--ds-button-text-size", value: "10px", may: new RegExp(`^${BUTTONS}\\.((host|face)\\.width|face\\.font|words\\.font)$`),
    must: { "button-primary.face.font": "10px/16px", "button-slotted.face.font": "10px/16px", "button-host.face.font": "10px/16px", "button-key.words.font": "10px" } },
  { token: "--ds-button-padding-size", value: "8px", may: new RegExp(`^${PADDED}\\.((host|face)\\.width|face\\.padding)$`),
    must: { "button-primary.face.padding": "0px 8px 0px 8px", "button-slotted.face.padding": "0px 8px 0px 8px", "button-host.face.padding": "0px 8px 0px 8px" } },
  { token: "--ds-button-inline-size", value: "100%", may: new RegExp(`^${HUGGING}\\.(host|face)\\.width$`),
    must: { "button-in-row.host.width": "400" } },
  { token: "--ds-button-inline-size", value: "calc(6 * var(--ds-unit, 20px))", may: new RegExp(`^${HUGGING}\\.(host|face)\\.width$`),
    must: { "button-primary.host.width": "120", "button-slotted.host.width": "120" } },
  { token: "--ds-button-primary-fill", value: "rgb(255, 0, 0)", may: new RegExp(`^${PRIMARY}\\.face\\.background$`),
    must: { "button-primary.face.background": "rgb(255, 0, 0)", "button-slotted.face.background": "rgb(255, 0, 0)", "button-wide.face.background": "rgb(255, 0, 0)" } },
  { token: "--ds-button-primary-text", value: "rgb(0, 0, 255)", may: new RegExp(`^${PRIMARY}\\.face\\.color$`),
    must: { "button-primary.face.color": "rgb(0, 0, 255)", "button-slotted.face.color": "rgb(0, 0, 255)" } },
  { token: "--ds-button-secondary-fill", value: "rgb(255, 0, 0)", may: new RegExp(`^${SECONDARY}\\.face\\.background$`),
    must: { "button-secondary.face.background": "rgb(255, 0, 0)", "button-slotted-secondary.face.background": "rgb(255, 0, 0)", "button-host.face.background": "rgb(255, 0, 0)" } },

  { token: "--ds-input-size", value: "40px", may: /^input-field\.(host|face)\.height$/, must: { "input-field.face.height": "40" } },
  { token: "--ds-input-padding-size", value: "8px", may: /^input-field\.face\.padding$/, must: { "input-field.face.padding": "0px 8px 0px 8px" } },
  { token: "--ds-input-corner-size", value: "8px", may: /^input-field\.face\.radius$/, must: { "input-field.face.radius": "8px 8px" } },
  { token: "--ds-input-inline-size", value: "calc(10 * var(--ds-unit, 20px))", may: /^input-field\.(host|face)\.width$/, must: { "input-field.host.width": "200" } },
  { token: "--ds-input-field-background", value: "rgb(255, 0, 0)", may: /^input-field\.face\.background$/, must: { "input-field.face.background": "rgb(255, 0, 0)" } },

  { token: "--ds-checkbox-size", value: "20px", may: /^checkbox-(on|off)\.(face\.(width|height)|mark\.width)$/,
    must: { "checkbox-on.face.width": "20", "checkbox-off.face.height": "20", "checkbox-on.mark.width": "20px" } },
  { token: "--ds-checkbox-corner-size", value: "8px", may: /^checkbox-(on|off)\.face\.radius$/, must: { "checkbox-off.face.radius": "8px 8px" } },
  { token: "--ds-checkbox-fill", value: "rgb(255, 0, 0)", may: /^checkbox-on\.face\.background$/, must: { "checkbox-on.face.background": "rgb(255, 0, 0)" } },

  { token: "--ds-switch-size", value: "20px", may: /^switch-(on|off)\.((host|face)\.(width|height)|face\.radius|thumb\.(width|transform))$/,
    must: { "switch-on.host.width": "36", "switch-on.host.height": "20", "switch-off.thumb.width": "16px", "switch-on.thumb.transform": "matrix(1, 0, 0, 1, 16, 0)" } },
  { token: "--ds-switch-track-off", value: "rgb(255, 0, 0)", may: /^switch-off\.face\.background$/, must: { "switch-off.face.background": "rgb(255, 0, 0)" } },
  { token: "--ds-switch-track-on", value: "rgb(255, 0, 0)", may: /^switch-on\.face\.background$/, must: { "switch-on.face.background": "rgb(255, 0, 0)" } },

  { token: "--ds-tag-size", value: "20px", may: /^tag-(accent|plain)\.((host|face)\.height|face\.font)$/, must: { "tag-plain.face.height": "20", "tag-accent.host.height": "20" } },
  { token: "--ds-tag-padding-size", value: "8px", may: /^tag-(accent|plain)\.((host|face)\.width|face\.padding)$/, must: { "tag-plain.face.padding": "0px 8px 0px 8px" } },
  { token: "--ds-tag-corner-size", value: "8px", may: /^tag-(accent|plain)\.face\.radius$/, must: { "tag-plain.face.radius": "8px 8px" } },
  { token: "--ds-tag-text-size", value: "10px", may: /^tag-(accent|plain)\.((host|face)\.width|face\.font)$/, must: { "tag-plain.face.font": "10px/16px" } },
];

for (const { token, value, may, must } of cases) {
  test(`${token}: ${value} changes only its own property`, async ({ page }) => {
    const before = await measure(page);
    const after = await withToken(page, token, value);
    expect(changed(before, after).filter(key => !may.test(key)), "changed outside the token's property").toEqual([]);
    for (const [key, expected] of Object.entries(must)) expect(after[key], key).toBe(expected);
    // Removing the token puts everything back.
    expect(changed(before, await measure(page))).toEqual([]);
  });
}
