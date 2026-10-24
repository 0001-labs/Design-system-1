import { html } from "lit";
import type { ReactiveController, ReactiveControllerHost } from "lit";
import { authState, authToken, signOut } from "../lib/backend";
import { AppElement, defineElement } from "../lib/element";
import { button, loading, notice } from "../lib/ui";
import "./ComponentAdoption";
import "./ComponentGlossary";
import "./SignIn";

/**
 * The owner's session on a private host: the Worker gates the page, this
 * session bridge and every read on its own; this only bridges the sign-in
 * token into the host's cookie, then reloads the protected page. The host
 * reads `ready` and `error`, and calls `leave()` to sign out.
 */
export class OwnerSession implements ReactiveController {
  ready = false;
  error = "";
  #destination = new URLSearchParams(window.location.search).get("next") === "/private-app/" ? "/private-app/" + (["#keyboard-shortcut", "#spacing-handle", "#loading-indicator"].includes(window.location.hash) ? window.location.hash : "") : "/";
  #token: string | null | undefined = undefined;
  #controller: AbortController | null = null;

  constructor(private host: ReactiveControllerHost, private title: string) {
    host.addController(this);
  }

  hostConnected() {
    document.title = this.title;
  }

  hostDisconnected() {
    this.#controller?.abort();
    this.#token = undefined;
  }

  /** Each new session is bridged once. */
  hostUpdate() {
    const token = authToken.get();
    if (token === this.#token) return;
    this.#token = token;
    this.#controller?.abort();
    this.ready = false; this.error = "";
    if (!token) return;
    const controller = this.#controller = new AbortController();
    void fetch("/api/dashboard/session", { method: "POST", headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error((await response.json()).error || "This page is private.");
        if (!controller.signal.aborted) {
          this.ready = true;
          this.host.requestUpdate();
          // Prove the protected HTML route before showing anything after sign-in.
          if (window.location.pathname !== "/" && window.location.pathname !== "/app/adoption") window.location.replace(this.#destination);
        }
      }).catch(caught => {
        if (controller.signal.aborted) return;
        this.error = caught instanceof Error ? caught.message : "Could not check access.";
        this.host.requestUpdate();
      });
  }

  leave = async () => {
    await fetch("/api/dashboard/session", { method: "DELETE" });
    await signOut();
    window.location.replace("/app/signin");
  };
}

/** The Worker independently gates the page, session bridge and every report read. */
export class AdoptionDashboard extends AppElement {
  static properties = { glossary: { state: true } };
  declare glossary: boolean;
  #session = new OwnerSession(this, "Component adoption · Design system 1");
  #hash = () => { this.glossary = window.location.hash === "#glossary"; };

  constructor() {
    super();
    this.glossary = window.location.hash === "#glossary";
  }

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener("hashchange", this.#hash);
  }

  override disconnectedCallback() {
    window.removeEventListener("hashchange", this.#hash);
    super.disconnectedCallback();
  }

  override render() {
    const { isLoading, isAuthenticated } = authState.get();
    const { ready, error, leave } = this.#session;
    if (isLoading) return html`<main class="adoption">${loading("Checking your session")}</main>`;
    if (!isAuthenticated) return html`<div class="app-shell"><ds1-sign-in dashboard-only .redirectTo=${"/reports/components"}></ds1-sign-in></div>`;
    if (error) return html`<main class="adoption">${notice(error, { tone: "danger", actions: button("Sign out", () => void leave()) })}</main>`;
    if (!ready) return html`<main class="adoption">${loading("Checking dashboard access")}</main>`;
    return this.glossary ? html`<ds1-component-glossary .signOut=${leave}></ds1-component-glossary>` : html`<ds1-component-adoption .signOut=${leave}></ds1-component-adoption>`;
  }
}
defineElement("ds1-adoption-dashboard", AdoptionDashboard);
