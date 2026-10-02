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
});
