import { readFileSync } from "node:fs";

import { expect, type Page } from "@playwright/test";

/**
 * Shared end-to-end helpers.
 *
 * These run against the real Convex dev deployment. Sign-in uses the dev link
 * sink (`DEV_LOGIN_LINKS=1`), which is the only reason the suite can run
 * without a mail server — the endpoint 404s on any deployment without the flag.
 */
export const CONVEX_SITE = readConvexSiteUrl();

function readConvexSiteUrl(): string {
  const env = readFileSync(new URL("../../.env.local", import.meta.url), "utf8");
  const match = /^VITE_CONVEX_SITE_URL=(.+)$/m.exec(env);
  if (!match?.[1]) throw new Error("VITE_CONVEX_SITE_URL missing from .env.local");
  return match[1].trim();
}

/** A fresh address per run, so no test depends on another's leftovers. */
export function uniqueEmail(prefix = "e2e"): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

export async function signIn(page: Page, email: string): Promise<void> {
  await page.goto("/app/signin");

  await page.getByTestId("signin-email").fill(email);
  await page.getByTestId("signin-submit").click();
  await expect(page.getByTestId("signin-sent")).toBeVisible();

  // Fetch the link the way a mail client would receive it.
  const response = await page.request.get(
    `${CONVEX_SITE}/auth/_dev/last-link?email=${encodeURIComponent(email)}`,
  );
  expect(response.ok()).toBe(true);
  const { url } = (await response.json()) as { url: string };

  await page.goto(url);

  // Verification is deliberately gated behind a click, not done on mount — a
  // JavaScript-executing mail scanner must not be able to burn the token.
  await expect(page.getByTestId("signin-callback")).toBeVisible();
  await page.getByTestId("signin-continue").click();

  await expect(page.getByTestId("library-list")).toBeVisible();
}

export async function createLibrary(page: Page): Promise<void> {
  await page.getByTestId("create-library").click();
  await expect(page.getByTestId("workbench")).toBeVisible();
  await expect(page.getByTestId("save-state")).toHaveAttribute("data-state", "saved", {
    timeout: 30_000,
  });
}
