import type { ReactNode } from "react";
import { useConvexAuth } from "convex/react";
import { siteNavigation, isNavigationCurrent } from "../../shared/site-navigation";
import "../../shared/site-navigation.css";
import { Link, useLocation } from "./router";

export function AppShell({ children }: { children: ReactNode }) {
  const { path } = useLocation();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const signInPath = path === "/reports/components" || path === "/libraries" || path.startsWith("/l/") ? path : "/signin";
  const embedded = document.documentElement.hasAttribute("data-docs-embed");

  return (
    <div className="app-shell">
      <header className="site-navigation" data-ds-area="Navigation">
        <a className="site-brand" href="/" target={embedded ? "_top" : undefined}>Design system 1</a>
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
