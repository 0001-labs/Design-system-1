import { OwnerSession } from "./screens/AdoptionDashboard";
import { html } from "lit";
import { libraryWorkspaceRedirect } from "../../shared/library-navigation";
import { authState } from "./lib/backend";
import { AppElement, defineElement } from "./lib/element";
import { button, loading } from "./lib/ui";
import { currentLocation, matchRoute, navigate } from "./router";
import "./AppShell";
import "./NavigationAuth";
import "./SystemWorkbench";
import "./screens/AdoptionDashboard";
import "./screens/BaseEditor";
import "./screens/FeatureFlags";
import "./screens/FontWorkspace";
import "./screens/iconBuilder/IconBuilder";
import "./screens/LibraryEditor";
import "./screens/LibraryList";
import "./screens/Profile";
import "./screens/SignIn";

const splash = () => html`<div class="route-splash" data-testid="route-splash">${loading("Loading")}</div>`;

/**
 * Route table.
 *
 *   /playground   today's workbench, no account, no persistence
 *   /signin       the shared sign-in screen: the email, then the code or the owner's password
 *   /libraries    dashboard
 *   /l/:id        editor
 *   /base         the base system, the owner's live edits
 *
 * `/playground` keeps the product's current front door working and gives people
 * something to try before creating an account.
 */
export class AppRoutes extends AppElement {
  #path: string | null = null;

  override willUpdate() {
    const { path } = currentLocation.get();
    if (path === this.#path) return;
    this.#path = path;
    const query = new URLSearchParams(window.location.search);
    if (query.get("standalone") === "1") document.documentElement.setAttribute("data-standalone-workspace", "");
    const destination = libraryWorkspaceRedirect(path, query, document.documentElement.hasAttribute("data-docs-embed"), document.documentElement.hasAttribute("data-standalone-workspace"));
    if (destination) window.location.replace(destination);
  }

  override render() {
    const { path } = currentLocation.get();
    const { isAuthenticated, isLoading } = authState.get();
    const editor = matchRoute("/l/:id", path);

    if (path === "/" || path === "/playground") return html`<ds1-system-workbench></ds1-system-workbench>`;
    if (isLoading) return splash();
    if (!isAuthenticated) {
      // Remember where they were headed so sign-in can return them there.
      return path !== "/signin" ? html`<ds1-sign-in .redirectTo=${path}></ds1-sign-in>` : html`<ds1-sign-in></ds1-sign-in>`;
    }
    if (path === "/signin") {
      queueMicrotask(() => navigate("/libraries", { replace: true }));
      return splash();
    }
    if (path === "/libraries") return html`<ds1-library-list></ds1-library-list>`;
    if (path === "/profile") return html`<ds1-profile></ds1-profile>`;
    if (path === "/base") return html`<ds1-base-editor></ds1-base-editor>`;
    if (path === "/reports/components") { window.location.replace("https://designsystem1.com/adoption/"); return splash(); }
    if (editor) return html`<ds1-library-editor .libraryId=${editor.id!}></ds1-library-editor>`;
    return html`<div class="route-splash">
      <p class="ds-text">That page does not exist.</p>
      ${button("Go to your libraries", () => navigate("/libraries"))}
    </div>`;
  }
}
defineElement("ds1-routes", AppRoutes);

/** The page this address and host show. */
export class AppRoot extends AppElement {
  override render() {
    const { pathname, hostname } = window.location;
    if (["/flags", "/flags/", "/app/flags"].includes(pathname)) return html`<ds1-feature-flags></ds1-feature-flags>`;
    if (pathname === "/app/navigation-auth") return html`<ds1-navigation-auth></ds1-navigation-auth>`;
    if (["c9y.site", "neweditor.c9y.site"].includes(hostname)) return html`<ds1-private-preview-signin></ds1-private-preview-signin>`;
    if (pathname === "/app/adoption") return html`<ds1-adoption-dashboard></ds1-adoption-dashboard>`;
    if (hostname === "fonts.designsystem1.com") return html`<ds1-font-workspace></ds1-font-workspace>`;
    if (hostname === "icon.designsystem1.com") return html`<ds1-icon-builder></ds1-icon-builder>`;
    return html`<ds1-shell .content=${html`<ds1-routes></ds1-routes>`}></ds1-shell>`;
  }
}
defineElement("ds1-root", AppRoot);

/** Bridges the existing owner sign-in to this host's protected root. */
class PrivatePreviewSignIn extends AppElement {
  #session = new OwnerSession(this, "Consistency");
  override render() {
    const { isLoading, isAuthenticated } = authState.get();
    if (isLoading) return splash();
    if (!isAuthenticated) return html`<ds1-sign-in private-title="Consistency" .redirectTo=${"/signin"}></ds1-sign-in>`;
    if (this.#session.error) return html`<main class="auth-screen"><p role="alert">${this.#session.error}</p></main>`;
    return splash();
  }
}
defineElement("ds1-private-preview-signin", PrivatePreviewSignIn);
