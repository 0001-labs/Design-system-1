import { html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { siteNavigation, isNavigationCurrent } from "../../shared/site-navigation";
import "../../shared/site-navigation.css";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { libraryComponent, libraryHref, type LibraryNavigation } from "../../shared/library-navigation";
import { authState, LiveQuery } from "./lib/backend";
import { AppElement, defineElement } from "./lib/element";
import { currentLocation, follow, href, matchRoute, navigate } from "./router";

/** The site's navigation over the page it holds (`content`). */
export class AppShell extends AppElement {
  static properties = { content: { attribute: false } };
  declare content: unknown;

  #library = new LiveQuery(this, api.libraries.get, () => {
    const { isAuthenticated, isLoading } = authState.get();
    const editor = matchRoute("/l/:id", currentLocation.get().path);
    return !isLoading && isAuthenticated && editor ? { id: editor.id as Id<"libraries"> } : "skip";
  });
  #reported: string | null = null;
  #current: LibraryNavigation | null = null;

  #embedded() {
    return document.documentElement.hasAttribute("data-docs-embed");
  }

  #report = () => {
    window.parent.postMessage({ type: "ds1:library-navigation", ...JSON.parse(this.#reported ?? "{}") }, window.location.origin);
  };

  #receive = (event: MessageEvent) => {
    if (event.origin !== window.location.origin || event.source !== window.parent) return;
    const current = this.#current;
    if (event.data?.type === "ds1:library-navigation-request") this.#report();
    if (event.data?.type === "ds1:library-overview" && current) navigate(`${libraryHref({ ...current, view: "overview" }).slice(4)}&embed=docs`);
    if (event.data?.type === "ds1:library-component" && current && typeof event.data.component === "string") {
      navigate(`${libraryHref({ ...current, view: undefined }, libraryComponent(event.data.component)).slice(4)}&embed=docs`);
    }
  };

  override connectedCallback() {
    super.connectedCallback();
    if (this.#embedded()) window.addEventListener("message", this.#receive);
  }

  override disconnectedCallback() {
    window.removeEventListener("message", this.#receive);
    this.#reported = null;
    super.disconnectedCallback();
  }

  /** In the documentation's frame, the parent hears which library is open whenever it changes. */
  override updated() {
    if (!this.#embedded() || !this.isConnected) return;
    const context = JSON.stringify({ library: this.#current, libraryId: matchRoute("/l/:id", currentLocation.get().path)?.id ?? null });
    if (context === this.#reported) return;
    this.#reported = context;
    this.#report();
  }

  override render() {
    const { path, search } = currentLocation.get();
    const { isAuthenticated, isLoading } = authState.get();
    const signInPath = path === "/reports/components" || path === "/libraries" || path.startsWith("/l/") ? path : "/signin";
    const embedded = this.#embedded();
    const editor = matchRoute("/l/:id", path);
    const library = this.#library.value;
    this.#current = !isLoading && isAuthenticated && editor && library
      ? { id: editor.id!, name: library.name, publishedVersion: library.publishedVersion, component: libraryComponent(search.get("component")), ...(search.get("view") === "overview" ? { view: "overview" as const } : {}) } : null;
    const account = isAuthenticated ? "/profile" : signInPath;
    return html`<div class="app-shell">
      <header class="ds-header ds-header--app site-navigation" data-ds-area="Navigation">
        <div class="system-breadcrumb" aria-label="System breadcrumb">
          <a class="site-brand" href="/" target=${ifDefined(embedded ? "_top" : undefined)}>Design system 1</a>
        </div>
        <nav aria-label="Main navigation" class="site-links">
          ${siteNavigation.filter(item => item.href !== "/app/libraries" || (!isLoading && isAuthenticated)).map(item => item.href.startsWith("/app/")
            ? html`<a href=${href(item.href.slice(4))} @click=${follow(item.href.slice(4))} aria-current=${ifDefined(isNavigationCurrent(item.href, `/app${path}`) ? "page" : undefined)}>${item.label}</a>`
            : html`<a href=${item.href} target=${ifDefined(embedded ? "_top" : undefined)}>${item.label}</a>`)}
        </nav>
        <a class="site-account" href=${href(account)} @click=${follow(account)} aria-current=${ifDefined(path === "/signin" ? "page" : undefined)}>${isLoading ? "Account" : isAuthenticated ? "Account" : "Sign in"}</a>
      </header>
      <div class="app-content">${this.content}</div>
    </div>`;
  }
}
defineElement("ds1-shell", AppShell);
