/**
 * A site's own API, as the owner, from Consistency's app: `/api/consistency/sites/<code>/api/<route>` through the
 * DS1 gateway to the platform, which asks that site's object for the site engine's route (or Flavo's business)
 * on its allowlist. A place calls this rather than `fetch`, so every place reads and writes the same way and
 * says what went wrong in the same words.
 */
import { failureWords } from '../site-editing';

/**
 * A site's menu, as the platform's `places` gives it: an id the app knows, and the site's word for it. Its `sources`
 * are the page sources Pages merges in beside the site engine's pages (`PAGE_SOURCES` in `pages.ts`).
 */
export interface SitePlace { id: string; label: string; sources?: string[] }

/** A refused or failed call: its status, the platform's error code, and the words to show. */
export class SiteApiError extends Error {
  readonly status: number;
  readonly code?: string;
  constructor(status: number, code?: string) { super(failureWords(status, code)); this.status = status; this.code = code; }
}

const base = (code: string) => `/api/consistency/sites/${encodeURIComponent(code)}`;

async function answer<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && init.body !== null && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', ...init, headers }).catch(() => null);
  if (!response) throw new SiteApiError(0);
  let body: unknown = null;
  try { body = await response.json(); } catch { /* the status says enough */ }
  if (!response.ok) throw new SiteApiError(response.status, body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : undefined);
  return body as T;
}

/**
 * One of the site's routes, with its query if it takes one (`bookings?status=confirmed`), as JSON. A body is sent
 * as JSON: give it as a string, or as `json` to have it written.
 */
export function siteApi<T>(code: string, route: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  return answer<T>(`${base(code)}/api/${route.replace(/^\/+/, '')}`, json === undefined ? rest : { ...rest, body: JSON.stringify(json) });
}

/** The site's menus, as its current build's config gives them. */
export async function sitePlaces(code: string): Promise<SitePlace[]> {
  const { places } = await answer<{ places?: unknown }>(`${base(code)}/places`);
  return Array.isArray(places) ? places.filter((place): place is SitePlace => !!place && typeof place.id === 'string' && typeof place.label === 'string')
    .map(place => (Array.isArray(place.sources) ? { ...place, sources: place.sources.filter((name: unknown) => typeof name === 'string') } : { id: place.id, label: place.label })) : [];
}
