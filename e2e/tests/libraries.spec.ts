import { expect, test } from "@playwright/test";

import { signIn, uniqueEmail } from "./helpers";

/**
 * The Phase 3 milestone, end to end: sign in, create a library, edit it,
 * reload, and find the edit still there.
 */

test.describe("libraries", () => {
  test("sign in, create, edit, reload — the edit survives", async ({ page }) => {
    await signIn(page, uniqueEmail());

    // A brand-new account starts empty.
    await expect(page.getByTestId("library-list-empty")).toBeVisible();

    await page.getByTestId("create-library").click();
    await expect(page.getByTestId("workbench")).toBeVisible();

    // The editor seeds from the stored draft, so the stock tokens are present.
    const before = await page.getByTestId("live-css-source").inputValue();
    expect(before).toContain("--one-accent-color");

    await page.getByTestId("accent-input").fill("#ff0066");
    await expect(page.getByTestId("accent-value")).toHaveText("#ff0066");

    // Autosave debounces, so wait for the state to settle rather than sleeping.
    await expect(page.getByTestId("save-state")).toHaveAttribute("data-state", "saved", {
      timeout: 15_000,
    });

    const url = page.url();
    await page.reload();

    await expect(page.getByTestId("workbench")).toBeVisible();
    expect(page.url()).toBe(url);

    const after = await page.getByTestId("live-css-source").inputValue();
    expect(after).toContain("--one-accent-color:   #ff0066;");
    await expect(page.getByTestId("accent-value")).toHaveText("#ff0066");
  });

  test("a signed-in user sees their library on the dashboard", async ({ page }) => {
    await signIn(page, uniqueEmail());

    await page.getByTestId("create-library").click();
    await expect(page.getByTestId("workbench")).toBeVisible();

    await page.goto("/app/libraries");
    await expect(page.getByTestId("library-card")).toHaveCount(1);

    // Never published, so the dashboard must say draft.
    await expect(page.getByTestId("state-pill")).toHaveAttribute("data-state", "draft");
  });

  test("libraries are private to their owner", async ({ page, browser }) => {
    await signIn(page, uniqueEmail());
    await page.getByTestId("create-library").click();
    await expect(page.getByTestId("workbench")).toBeVisible();
    const ownerUrl = page.url();

    // A different account, in a clean context with its own storage.
    const otherContext = await browser.newContext();
    const otherPage = await otherContext.newPage();
    try {
      await signIn(otherPage, uniqueEmail());
      await expect(otherPage.getByTestId("library-list-empty")).toBeVisible();

      // Even with the exact library id, the other account must not see it.
      await otherPage.goto(ownerUrl);
      await expect(otherPage.getByText("That library does not exist.")).toBeVisible();
    } finally {
      await otherContext.close();
    }
  });

  test("signing out returns you to the sign-in screen", async ({ page }) => {
    await signIn(page, uniqueEmail());

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.getByTestId("signin")).toBeVisible();
  });
});
