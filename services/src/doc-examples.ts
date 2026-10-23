import { DOC_EXAMPLES } from '../../shared/doc-examples';
import type { ReportsEnv } from './reports';

type Storage = Pick<ReportsEnv, 'LIBRARIES'>;
const key = (id: string) => `docs/examples/${id}.json`;

export async function listExamples(env: Storage) {
  return Promise.all(DOC_EXAMPLES.map(async example => {
    const object = await env.LIBRARIES.get(key(example.id));
    let stored: unknown;
    try { stored = object ? await object.json() : undefined; } catch { stored = undefined; }
    const enabled = stored && typeof stored === 'object' && 'enabled' in stored && typeof stored.enabled === 'boolean' ? stored.enabled : example.defaultEnabled;
    return { ...example, enabled };
  }));
}

/** Private service-binding RPC only; the System dashboard checks the owner and origin. */
export async function setExample(env: Storage, input: unknown) {
  if (!input || typeof input !== 'object' || !('id' in input) || !('enabled' in input)
    || typeof input.id !== 'string' || typeof input.enabled !== 'boolean'
    || !DOC_EXAMPLES.some(example => example.id === input.id)) throw new Error('Invalid example setting');
  // Separate keys prevent two independent switches overwriting one another.
  await env.LIBRARIES.put(key(input.id), JSON.stringify({ enabled: input.enabled }));
  return { saved: true as const };
}

/** Remove disabled examples before HTML reaches the reader: no flash or hidden iframe loads. */
export async function filterDocExamples(response: Response, env: Storage): Promise<Response> {
  if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) return response;
  const disabled = new Set((await listExamples(env)).filter(example => !example.enabled).map(example => example.id));
  const result = new HTMLRewriter().on('[data-doc-example]', {
    element(element) { if (disabled.has(element.getAttribute('data-doc-example') ?? '')) element.remove(); },
  }).transform(response);
  result.headers.set('Cache-Control', 'no-store');
  result.headers.delete('Content-Length');
  result.headers.delete('ETag');
  return result;
}
