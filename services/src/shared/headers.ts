export const CONTENT_TYPE = "text/css; charset=utf-8";

/**
 * Immutable version artifacts are written once and never overwritten, so a
 * year-long `immutable` is honest rather than optimistic.
 */
export const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";

/**
 * `latest.css` keeps the browser always revalidating, so a publish applies on
 * the next page load — but the revalidation terminates at the Cloudflare edge
 * as a cheap 304 rather than reaching R2.
 *
 * `s-maxage=10` bounds worst-case staleness at ten seconds per colo with no
 * purge token and no dependency on the publish path, which is what keeps the
 * two Workers decoupled.
 *
 * There is deliberately NO `stale-while-revalidate`. It was here originally and
 * an end-to-end test caught what it actually does: after `s-maxage` lapses the
 * edge serves the *old* bytes while refreshing in the background, so the first
 * refresh after publishing still showed the previous stylesheet and only the
 * one after that was correct. For a design system the whole point is "publish,
 * refresh, see it" — trading that for latency smoothing on a ~3 KB file is a
 * bad deal.
 *
 * `stale-if-error` stays: it only applies when the origin actually errors, and
 * it degrades an R2 incident to yesterday's stylesheet rather than an unstyled
 * site.
 */
export const LATEST_CACHE_CONTROL =
  "public, max-age=0, must-revalidate, s-maxage=10, stale-if-error=86400";

/**
 * Applied to every artifact response.
 *
 * `Vary: Accept-Encoding` is deliberately absent — Cloudflare compresses
 * text/css at the edge and adds it itself; setting it here would fragment the
 * Cache API key for no benefit.
 */
export function baseArtifactHeaders(headers: Headers = new Headers()): Headers {
  headers.set("content-type", CONTENT_TYPE);
  headers.set("access-control-allow-origin", "*");
  headers.set("cross-origin-resource-policy", "cross-origin");
  headers.set("timing-allow-origin", "*");
  headers.set("x-content-type-options", "nosniff");
  return headers;
}

export function corsPreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, HEAD, OPTIONS",
      "access-control-allow-headers": "if-none-match, if-modified-since",
      "access-control-max-age": "86400",
    },
  });
}

/**
 * A missing artifact still answers as CSS.
 *
 * A broken `<link>` that returns `text/plain` produces a MIME-mismatch console
 * error on the customer's site, which is a worse debugging experience than an
 * empty stylesheet carrying a comment. The short TTL keeps a just-published
 * library from being negatively cached at the edge.
 */
export function notFound(): Response {
  const headers = baseArtifactHeaders();
  headers.set("cache-control", "public, max-age=30");
  return new Response("/* DS1: library not found */\n", { status: 404, headers });
}

export function methodNotAllowed(allow: string): Response {
  return new Response(null, { status: 405, headers: { allow } });
}
