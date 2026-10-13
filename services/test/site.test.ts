import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { startAssets, type Harness } from "./harness.ts";

let site: Harness;
beforeAll(async () => { site = await startAssets(); });
afterAll(async () => { await site.dispose(); });

describe("combined website routes", () => {
  it("serves documentation and the app from the same Worker", async () => {
    expect(await (await site.fetch("/")).text()).toBe("Documentation");
    expect(await (await site.fetch("/app/")).text()).toBe("Application");
  });

  it("preserves query parameters when normalizing the app URL", async () => {
    const response = await site.fetch("/app?code=example", { redirect: "manual" });
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://designsystem1.com/app/?code=example");
  });

  it("serves the app shell for nested app routes", async () => {
    const response = await site.fetch("/app/l/example");
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("Application");
  });

  it("does not turn missing assets or API routes into an HTML app shell", async () => {
    expect((await site.fetch("/app/assets/missing.js")).status).toBe(404);
    expect((await site.fetch("/api/missing")).status).toBe(404);
    expect((await site.fetch("/missing-doc")).status).toBe(404);
  });

  it("does not serve the app shell for writes to unknown routes", async () => {
    expect((await site.fetch("/app/l/example", { method: "POST" })).status).toBe(404);
  });

  it("keeps report data out of anonymous and public asset routes", async () => {
    await (await site.bucket()).put("reports/component-adoption.json", '{"private":true}');
    expect((await site.fetch("/api/reports/components")).status).toBe(401);
    for (const path of ["/reports/component-adoption.json", "/ds1/reports/component-adoption.json", "/app/assets/component-adoption.json"]) {
      const response = await site.fetch(path);
      expect(response.status).toBe(404);
      expect(await response.text()).not.toContain('"private":true');
    }
    const shortcut = await site.fetch("/reports/components", { redirect: "manual" });
    expect(shortcut.headers.get("location")).toBe("https://designsystem1.com/app/reports/components");
    const shell = await site.fetch("/app/reports/components");
    expect(shell.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(shell.headers.get("cache-control")).toBe("private, no-store");
    expect(await shell.text()).toBe("Application");
  });
});
