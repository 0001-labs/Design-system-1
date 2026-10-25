import { consistencyAI, type PreviewAIEnv } from "./consistency-ai";
import { consistencyPreview, isConsistencyHost, type WorkspaceEnv, isPrivatePreviewPath } from "./consistency";
import { appNavigation } from './app-navigation';
import { WorkerEntrypoint } from "cloudflare:workers";
import { featureFlags, manageFeatureFlags, setFeatureFlag } from "./flags";
import { dashboard, sessionRequest, DASHBOARD_HOST, ICON_HOST } from "./dashboard";
import { filterDocExamples, listExamples, setExample } from './doc-examples';

const PLAY_HOST = "play.designsystem1.com";
import { libraryApi } from "./libraries";
import { fontWorkspace } from "./fonts";
import assets from "./assets/index.ts";
import publish, { type Env as PublishEnv } from "./publish/index.ts";
import { architectureReport, componentReport, type ReportsEnv } from "./reports.ts";

export interface Env extends PublishEnv, ReportsEnv, PreviewAIEnv, WorkspaceEnv {
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
    if (url.hostname === DASHBOARD_HOST) return new Response('Not found', { status: 404 });
    if (/^\/(?:adoption|architecture)(?:\/|$)/i.test(decodeURIComponent(url.pathname)) || url.pathname === '/app/adoption') {
      if (url.hostname !== 'designsystem1.com') return new Response('Not found', { status: 404 });
      return dashboard(request, env);
    }
    if (url.pathname === '/api/consistency/ai') return consistencyAI(request, env);
    // Dispatch before public assets and other APIs: this host has no public app routes.
    if (isConsistencyHost(url.hostname) || isPrivatePreviewPath(url.pathname)) return consistencyPreview(request, env);
    // Private App HTML and assets revalidate the owner on the two configured hosts.
    if (url.pathname.startsWith('/private-app')) {
      if (![DASHBOARD_HOST, 'designsystem1.com'].includes(url.hostname)) return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } });
      return dashboard(request, env);
    }
    if (url.hostname === 'designsystem1.com' && url.pathname === '/api/dashboard/session') return dashboard(request, env);
    if (/^\/2-core\/kbd\/?$/.test(url.pathname)) return Response.redirect('https://designsystem1.com/libraries/workspace/?internal=keyboard-shortcut', 302);
    if (url.pathname === "/api/app-navigation") return appNavigation(request, env);
    if (url.pathname === "/api/flags") return featureFlags(request, env);
    // The release controls are in System CI's Flags matrix, behind the System login, which reads and
    // saves them through FeatureFlagsService; the old page addresses send there.
    if (["/flags", "/flags/", "/app/flags"].includes(url.pathname)) {
      return new Response(null, { status: 308, headers: { Location: "https://system.0001.dev/system/ci", "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" } });
    }
    if (url.hostname === ICON_HOST) return dashboard(request, env);
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

    // Play lives on its own host: its page at the root, the site's assets beside it.
    if (url.hostname === PLAY_HOST) {
      if (!["GET", "HEAD"].includes(request.method)) return new Response("Not found", { status: 404 });
      if (url.pathname === "/" || url.pathname === "/play" || url.pathname === "/play/") {
        const page = new URL(request.url);
        page.pathname = "/play/";
        return env.ASSETS.fetch(new Request(page, request));
      }
      if (/^\/(_astro|examples|icons|fonts|resources)\//.test(url.pathname) || /^\/(translations\.json|favicon\.(ico|svg))$/.test(url.pathname)) return env.ASSETS.fetch(request);
      url.hostname = "designsystem1.com";
      return Response.redirect(url.toString(), 308);
    }
    if (url.hostname === "designsystem1.com" && url.pathname.replace(/\/$/, "") === "/play") {
      return Response.redirect(`https://${PLAY_HOST}/`, 308);
    }

    if (url.hostname === "www.designsystem1.com" ||
      (url.hostname === "dsone.dev" && !url.pathname.startsWith("/ds1/") && !url.pathname.startsWith("/api/"))) {
      url.hostname = "designsystem1.com";
      return Response.redirect(url.toString(), 308);
    }

    const docsRedirects: Record<string, string> = {
      '/classless': '/start-here/quick-start/',
      '/classless/libraries': '/libraries/workspace/',
      '/classless/editor': '/libraries/playground/',
      '/classless/library-api': '/libraries/api/',
      '/1-root/native-controls': '/start-here/quick-start/',
      '/components': '/2-core/overview/',
      '/4-page/layouts': '/start-here/examples/',
      '/icons': '/2-core/icon/',
      '/2-core/icon/collection': '/2-core/icon/',
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

    if (url.pathname === "/api/reports/components") return componentReport(sessionRequest(request), env);
    if (url.pathname === "/api/reports/architecture") return architectureReport(sessionRequest(request), env);

    if (/^\/(?:app\/)?reports(?:\/components)?\/?$/.test(url.pathname)) {
      return new Response(null, { status: 302, headers: { Location: "https://designsystem1.com/adoption/", "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "private, no-store" } });
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

    if (url.pathname.replace(/\/$/, '') === '/libraries/workspace' && url.searchParams.has('internal')) {
      const shell = new Response(response.body, response);
      shell.headers.set('Cache-Control', 'private, no-store');
      shell.headers.set('X-Robots-Tag', 'noindex, nofollow');
      return shell;
    }
    if (url.pathname.replace(/\/$/, '') === '/start-here/examples') return filterDocExamples(response, env);
    return reportPage(response, url.pathname);
  },
} satisfies ExportedHandler<Env>;

/** Private RPC only. System authenticates the owner before calling this binding. */
export class FeatureFlagsService extends WorkerEntrypoint<Env> {
  async manage() { return manageFeatureFlags(this.env); }
  async set(input: unknown) { return setFeatureFlag(this.env, input); }
  async listExamples() { return listExamples(this.env); }
  async setExample(input: unknown) { return setExample(this.env, input); }
}
