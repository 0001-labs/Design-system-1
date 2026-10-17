/**
 * Serves e2e/fixtures on its own origin.
 *
 * Deliberately a separate origin from the workbench dev server: the customer
 * page must load the hosted stylesheet cross-origin, exactly as a real customer
 * site would, so nothing can leak in from the app's own build.
 */
const port = Number(process.env.FIXTURE_PORT ?? 4399);
const root = new URL("./fixtures/", import.meta.url);

serve({
  port,
  hostname: "127.0.0.1",

  async fetch(request) {
    const url = new URL(request.url);
    const requested = url.pathname === "/" ? "/customer.html" : url.pathname;

    if (requested.includes("..")) {
      return new Response("forbidden", { status: 403 });
    }

    let file: Buffer;
    try {
      file = await readFile(fileURLToPath(new URL(`.${requested}`, root)));
    } catch {
      return new Response("not found", { status: 404 });
    }

    // `?css=` points the fixture's single <link> at a published artifact.
    //
    // The substitution happens here rather than in the browser so the delivered
    // HTML still contains no script at all — which is the whole point of the
    // fixture — and so the stylesheet survives a reload. Patching the href via
    // page.evaluate() would be undone by the very reload the test is asserting.
    const stylesheet = url.searchParams.get("css");
    if (stylesheet && requested.endsWith(".html")) {
      if (!/^https?:\/\//.test(stylesheet)) {
        return new Response("bad css parameter", { status: 400 });
      }

      const html = file.toString("utf8").replace(
        /(<link rel="stylesheet" data-ds1-install href=")[^"]*(")/,
        (_match, before: string, after: string) =>
          `${before}${stylesheet.replace(/"/g, "&quot;")}${after}`,
      );

      return new Response(html, {
        headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
      });
    }

    return new Response(new Uint8Array(file), {
      headers: { "cache-control": "no-store" },
    });
  },
});

console.log(`fixture server listening on http://127.0.0.1:${port}`);
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
