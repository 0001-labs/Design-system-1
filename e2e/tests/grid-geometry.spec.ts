import { expect, test, type Page } from "@playwright/test";

const SQUARE = 20;
const box = (page: Page, selector: string) =>
  page.locator(selector).evaluate(element => { const r = element.getBoundingClientRect(); return { top: r.top, height: r.height, width: r.width }; });
const entries = (page: Page, selector: string, children: string) =>
  page.locator(selector).evaluate((menu, children) => {
    const top = menu.getBoundingClientRect().top;
    return [...menu.querySelectorAll(children)].map(entry => { const r = entry.getBoundingClientRect(); return { offset: r.top - top, height: r.height }; });
  }, children);

test.beforeEach(async ({ page }) => {
  await page.goto("/e2e/fixtures/grid-geometry.html");
  await page.evaluate(() => (window as unknown as { ready: Promise<unknown> }).ready);
  await page.evaluate(() => document.fonts.ready);
  // The danger button is set here so the attribute is the only change.
  await page.locator("#danger").evaluate(element => element.setAttribute("danger", ""));
});

test("menus stand on whole squares, the element and the native class alike", async ({ page }) => {
  for (const [menu, children, count] of [
    ["#element", ":scope > ds-button", 3],
    ["#library", ":scope > :is(button, a)", 3],
    ["#native", ":scope > :is(.ds-menu__item, .ds-menu__label), :scope > [role=group] > *", 5],
  ] as const) {
    const outer = await box(page, menu);
    expect(outer.height % SQUARE, `${menu} height ${outer.height}`).toBe(0);
    expect(outer.width % SQUARE, `${menu} width ${outer.width}`).toBe(0);
    const rows = await entries(page, menu, children);
    expect(rows).toHaveLength(count);
    for (const row of rows) {
      expect(row.height, `${menu} entry`).toBe(SQUARE);
      expect(row.offset % SQUARE, `${menu} entry at ${row.offset}`).toBe(SQUARE / 2);
    }
    const shadow = await page.locator(menu).evaluate(element => {
      const frame = element.shadowRoot?.querySelector(".frame") ?? element;
      return getComputedStyle(frame).boxShadow;
    });
    expect(shadow).toBe("none");
  }
  // A separator takes one square with its line.
  expect((await box(page, "#element")).height).toBe(5 * SQUARE);
  expect((await box(page, "#native")).height).toBe(7 * SQUARE);
  // Compact entries are filled rows on a square's pitch, less the last line.
  const compact = await box(page, "#compact");
  expect(compact.height).toBe(3 * SQUARE - 1);
  for (const [index, row] of (await entries(page, "#compact", ":scope > ds-button")).entries()) {
    expect(row.offset).toBe(index * SQUARE);
    expect(row.height).toBe(SQUARE - 1);
  }
});

test("a floating menu rounds its width up and its height down to whole squares", async ({ page }) => {
  await page.locator("#floating").evaluate((menu: HTMLElement & { anchor: Element | null; open: boolean }) => {
    menu.anchor = document.querySelector("#anchor"); menu.open = true;
  });
  await expect.poll(() => page.locator("#floating").evaluate(menu => (menu as HTMLElement).style.getPropertyValue("--ds-menu-anchor-width"))).not.toBe("");
  const anchor = await box(page, "#anchor");
  const menu = await box(page, "#floating");
  expect(menu.width % SQUARE).toBe(0);
  expect(menu.width).toBeGreaterThanOrEqual(anchor.width);
  expect(menu.height).toBe(3 * SQUARE);
  const available = await page.locator("#floating").evaluate(menu => parseFloat((menu as HTMLElement).style.getPropertyValue("--ds-menu-available-height")));
  expect(available % SQUARE).toBe(0);
});

test("a spinner is one control high in a button, and one square on its own", async ({ page }) => {
  const inner = (selector: string) => page.locator(selector).evaluate(element => {
    const spinner = element.shadowRoot?.querySelector(".ds-loading") ?? element.querySelector(".ds-loading") ?? element;
    // The layout box: a turning spinner's bounding rectangle grows as it turns.
    const style = getComputedStyle(spinner); return [parseFloat(style.width), parseFloat(style.height)];
  });
  expect(await inner("#spinner-element ds-loading")).toEqual([16, 16]);
  expect(await inner("#spinner-native")).toEqual([16, 16]);
  expect(await inner("#spinner-alone")).toEqual([20, 20]);
  expect(await inner("#spinner-alone-markup")).toEqual([20, 20]);
  expect((await box(page, "#spinner-element")).height).toBe(16);
});

test("danger reads in the danger colour on the default face as on the others", async ({ page }) => {
  const words = (selector: string) => page.locator(selector).evaluate(element => getComputedStyle(element.shadowRoot?.querySelector("button") ?? element).color);
  const danger = await words("#danger-probe");
  expect(await words("#danger")).toBe(danger);
  expect(await words("#danger-secondary")).toBe(danger);
  expect(await words("#plain")).not.toBe(danger);
});

test("the avatar draws its person icon at once", async ({ page }) => {
  const drawn = await page.locator("#avatar").evaluate(avatar => Boolean(avatar.shadowRoot?.querySelector("ds-icon")?.shadowRoot?.querySelector("svg")));
  expect(drawn).toBe(true);
});
