/** Presentation metadata only. Private requests still authorize on the server. */
export type NavigationSummary = {
  type: 'ds1:navigation-auth'; authenticated: boolean; loading: boolean; owner: boolean;
  appComponents: { name: string; href: string; layer: number }[];
  companyName: string; libraries: { id: string; name: string; publishedVersion?: number | null }[];
  librariesLoaded: boolean; creating: boolean; creationError: string | null;
};
let revision = 0;
const KEY = 'ds1:navigation-summary:v1';
export const NAVIGATION_MAX_AGE = 5 * 60_000;
type Saved = { key: string; fingerprint: string | null; expires: number; summary: NavigationSummary };
const fingerprint = async (token: string | null) => token === null ? null :
  Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))), byte => byte.toString(16).padStart(2, '0')).join('');
export function clearNavigationCache() { revision++; try { sessionStorage.removeItem(KEY); } catch {} }
export async function saveNavigationCache(key: string, token: string | null, summary: NavigationSummary): Promise<number | undefined> {
  if (summary.loading || (summary.authenticated && !summary.librariesLoaded) || summary.creating) return;
  const current = ++revision;
  try {
    if (localStorage.getItem(key) !== token) return;
    const hash = await fingerprint(token);
    if (localStorage.getItem(key) !== token || current !== revision) return;
    const expires = Date.now() + NAVIGATION_MAX_AGE;
    sessionStorage.setItem(KEY, JSON.stringify({ key, fingerprint: hash, expires, summary } satisfies Saved));
    return expires;
  } catch { /* Storage is optional; use the live bridge. */ }
}
export async function readNavigationCache(): Promise<Saved | null> {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Saved;
    if (!/^__convexAuthJWT_[a-zA-Z0-9]+$/.test(saved.key) || !Number.isFinite(saved.expires)
      || saved.expires <= Date.now() || saved.expires > Date.now() + NAVIGATION_MAX_AGE
      || saved.summary?.type !== 'ds1:navigation-auth' || saved.summary.loading
      || !Array.isArray(saved.summary.appComponents) || !Array.isArray(saved.summary.libraries)) return null;
    const token = localStorage.getItem(saved.key);
    if (saved.fingerprint !== await fingerprint(token)) return null;
    if (localStorage.getItem(saved.key) !== token || sessionStorage.getItem(KEY) !== raw) return null;
    return saved;
  } catch { return null; }
}
