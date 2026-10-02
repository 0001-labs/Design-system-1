import { httpRouter } from "convex/server";

import { auth } from "./auth";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// Mounts /api/auth/* on the Convex site domain.
auth.addHttpRoutes(http);

/**
 * Dev-only: hand back the most recent magic link so Playwright can sign in
 * without a mail server.
 *
 * Guarded twice — here and in `devLinks.ts` — and 404s rather than 403s when
 * disabled, so production leaks no signal that the route exists at all.
 */
/**
 * The sign-in screen fetches this from a different origin (the app runs on
 * localhost, this is served from *.convex.site), so it needs CORS. Allowing
 * any origin is acceptable precisely because the route only exists on
 * deployments that set DEV_LOGIN_LINKS, and returns 404 everywhere else.
 */
const devCorsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "cache-control": "no-store",
};

http.route({
  path: "/auth/_dev/last-link",
  method: "OPTIONS",
  handler: httpAction(async () => {
    if (process.env.DEV_LOGIN_LINKS !== "1") {
      return new Response("Not found", { status: 404 });
    }
    return new Response(null, { status: 204, headers: devCorsHeaders });
  }),
});

http.route({
  path: "/auth/_dev/last-link",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    if (process.env.DEV_LOGIN_LINKS !== "1") {
      return new Response("Not found", { status: 404 });
    }

    const email = new URL(request.url).searchParams.get("email") ?? undefined;
    const link = await ctx.runQuery(internal.devLinks.latest, { email });

    if (!link) return new Response("No link", { status: 404, headers: devCorsHeaders });

    return new Response(JSON.stringify(link), {
      headers: { ...devCorsHeaders, "content-type": "application/json" },
    });
  }),
});

export default http;
