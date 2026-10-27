import { systemSite, SYSTEM_HOST } from './system-site';
import type { ReportsEnv } from './reports';
type Env = ReportsEnv & { ASSETS: Fetcher };
export default {
  fetch(request: Request, env: Env) {
    if (new URL(request.url).hostname !== SYSTEM_HOST) return new Response('Not found', { status: 404 });
    return systemSite(request, env);
  },
} satisfies ExportedHandler<Env>;
