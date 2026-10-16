import { useEffect, useState, type ReactNode } from "react";
import { calculateScalingFactor } from "../../DS1/0-face/scaling";
import { useConvexAuth } from "convex/react";
import { siteNavigation, isNavigationCurrent } from "../../shared/site-navigation";
import "../../shared/site-navigation.css";
import { Link, useLocation } from "./router";

export function AppShell({ children }: { children: ReactNode }) {
  const { path } = useLocation();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const signInPath = path === "/reports/components" || path === "/libraries" || path.startsWith("/l/") ? path : "/signin";
  const [grid, setGrid] = useState(false);
  const [layout, setLayout] = useState(false);
  const embedded = document.documentElement.hasAttribute("data-docs-embed");

  useEffect(() => {
    const root = document.documentElement;
    const scale = () => {
      const width = window.innerWidth;
      root.style.setProperty("--sf", String(width <= 768 ? calculateScalingFactor(width) : 1));
    };
    const sync = () => {
      setGrid(root.hasAttribute("data-ds-grid-visible"));
      setLayout(root.hasAttribute("data-ds-layout-visible"));
    };
    scale();
    sync();
    window.addEventListener("resize", scale);
    window.addEventListener("design-system-grid-changed", sync);
    window.addEventListener("design-system-layout-changed", sync);
    return () => {
      window.removeEventListener("resize", scale);
      window.removeEventListener("design-system-grid-changed", sync);
      window.removeEventListener("design-system-layout-changed", sync);
    };
  }, []);

  return (
    <div className="app-shell">
      <header className="site-navigation" data-ds-area="Navigation">
        <a className="site-brand" href="/" target={embedded ? "_top" : undefined}>Design system 1</a>
        <nav aria-label="Main navigation" className="site-links">
          {siteNavigation.map((item) => item.href.startsWith("/app/") ? (
            <Link key={item.href} to={item.href.slice(4)} aria-current={isNavigationCurrent(item.href, `/app${path}`) ? "page" : undefined}>{item.label}</Link>
          ) : (
            <a key={item.href} href={item.href} target={embedded ? "_top" : undefined}>{item.label}</a>
          ))}
          <div className="site-tools" role="group" aria-label="Layout tools">
            <button type="button" aria-pressed={grid} onClick={() => window.dispatchEvent(new Event("design-system-toggle-grid"))}>Grid</button>
            <button type="button" aria-pressed={layout} onClick={() => window.dispatchEvent(new Event("design-system-toggle-layout"))}>Layout</button>
          </div>
        </nav>
        <Link className="site-account" to={isAuthenticated ? "/libraries" : signInPath} aria-current={path === "/signin" ? "page" : undefined}>
          {isLoading ? "Account" : isAuthenticated ? "Account" : "Sign in"}
        </Link>
      </header>
      <div className="app-content">{children}</div>
    </div>
  );
}
