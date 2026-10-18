import { authorizeReport, type ReportsEnv } from './reports';
import { FEATURE_FLAGS } from '../../shared/feature-flags';
import { isReleaseRule } from '../../shared/feature-flags-runtime/index';

const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', Vary: 'Authorization' };
export async function featureFlags(request: Request, env: ReportsEnv, send: typeof fetch = fetch): Promise<Response> {
  if (!['GET', 'PUT'].includes(request.method)) return new Response(null, {status:405,headers:{...headers,Allow:'GET, PUT'}});
  const denied = await authorizeReport(request, env, send);
  if (denied) return denied;
  if (request.method === 'PUT') {
    if (request.headers.get('origin') !== new URL(request.url).origin) return new Response(null, {status:403,headers});
    let input: unknown;
    try { input = await request.json(); } catch { return new Response(null, {status:400,headers}); }
    try { await setFeatureFlag(env, input); }
    catch (error) { if (error instanceof InvalidFeatureFlag) return new Response(null, {status:400,headers}); throw error; }
    return Response.json({saved:true},{headers});
  }
  return Response.json(await manageFeatureFlags(env),{headers});
}

export class InvalidFeatureFlag extends Error {}

/** Shared by authenticated HTTP and the private System service binding. */
export async function setFeatureFlag(env: Pick<ReportsEnv, 'LIBRARIES'>, input: unknown): Promise<{saved:true}> {
  const value = input as {key?: unknown};
  if (!value || typeof value.key !== 'string' || !Object.hasOwn(FEATURE_FLAGS, value.key) || !isReleaseRule(input) || (input.accountIds?.length ?? 0) > 100) throw new InvalidFeatureFlag('Invalid feature flag');
  await env.LIBRARIES.put(`feature-flags/${value.key}.json`, JSON.stringify({enabled:input.enabled,audience:input.audience,accountIds:input.accountIds ?? []}));
  return {saved:true};
}

export async function manageFeatureFlags(env: Pick<ReportsEnv, 'LIBRARIES'>) {
  const flags = await Promise.all(Object.entries(FEATURE_FLAGS).map(async ([key, definition]) => {
    const object = await env.LIBRARIES.get(`feature-flags/${key}.json`);
    const stored: unknown = object ? await object.json() : undefined;
    const rule = isReleaseRule(stored) ? stored : null;
    return { key, label: definition.label, description: definition.description, enabled: rule?.enabled ?? (object ? false : definition.defaultEnabled === true), audience:rule?.audience ?? 'owner', accountIds:rule?.accountIds ?? [], inherited:!object };
  }));
  return flags;
}
