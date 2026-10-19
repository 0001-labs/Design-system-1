import { useEffect, type ReactNode } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { siteNavigation, isNavigationCurrent } from "../../shared/site-navigation";
import "../../shared/site-navigation.css";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { libraryComponent, libraryHref, type LibraryNavigation } from "../../shared/library-navigation";
import { Link, matchRoute, navigate, useLocation } from "./router";

export function AppShell({ children }: { children: ReactNode }) {
  const { path, search } = useLocation();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const signInPath = path === "/reports/components" || path === "/libraries" || path.startsWith("/l/") ? path : "/signin";
  const embedded = document.documentElement.hasAttribute("data-docs-embed");

  const profile = useQuery(api.users.profile, !isLoading && isAuthenticated ? {} : "skip");
  const editor = matchRoute("/l/:id", path);
  const library = useQuery(api.libraries.get, !isLoading && isAuthenticated && editor ? { id: editor.id as Id<"libraries"> } : "skip");
  const current: LibraryNavigation | null = !isLoading && isAuthenticated && editor && library
    ? { id: editor.id!, name: library.name, publishedVersion: library.publishedVersion, component: libraryComponent(search.get("component")), ...(search.get("view") === "overview" ? { view: "overview" as const } : {}) } : null;
  const context = JSON.stringify({ library: current, libraryId: editor?.id ?? null });
  useEffect(() => {
    if (!embedded) return;
    const report = () => window.parent.postMessage({ type: "ds1:library-navigation", ...JSON.parse(context) }, window.location.origin);
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (event.data?.type === "ds1:library-navigation-request") report();
      if (event.data?.type === "ds1:library-overview" && current) navigate(`${libraryHref({ ...current, view: "overview" }).slice(4)}&embed=docs`);
      if (event.data?.type === "ds1:library-component" && current && typeof event.data.component === "string") {
        navigate(`${libraryHref({ ...current, view: undefined }, libraryComponent(event.data.component)).slice(4)}&embed=docs`);
      }
    };
    window.addEventListener("message", receive);
    report();
    return () => { window.removeEventListener("message", receive); };
  }, [context, embedded]);

  return (
    <div className="app-shell">
      <header className="site-navigation" data-ds-area="Navigation">
        <div className="system-breadcrumb" aria-label="System breadcrumb">
          {isAuthenticated && !isLoading && <><Link to="/libraries">{profile?.companyName || "My company"}</Link><span aria-hidden="true">/</span></>}
          <a className="site-brand" href={current ? libraryHref({ ...current, view: "overview" }) : "/start-here/overview/"}
            onClick={current ? event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return; event.preventDefault(); navigate(`${libraryHref({ ...current, view: "overview" }).slice(4)}${embedded ? "&embed=docs" : ""}`); } : undefined}
            target={!current && embedded ? "_top" : undefined}>{current ? current.name : "Design system 1"}</a>
        </div>
        <nav aria-label="Main navigation" className="site-links">
          {siteNavigation.filter((item) => item.href !== "/app/libraries" || (!isLoading && isAuthenticated)).map((item) => item.href.startsWith("/app/") ? (
            <Link key={item.href} to={item.href.slice(4)} aria-current={isNavigationCurrent(item.href, `/app${path}`) ? "page" : undefined}>{item.label}</Link>
          ) : (
            <a key={item.href} href={item.href} target={embedded ? "_top" : undefined}>{item.label}</a>
          ))}
        </nav>
        <Link className="site-account" to={isAuthenticated ? "/libraries" : signInPath} aria-current={path === "/signin" ? "page" : undefined}>
          {isLoading ? "Account" : isAuthenticated ? "Account" : "Sign in"}
        </Link>
      </header>
      <div className="app-content">{children}</div>
    </div>
  );
}
