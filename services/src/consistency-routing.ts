import { FEATURE_FLAGS } from '../../shared/feature-flags';
import { resolveFlag } from '../../shared/feature-flags-runtime/index';
import { applyComponentDecision, componentContext, componentState, componentQuestions, COMPONENT_ROUTING_FLAG, COMPONENT_ROUTING_MODEL, COMPONENT_ROUTING_TIMEOUT, type ComponentRequest } from '../../shared/consistency-routing';
import type { ReportsEnv } from './reports';

export interface ComponentRoutingEnv extends ReportsEnv { TYPESAFE_API_KEY?: string }

/** Caller must have completed the existing verified owner authorization. */
export async function routeComponentEdit(input: ComponentRequest, env: ComponentRoutingEnv, send: typeof fetch, signal: AbortSignal) {
  const context = componentContext(input);
  if (!context || !env.TYPESAFE_API_KEY || signal.aborted) return null;
  const abort = new AbortController();
  const cancel = () => abort.abort();
  signal.addEventListener('abort', cancel, { once: true });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const work = async () => {
    const object = await env.LIBRARIES.get(`feature-flags/${COMPONENT_ROUTING_FLAG}.json`);
    const rules = object ? { [COMPONENT_ROUTING_FLAG]: await object.json() } : {};
    if (!resolveFlag(FEATURE_FLAGS, COMPONENT_ROUTING_FLAG, rules, { accountId: env.REPORTS_OWNER_ID, isOwner: true }) || abort.signal.aborted) return null;
    const response = await send('https://api.typesafe.ai/v1/systemone', {
      method: 'POST', headers: { authorization: `Bearer ${env.TYPESAFE_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: COMPONENT_ROUTING_MODEL, state: componentState(context), questions: componentQuestions(context) }),
      signal: abort.signal, redirect: 'error',
    });
    if (!response.ok || abort.signal.aborted) return null;
    const body: unknown = await response.json();
    return abort.signal.aborted ? null : applyComponentDecision(context, body);
  };
  try {
    return await Promise.race([work(), new Promise<null>(resolve => {
      timer = setTimeout(() => { cancel(); resolve(null); }, COMPONENT_ROUTING_TIMEOUT);
    })]);
  } catch { return null; }
  finally { clearTimeout(timer); signal.removeEventListener('abort', cancel); }
}
