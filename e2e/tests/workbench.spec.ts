import { expect, test } from "@playwright/test";

const FIXTURE_ORIGIN = "http://127.0.0.1:4399";

test.describe("workbench", () => {
  test("renders and exposes the live CSS source", async ({ page }) => {
    await page.goto("/app/playground");

    await expect(page.getByTestId("workbench")).toBeVisible();

    const source = await page.getByTestId("live-css-source").inputValue();
    expect(source).toContain(":root");
    expect(source).toContain("--one-accent-color");
  });

  // The browser-level guard on the Phase 0 fix to replaceCustomProperty. The
  // unit tests cover the text primitives; this proves the control is actually
  // wired to the declaration the preview reads.
  test("editing the accent rewrites the token in :root", async ({ page }) => {
    await page.goto("/app/playground");

    await page.getByTestId("accent-input").fill("#ff0066");

    await expect(page.getByTestId("accent-value")).toHaveText("#ff0066");

    const source = await page.getByTestId("live-css-source").inputValue();
    const rootBlock = source.slice(source.indexOf(":root"), source.indexOf("}", source.indexOf(":root")));
    expect(rootBlock).toContain("--one-accent-color:   #ff0066;");

    // Exactly one declaration changed.
    expect(source.match(/--one-accent-color:\s*#ff0066;/g)).toHaveLength(1);
  });

  test("typing into the CSS panel drives the controls", async ({ page }) => {
    await page.goto("/app/playground");

    const editor = page.getByTestId("live-css-source");
    const source = await editor.inputValue();

    await editor.fill(source.replace(/(--one-accent-color:\s*)#[0-9a-f]{6};/i, "$1#00aa55;"));

    await expect(page.getByTestId("accent-value")).toHaveText("#00aa55");
  });
});

test.describe("customer fixture", () => {
  // Guards the harness itself, not the product: if the fixture ever gains a
  // stylesheet or a script of its own, the headline publish test in Phase 4
  // would start passing for the wrong reason.
  test("is unstyled and script-free until a hosted stylesheet is attached", async ({ page }) => {
    await page.goto(`${FIXTURE_ORIGIN}/customer.html`);

    const inventory = await page.evaluate(() => ({
      scripts: document.querySelectorAll("script").length,
      styles: document.querySelectorAll("style").length,
      sheets: [...document.querySelectorAll("link[rel=stylesheet]")].map((link) =>
        link.getAttribute("href"),
      ),
    }));

    expect(inventory.scripts).toBe(0);
    expect(inventory.styles).toBe(0);
    expect(inventory.sheets).toEqual(["about:blank"]);

    // Browser default, i.e. nothing from DS1 has been applied yet.
    const radius = await page
      .locator("#submit")
      .evaluate((node) => getComputedStyle(node).borderRadius);
    expect(radius).not.toBe("8px");
  });
});
