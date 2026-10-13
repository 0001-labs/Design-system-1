import { useEffect, useState, type ReactNode } from "react";
import { calculateScalingFactor } from "../../DS1/0-face/scaling";
import { Link, useLocation } from "./router";

export function AppShell({ children }: { children: ReactNode }) {
  const { path } = useLocation();
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
      <header className="app-navigation" data-ds-area="Navigation">
        <a className="app-home" href="/" target={embedded ? "_top" : undefined}>
          <span aria-hidden="true">←</span> Back to site
        </a>
        <span className="app-name">Design system 1</span>
        <nav aria-label="App navigation" className="app-links">
          <Link to="/playground" aria-current={path === "/" || path === "/playground" || path.startsWith("/l/") ? "page" : undefined}>Editor</Link>
          <Link to="/libraries" aria-current={path === "/libraries" ? "page" : undefined}>My libraries</Link>
          <Link to="/reports/components" aria-current={path === "/reports/components" ? "page" : undefined}>Reports</Link>
          <a href="/classless/" target={embedded ? "_top" : undefined}>Docs</a>
        </nav>
        <div className="app-inspect" aria-label="Layout tools">
          <button type="button" aria-pressed={grid} title="Show grid · G three times" onClick={() => window.dispatchEvent(new Event("design-system-toggle-grid"))}>Grid</button>
          <button type="button" aria-pressed={layout} title="Show layout areas · L three times" onClick={() => window.dispatchEvent(new Event("design-system-toggle-layout"))}>Layout</button>
        </div>
      </header>
      <div className="app-content">{children}</div>
    </div>
  );
}
