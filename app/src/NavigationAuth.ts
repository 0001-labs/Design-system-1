import { nothing } from "lit";
import { api } from "../../convex/_generated/api";
import { authState, authToken, LiveQuery, mutation } from "./lib/backend";
import { AppElement, defineElement } from "./lib/element";
import { libraryTemplate, templateVersion } from "./lib/libraryTemplate";

type AppNavigation = { token: string; components: { name: string; href: string; layer: number }[] };

/** Only the same-origin parent receives the signed-in workspace summary. Draws nothing. */
export class NavigationAuth extends AppElement {
  static properties = {
    appNavigation: { state: true },
    navigationLoading: { state: true },
    creating: { state: true },
    creationError: { state: true },
  };
  declare appNavigation: AppNavigation | null;
  declare navigationLoading: boolean;
  declare creating: boolean;
  declare creationError: string | null;

  #ready = () => { const { isLoading, isAuthenticated } = authState.get(); return !isLoading && isAuthenticated; };
  #profile = new LiveQuery(this, api.users.profile, () => this.#ready() ? {} : "skip");
  #libraries = new LiveQuery(this, api.libraries.list, () => this.#ready() ? {} : "skip");
  #pending = false;
  /** The session the navigation was last asked for, so it is asked once per change. */
  #session: string | null = null;
  #controller: AbortController | null = null;

  constructor() {
    super();
    this.appNavigation = null;
    this.navigationLoading = true;
    this.creating = false;
    this.creationError = null;
  }

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener("message", this.#request);
  }

  override disconnectedCallback() {
    window.removeEventListener("message", this.#request);
    this.#controller?.abort();
    this.#session = null;
    super.disconnectedCallback();
  }

  /** Asks the Worker for App's places whenever the session changes; signed out, its document session ends. */
  #follow(isLoading: boolean, ready: boolean, token: string | null) {
    const session = JSON.stringify([isLoading, ready, token]);
    if (session === this.#session) return;
    this.#session = session;
    this.#controller?.abort();
    this.#controller = null;
    this.appNavigation = null;
    if (isLoading) return;
    if (!ready || !token) {
      void fetch("/api/dashboard/session", { method: "DELETE", cache: "no-store" }).catch(() => {});
      return;
    }
    const controller = this.#controller = new AbortController();
    this.navigationLoading = true;
    void fetch("/api/app-navigation", { method: "POST", headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) {
          await fetch("/api/dashboard/session", { method: "DELETE", cache: "no-store", signal: controller.signal });
          return;
        }
        const data = await response.json();
        if (!controller.signal.aborted && Array.isArray(data.components)) this.appNavigation = { token, components: data.components };
      }).catch(() => { /* Access unavailable: keep internal navigation hidden. */ })
      .finally(() => { if (!controller.signal.aborted) this.navigationLoading = false; });
  }

  #report() {
    const { isLoading } = authState.get();
    const ready = this.#ready();
    const token = authToken.get();
    const libraries = this.#libraries.value;
    window.parent.postMessage({
      type: "ds1:navigation-auth", authenticated: ready, loading: isLoading || (ready && this.navigationLoading),
      // App's places answer only the owner, so having them is being the owner.
      owner: ready && token === this.appNavigation?.token,
      appComponents: ready && token === this.appNavigation?.token ? this.appNavigation.components : [],
      companyName: ready ? this.#profile.value?.companyName ?? "" : "",
      libraries: ready ? libraries?.map(({ _id, name, publishedVersion }) => ({ id: _id, name, publishedVersion })) ?? [] : [],
      librariesLoaded: ready && libraries !== undefined, creating: this.creating, creationError: this.creationError,
    }, window.location.origin);
  }

  #request = async (event: MessageEvent) => {
    if (event.origin !== window.location.origin || event.source !== window.parent) return;
    if (event.data?.type === "ds1:navigation-auth-request") this.#report();
    if (event.data?.type !== "ds1:create-library" || !this.#ready() || this.#pending) return;
    this.#pending = true; this.creating = true; this.creationError = null;
    try {
      const library = await mutation(api.libraries.create, { name: "Untitled library", css: libraryTemplate, config: JSON.stringify({ schema: 2 }), templateVersion: templateVersion() });
      window.parent.postMessage({ type: "ds1:library-created", id: library._id }, window.location.origin);
    } catch { this.creationError = "Could not create a library. Try again from My libraries."; }
    finally { this.#pending = false; this.creating = false; }
  };

  override willUpdate() {
    this.#follow(authState.get().isLoading, this.#ready(), authToken.get());
  }

  override render() {
    return nothing;
  }

  /** Every change is reported to the parent. */
  override updated() {
    if (this.isConnected) this.#report();
  }
}
defineElement("ds1-navigation-auth", NavigationAuth);
