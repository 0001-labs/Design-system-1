import { signal } from "@lit-labs/signals";

/**
 * A small router over history.pushState: the address is a signal, so every
 * element that reads it while rendering follows it.
 */

/** Matches Vite's `base` and the production `/app/*` route. */
export const BASE = "/app";

function stripBase(pathname: string): string {
  if (pathname === BASE) return "/";
  if (pathname.startsWith(`${BASE}/`)) return pathname.slice(BASE.length) || "/";
  return pathname;
}

export function href(path: string): string {
  return `${BASE}${path === "/" ? "/" : path}`;
}

export interface LocationValue {
  /** Path with the base stripped, e.g. "/libraries". */
  path: string;
  search: URLSearchParams;
}

function readLocation(): LocationValue {
  return { path: stripBase(window.location.pathname), search: new URLSearchParams(window.location.search) };
}

/** Where the app is. */
export const currentLocation = signal<LocationValue>(readLocation());
window.addEventListener("popstate", () => currentLocation.set(readLocation()));

export function navigate(path: string, options: { replace?: boolean } = {}): void {
  const url = href(path);
  if (options.replace) window.history.replaceState({}, "", url);
  else window.history.pushState({}, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/** Drop query params without adding a history entry. */
export function replaceSearch(search: string): void {
  const next = `${window.location.pathname}${search ? `?${search}` : ""}`;
  window.history.replaceState({}, "", next);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/**
 * The click listener of an in-app link (`<a href=${href(to)} @click=${follow(to)}>`):
 * modified clicks are left alone so "open in new tab" still works.
 */
export function follow(to: string) {
  return (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
  };
}

/**
 * Match a pattern like "/l/:id" against a path.
 * Returns the captured params, or null when it does not match.
 */
export function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (const [index, part] of patternParts.entries()) {
    const actual = pathParts[index]!;
    if (part.startsWith(":")) params[part.slice(1)] = decodeURIComponent(actual);
    else if (part !== actual) return null;
  }
  return params;
}
