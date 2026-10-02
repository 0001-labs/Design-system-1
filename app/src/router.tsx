import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { MouseEvent, ReactNode } from "react";

/**
 * A ~90-line router over history.pushState.
 *
 * The workbench has two runtime dependencies and six routes. react-router v7's
 * loaders, nested layouts and data-router opinions would need somewhere to
 * live, and the only component here is a single 2300-line file that does not
 * want them. If nested layouts ever appear, swapping the library in is contained
 * to this file and Root.tsx.
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

interface LocationValue {
  /** Path with the base stripped, e.g. "/libraries". */
  path: string;
  search: URLSearchParams;
}

const LocationContext = createContext<LocationValue>({
  path: "/",
  search: new URLSearchParams(),
});

function readLocation(): LocationValue {
  return {
    path: stripBase(window.location.pathname),
    search: new URLSearchParams(window.location.search),
  };
}

export function navigate(path: string, options: { replace?: boolean } = {}): void {
  const url = href(path);
  if (options.replace) window.history.replaceState({}, "", url);
  else window.history.pushState({}, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/** Drop query params without adding a history entry — used to strip ?code=. */
export function replaceSearch(search: string): void {
  const next = `${window.location.pathname}${search ? `?${search}` : ""}`;
  window.history.replaceState({}, "", next);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationValue>(readLocation);

  useEffect(() => {
    const onChange = () => setLocation(readLocation());
    window.addEventListener("popstate", onChange);
    return () => window.removeEventListener("popstate", onChange);
  }, []);

  return <LocationContext.Provider value={location}>{children}</LocationContext.Provider>;
}

export function useLocation(): LocationValue {
  return useContext(LocationContext);
}

export function Link({
  to,
  children,
  ...rest
}: { to: string; children: ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const onClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      // Leave modified clicks alone so "open in new tab" still works.
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      event.preventDefault();
      navigate(to);
    },
    [to],
  );

  return (
    <a href={href(to)} onClick={onClick} {...rest}>
      {children}
    </a>
  );
}

/**
 * Match a pattern like "/l/:id" against the current path.
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

export function useRoute(pattern: string): Record<string, string> | null {
  const { path } = useLocation();
  return useMemo(() => matchRoute(pattern, path), [pattern, path]);
}
