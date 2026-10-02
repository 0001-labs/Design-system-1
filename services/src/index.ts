import assets from "./assets/index.ts";
import publish, { type Env as PublishEnv } from "./publish/index.ts";

export interface Env extends PublishEnv {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.hostname === "www.designsystem1.com" ||
      (url.hostname === "dsone.dev" && !url.pathname.startsWith("/ds1/") && !url.pathname.startsWith("/api/"))) {
      url.hostname = "designsystem1.com";
      return Response.redirect(url.toString(), 308);
    }

    if (url.pathname.startsWith("/ds1/")) {
      return assets.fetch(request, { LIBRARIES: env.LIBRARIES }, ctx);
    }

    if (url.pathname.startsWith("/api/artifacts/")) {
      return publish.fetch(request, env);
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
      url.pathname = "/app/";
      return env.ASSETS.fetch(new Request(url, request));
    }

    return response;
  },
} satisfies ExportedHandler<Env>;
