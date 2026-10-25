import { LAYERS } from "./component-directory";

export type LibraryNavigation = { id: string; name: string; publishedVersion: number | null; component: string; view?: "overview" };
export const defaultLibraryComponent = "/2-core/button/";
export function libraryComponent(value: string | null): string {
  return LAYERS.some(layer => layer.entries.some(entry => entry.href === value)) ? value! : defaultLibraryComponent;
}
export function libraryHeading(library: Pick<LibraryNavigation, "name" | "publishedVersion">): string {
  return `${library.name} · ${library.publishedVersion === null ? "Draft" : `v${library.publishedVersion}`}`;
}
export function libraryHref(library: LibraryNavigation, component = library.component): string {
  return `/app/l/${encodeURIComponent(library.id)}?${new URLSearchParams({ component, ...(library.view ? { view: library.view } : {}) })}`;
}
/** Only accept metadata for the library returned by the authenticated editor. */
export function readLibraryNavigation(value: unknown): LibraryNavigation | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  if (typeof data.id !== "string" || !data.id || typeof data.name !== "string" || !data.name.trim()) return null;
  if (data.publishedVersion !== null && (typeof data.publishedVersion !== "number" || !Number.isInteger(data.publishedVersion) || data.publishedVersion < 1)) return null;
  return { id: data.id, name: data.name, publishedVersion: data.publishedVersion as number | null, component: libraryComponent(typeof data.component === "string" ? data.component : null), ...(data.view === "overview" ? { view: "overview" as const } : {}) };
}

export function libraryWorkspaceHref(library: LibraryNavigation, component = library.component): string {
  return `/libraries/workspace/?${new URLSearchParams({ library: library.id, component, ...(library.view ? { view: library.view } : {}) })}`;
}

/** Normal library links share the docs shell; embedded and explicit full-screen apps stay put. */
export function libraryWorkspaceRedirect(path: string, query: URLSearchParams, embedded: boolean, _standalone: boolean): string | null {
  if (embedded) return null;
  if (path === '/profile') return '/account/';
  if (path === '/' || path === '/playground') return '/libraries/playground/';
  // The base system is Design system 1 among the owner's libraries; only its view travels.
  if (path === '/base') return `/libraries/design-system-1/${query.has('view') ? `?${new URLSearchParams({ view: query.get('view')! })}` : ''}`;
  const match = /^\/l\/([^/]+)$/.exec(path);
  if (path !== '/libraries' && !match) return null;
  const destination = new URLSearchParams();
  if (match) destination.set('library', decodeURIComponent(match[1]!));
  if (query.get('view') === 'overview') destination.set('view', 'overview');
  if (query.has('component')) destination.set('component', libraryComponent(query.get('component')));
  return `/libraries/workspace/${destination.size ? `?${destination}` : ''}`;
}
