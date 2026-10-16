import { dashboard, DASHBOARD_HOST } from "./dashboard";
import { libraryApi } from "./libraries";
import { fontWorkspace } from "./fonts";
import assets from "./assets/index.ts";
import publish, { type Env as PublishEnv } from "./publish/index.ts";
import { componentReport, type ReportsEnv } from "./reports.ts";

export interface Env extends PublishEnv, ReportsEnv {
  ASSETS: Fetcher;
}

function reportPage(response: Response, path: string): Response {
  if (!path.startsWith("/app/reports/")) return response;
  const result = new Response(response.body, response);
  result.headers.set("Cache-Control", "private, no-store");
  result.headers.set("X-Robots-Tag", "noindex, nofollow");
  result.headers.set("Referrer-Policy", "same-origin");
  return result;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.hostname === DASHBOARD_HOST && url.pathname !== "/api/reports/components") return dashboard(request, env);
    if (url.pathname === "/api/libraries" || url.pathname.startsWith("/api/libraries/") || url.pathname.startsWith("/api/library-auth/")) return libraryApi(request, env);
    if (url.pathname === "/api/fonts" || url.pathname.startsWith("/api/fonts/")) return fontWorkspace(request, env);
    if (url.hostname === "fonts.designsystem1.com") {
      if (!["GET", "HEAD"].includes(request.method)) return new Response("Not found", { status: 404 });
      if (url.pathname.startsWith("/app/assets/") || url.pathname === "/icons/design-system-1.svg") return env.ASSETS.fetch(request);
      if (!["/", "/app/", "/app/fonts", "/app/signin"].includes(url.pathname)) return new Response("Not found", { status: 404 });
      const asset = new URL(request.url);
      // Only the sign-in shell and its assets are public; workspace data and font files are owner-gated above.
      asset.pathname = "/app/";
      const original = await env.ASSETS.fetch(new Request(asset, request));
      const response = new Response(original.body, original);
      response.headers.set("Cache-Control", "private, no-store");
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      response.headers.set("Referrer-Policy", "same-origin");
      return response;
    }

    if (url.hostname === "www.designsystem1.com" ||
      (url.hostname === "dsone.dev" && !url.pathname.startsWith("/ds1/") && !url.pathname.startsWith("/api/"))) {
      url.hostname = "designsystem1.com";
      return Response.redirect(url.toString(), 308);
    }

    const docsRedirects: Record<string, string> = {
      '/icons': '/2-core/icon/collection/',
      '/1-root/styling': '/1-root/overview/',
      '/built-ins/languages': '/1-root/languages/',
      '/advanced/theming': '/1-root/theming/',
      '/built-ins/theming': '/1-root/theming/',
      '/built-ins/device': '/1-root/device/',
      '/built-ins/preferences': '/1-root/preferences/',
      '/built-ins/pricing': '/1-root/pricing/',
    };
    const docsTarget = docsRedirects[url.pathname.replace(/\/$/, '')];
    if (docsTarget && (request.method === 'GET' || request.method === 'HEAD')) {
      url.pathname = docsTarget;
      // Query is retained; browsers carry the original fragment across this redirect.
      return Response.redirect(url.toString(), 308);
    }

    if (url.pathname.startsWith("/ds1/")) {
      return assets.fetch(request, { LIBRARIES: env.LIBRARIES }, ctx);
    }

    if (url.pathname.startsWith("/api/artifacts/")) {
      return publish.fetch(request, env);
    }

    if (url.pathname === "/api/reports/components") return componentReport(request, env);

    if (/^\/(?:app\/)?reports(?:\/components)?\/?$/.test(url.pathname)) {
      return new Response(null, { status: 302, headers: { Location: `https://${DASHBOARD_HOST}/`, "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "private, no-store" } });
    }

    if (url.pathname.startsWith("/api/")) {
      return new Response("Not found", { status: 404 });
    }

    if (url.pathname === "/app") {
      url.pathname = "/app/";
      return Response.redirect(url.toString(), 308);
    }

    const response = await env.ASSETS.fetch(request);
    if (
      response.status === 404 &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname.startsWith("/app/") &&
      !url.pathname.startsWith("/app/assets/")
    ) {
      const requestedPath = url.pathname;
      url.pathname = "/app/";
      return reportPage(await env.ASSETS.fetch(new Request(url, request)), requestedPath);
    }

    return reportPage(response, url.pathname);
  },
} satisfies ExportedHandler<Env>;
