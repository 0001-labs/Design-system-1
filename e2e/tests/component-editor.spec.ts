import { expect, test, type Page } from "@playwright/test";

/**
 * The base system's component editor in a browser, its base API answered in the page
 * (e2e/fixtures/component-editor.html): the components down the side, the chosen one's states on
 * the grid, the properties in whole squares, the draft shown on the canvas at once and saved
 * after a pause, and nothing wider than its window.
 */

const SQUARE = 20;
const open = async (page: Page, query = "") => {
  await page.goto(`/e2e/fixtures/component-editor.html${query}`);
  await page.evaluate(() => (window as unknown as { ready: Promise<unknown> }).ready);
  await expect(page.getByTestId("component-canvas")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};
const size = (page: Page) => page.getByTestId("component-size").textContent();
const canvasToken = (page: Page, name: string) => page.getByTestId("component-canvas").evaluate((canvas, name) => (canvas as HTMLElement).style.getPropertyValue(name), name);
const saves = (page: Page) => page.evaluate(() => (window as unknown as { saves: { css: string; baseRev: number }[] }).saves);

test("lists the components, then History and All tokens, as the documentation's sidebar", async ({ page }) => {
  await open(page);
  const sidebar = page.locator(".component-editor-navigation ds-sidebar");
  await expect(sidebar).toHaveAttribute("disclosure-position", "start");
  const rows = await sidebar.evaluate(element => (element as HTMLElement & { items: { label: string }[] }).items.map(item => item.label));
  expect(rows).toEqual(["Components", "Button", "Input", "Checkbox", "Switch", "Tag", "History", "All tokens"]);
});

test("the states stand on the grid, the selected one filled with its size in plain numbers", async ({ page }) => {
  await open(page);
  await expect.poll(() => size(page)).toBe("100 × 16");
  const offsets = await page.locator(".component-editor-specimen").evaluateAll(specimens => {
    const canvas = document.querySelector(".component-editor-canvas")!.getBoundingClientRect();
    return specimens.map(specimen => { const r = specimen.getBoundingClientRect(); return [r.left - canvas.left, r.top - canvas.top]; });
  });
  expect(offsets).toHaveLength(5);
  for (const [left, top] of offsets) { expect(left % SQUARE).toBe(0); expect(top % SQUARE).toBe(0); }
  const fill = await page.locator(".component-editor-selection").evaluate(element => getComputedStyle(element).backgroundColor);
  expect(fill).not.toBe("rgba(0, 0, 0, 0)");
  await page.locator(".component-editor-specimen").nth(1).click();
  await expect.poll(() => size(page)).toBe("60 × 16");
});

test("a height steps in whole squares, shows on the canvas at once and saves after a pause", async ({ page }) => {
  await open(page);
  const height = page.locator('ds-number[data-token="--ds-button-size"]');
  await expect(height).toHaveJSProperty("value", 16);
  await height.locator("input").focus();
  await page.keyboard.press("ArrowUp");
  await expect.poll(() => canvasToken(page, "--ds-button-size")).toBe("36px");
  await expect.poll(() => size(page)).toBe("100 × 36");
  await expect(page.getByTestId("component-css")).toContainText("--ds-button-size: 36px;");
  // Every state still starts on a whole square, the taller faces included.
  const tops = await page.locator(".component-editor-specimen").evaluateAll(specimens => {
    const canvas = document.querySelector(".component-editor-canvas")!.getBoundingClientRect().top;
    return specimens.map(specimen => specimen.getBoundingClientRect().top - canvas);
  });
  for (const top of tops) expect(top % SQUARE).toBe(0);
  await expect.poll(() => saves(page), { timeout: 5000 }).toHaveLength(1);
  const [save] = await saves(page);
  expect(save!.baseRev).toBe(0);
  expect(save!.css).toContain("--ds-button-size: 36px;");
  // Reset takes the token out again.
  await page.getByTestId("reset--ds-button-size").click();
  await expect.poll(() => canvasToken(page, "--ds-button-size")).toBe("");
  await expect.poll(() => size(page)).toBe("100 × 16");
});

test("width hugs, fills or stands fixed in whole squares", async ({ page }) => {
  await open(page);
  const modes = page.locator('ds-tabs[data-token="--ds-button-inline-size"] ds-button');
  await modes.filter({ hasText: "Fill" }).click();
  await expect.poll(() => canvasToken(page, "--ds-button-inline-size")).toBe("100%");
  await expect.poll(() => size(page)).toBe(`${16 * SQUARE} × 16`);
  await modes.filter({ hasText: "Fixed" }).click();
  await expect.poll(() => canvasToken(page, "--ds-button-inline-size")).toBe("calc(4 * var(--ds-unit, 20px))");
  await expect.poll(() => size(page)).toBe("100 × 16");
  const width = page.locator('ds-number[data-token="--ds-button-inline-size"]');
  await width.locator("input").focus();
  await page.keyboard.press("Shift+ArrowUp");
  await expect.poll(() => size(page)).toBe("160 × 16");
  await modes.filter({ hasText: "Hug" }).click();
  await expect.poll(() => canvasToken(page, "--ds-button-inline-size")).toBe("");
});

test("each component opens from the sidebar with its own properties; a colour comes from the palette", async ({ page }) => {
  await open(page, "?saved=%20%20--ds-tag-size%3A%2036px%3B");
  await page.locator(".component-editor-navigation ds-sidebar").getByText("Tag", { exact: true }).click();
  await expect(page.locator(".component-editor-inspector h2")).toHaveText("Tag");
  await expect.poll(() => canvasToken(page, "--ds-tag-size")).toBe("36px");
  await expect.poll(() => size(page)).toMatch(/ × 36$/);
  await page.locator('select[data-token="--ds-tag-accent"]').selectOption({ label: "Pink" });
  await expect.poll(() => canvasToken(page, "--ds-tag-accent")).toBe("var(--one-pink)");
});

test("never wider than its window, embedded in the documentation or alone", async ({ page }) => {
  for (const [width, query] of [[1280, ""], [900, "?embed=docs"], [390, ""]] as const) {
    await page.setViewportSize({ width, height: 800 });
    await open(page, query);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${width}px`).toBeLessThanOrEqual(0);
  }
});
