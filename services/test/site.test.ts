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

  it("isolates the dashboard host from the public app and library endpoints", async () => {
    const origin = "https://adoption.designsystem1.com";
    expect((await site.fetch(origin + "/", { redirect: "manual" })).status).toBe(302);
    expect(await (await site.fetch(origin + "/app/signin")).text()).toBe("Application");
    expect((await site.fetch(origin + "/api/reports/components")).status).toBe(401);
    for (const path of ["/app/libraries", "/api/libraries", "/api/fonts", "/reports/component-adoption.json"]) {
      expect((await site.fetch(origin + path)).status).toBe(404);
    }
  });

  it("gates the icon builder host like the dashboard and serves it nothing else", async () => {
    const origin = "https://icon.designsystem1.com";
    const page = await site.fetch(origin + "/", { redirect: "manual" });
    expect(page.status).toBe(302);
    expect(page.headers.get("location")).toBe("/app/signin");
    expect(page.headers.get("cache-control")).toBe("private, no-store");
    expect(await (await site.fetch(origin + "/app/signin")).text()).toBe("Application");
    for (const path of ["/app/libraries", "/api/libraries", "/api/fonts", "/api/reports/components", "/2-core/icon/collection/", "/reports/component-adoption.json"]) {
      expect((await site.fetch(origin + path)).status, path).toBe(404);
    }
  });

  it("gates App docs and every asset on the docs and dashboard hosts", async () => {
    for (const path of ['/private-app/', '/private-app/app.js', '/private-app/app.css', '/private-app/index.html']) {
      expect((await site.fetch(path, { redirect: 'manual' })).status).toBe(302);
      expect((await site.fetch('https://www.designsystem1.com' + path, { redirect: 'manual' })).status).toBe(404);
      expect((await site.fetch('https://adoption.designsystem1.com' + path, { redirect: 'manual' })).status).toBe(302);
    }
    const old = await site.fetch('/2-core/kbd/', { redirect: 'manual' });
    expect(old.headers.get('location')).toBe('https://designsystem1.com/libraries/workspace/?internal=keyboard-shortcut');
  });

  it("preserves query parameters when normalizing the app URL", async () => {
    const response = await site.fetch("/app?code=example", { redirect: "manual" });
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://designsystem1.com/app/?code=example");
  });

  it("redirects reorganized docs without losing query parameters or redirecting icon assets", async () => {
    const moves = {
      '/classless/': '/start-here/quick-start/',
      '/classless/editor/': '/libraries/playground/',
      '/classless/libraries/': '/libraries/workspace/',
      '/classless/library-api/': '/libraries/api/',
      '/1-root/native-controls/': '/start-here/quick-start/',
      '/components/': '/2-core/overview/',
      '/icons/': '/2-core/icon/',
      '/2-core/icon/collection/': '/2-core/icon/',
      '/4-page/layouts/': '/start-here/examples/',
      '/1-root/styling/': '/1-root/overview/',
      '/built-ins/languages/': '/1-root/languages/',
      '/advanced/theming/': '/1-root/theming/',
      '/built-ins/theming/': '/1-root/theming/',
      '/built-ins/device/': '/1-root/device/',
      '/built-ins/preferences/': '/1-root/preferences/',
      '/built-ins/pricing/': '/1-root/pricing/',
    };
    for (const [from, to] of Object.entries(moves)) {
      const response = await site.fetch(from + '?view=example', { redirect: 'manual' });
      expect(response.status).toBe(308);
      expect(response.headers.get('location')).toBe('https://designsystem1.com' + to + '?view=example');
    }
    expect((await site.fetch('/icons/library/star.svg', { redirect: 'manual' })).status).not.toBe(308);
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
    expect(shortcut.headers.get("location")).toBe("https://adoption.designsystem1.com/");
    const shell = await site.fetch("/app/reports/components", { redirect: "manual" });
    expect(shell.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(shell.headers.get("cache-control")).toBe("private, no-store");
    expect(shell.status).toBe(302);
    expect(shell.headers.get("location")).toBe("https://adoption.designsystem1.com/");
  });
});
