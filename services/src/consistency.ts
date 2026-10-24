/** Private editor preview. Every preview file is authorized before reaching Assets. */
import { dashboard, sessionRequest } from './dashboard';
import { authorizeReport, type ReportsEnv } from './reports';

export const CONSISTENCY_HOST = 'c9y.site';
export const isConsistencyHost = (host:string) => [CONSISTENCY_HOST,'neweditor.c9y.site'].includes(host);
export interface WorkspaceEnv { CONSISTENCY_WORKSPACE?: Fetcher }
const prefix = '/private-consistency/';
/** Normalize only for interception. Assets must never decode a private path on another host. */
export function isPrivatePreviewPath(path: string): boolean {
  let decoded = path;
  for (let count = 0; count < 4; count++) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch { break; }
  }
  const canonical = new URL(decoded.replace(/\\/g, '/').replace(/^\/+/, '/'), 'https://private.invalid').pathname.toLowerCase();
  return canonical.startsWith('/private-consistency');
}
const security = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'same-origin', 'X-Content-Type-Options': 'nosniff', Vary: 'Cookie, Authorization' };
function protect(response: Response): Response {
  const result = new Response(response.body, response);
  for (const [key, value] of Object.entries(security)) result.headers.set(key, value);
  return result;
}
export async function consistencyPreview(request: Request, env: ReportsEnv & WorkspaceEnv & { ASSETS: Fetcher }, send: typeof fetch = fetch): Promise<Response> {
  const url = new URL(request.url);
  if (!isConsistencyHost(url.hostname) || url.protocol !== 'https:') return new Response(null, { status: 404, headers: security });
  if (url.pathname === '/api/dashboard/session' || url.pathname === '/app/signin' || /^\/app\/assets\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(url.pathname) || url.pathname === '/icons/design-system-1.svg') return protect(await dashboard(request, env, send));
  if ((url.pathname.startsWith('/api/consistency/pages') || url.pathname==='/api/consistency/sites')) return protect(await workspaceApi(request,env,send));
  if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 404, headers: security });
  if (url.pathname !== '/' && !url.pathname.startsWith(prefix)) return new Response(null, { status: 404, headers: security });
  const denied = await authorizeReport(sessionRequest(request), env, send);
  if (denied) {
    if (denied.status === 401) return new Response(null, { status: 302, headers: { ...security, Location: '/app/signin', 'Set-Cookie': '__Host-ds1-dashboard=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0' } });
    return protect(denied);
  }
  if (url.pathname === '/') url.pathname = `${prefix}index.html`;
  const original = await env.ASSETS.fetch(new Request(url, request));
  // This marker enables owner-only diagnostics; it grants no server access. Only
  // trusted built HTML is rewritten, after the authority has validated the owner.
  if (request.method === 'GET' && original.ok && original.headers.get('Content-Type')?.split(';')[0]?.trim().toLowerCase() === 'text/html') {
    const html = (await original.text()).replace(/<html(?=[\s>])/i, '<html data-ds-owner');
    const marked = new Response(html, original);
    for (const header of ['Content-Length', 'Content-Encoding', 'ETag']) marked.headers.delete(header);
    return protect(marked);
  }
  return protect(original);
}

async function workspaceApi(request:Request,env:ReportsEnv & WorkspaceEnv,send:typeof fetch):Promise<Response>{
  const url=new URL(request.url);
  if(url.pathname!=='/api/consistency/sites'&&!/^\/api\/consistency\/pages(?:\/[a-zA-Z0-9][a-zA-Z0-9_-]{0,79})?$/.test(url.pathname))return Response.json({error:'Not found'},{status:404});
  const denied=await authorizeReport(sessionRequest(new Request(request.url,{headers:request.headers})),env,send);if(denied)return denied;
  if(!['GET','PUT'].includes(request.method))return Response.json({error:'Method not allowed'},{status:405});
  if(request.method==='PUT'&&(request.headers.get('Origin')!==url.origin||request.headers.get('Content-Type')?.split(';')[0]!=='application/json'))return Response.json({error:'Forbidden'},{status:403});
  if(!env.CONSISTENCY_WORKSPACE)return Response.json({error:'Workspace unavailable'},{status:503});
  let body:Uint8Array|undefined;
  if(request.method==='PUT'){
    const reader=request.body?.getReader();const chunks:Uint8Array[]=[];let size=0;
    if(reader)for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>800_000){await reader.cancel();return Response.json({error:'Document too large'},{status:413});}chunks.push(value);}
    body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
  }
  return env.CONSISTENCY_WORKSPACE.fetch(new Request('https://workspace.internal'+url.pathname,{method:request.method,body,headers:{'Content-Type':'application/json'}}));
}
