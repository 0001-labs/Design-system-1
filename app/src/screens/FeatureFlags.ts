import { html } from "lit";
import { mountFlags } from "../../../shared/feature-flags-runtime/manage";
import { authState, authToken } from "../lib/backend";
import { AppElement, defineElement } from "../lib/element";
import "./SignIn";

/** The release controls, for the owner: the shared management view over `/api/flags`. */
export class FeatureFlags extends AppElement {
  #mounted: { token: string; host: HTMLElement; stop: () => void; disposed: boolean } | null = null;

  #unmount() {
    if (!this.#mounted) return;
    this.#mounted.disposed = true;
    this.#mounted.stop();
    this.#mounted = null;
  }

  override updated() {
    const token = authToken.get();
    const host = this.querySelector<HTMLElement>("[data-flags-host]");
    if (this.#mounted && this.#mounted.token === token && this.#mounted.host === host) return;
    this.#unmount();
    if (!token || !host) return;
    async function request(init: RequestInit = {}) {
      const response = await fetch("/api/flags", { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, cache: "no-store" });
      if (!response.ok) throw new Error("Feature flags are private to the owner.");
      return response.json();
    }
    const mounted = { token, host, stop: () => {}, disposed: false };
    this.#mounted = mounted;
    void mountFlags(host, { manage: () => request(), set: async rule => { await request({ method: "PUT", body: JSON.stringify(rule) }); } })
      .then(stop => { if (mounted.disposed) stop(); else mounted.stop = stop; });
  }

  override disconnectedCallback() {
    this.#unmount();
    super.disconnectedCallback();
  }

  override render() {
    const { isLoading, isAuthenticated } = authState.get();
    authToken.get();
    if (isLoading) return html`<p class="ds-text">Loading…</p>`;
    if (!isAuthenticated) return html`<ds1-sign-in .redirectTo=${"/flags"}></ds1-sign-in>`;
    return html`<main><h1 class="ds-text">Feature flags</h1><div data-flags-host></div></main>`;
  }
}
defineElement("ds1-feature-flags", FeatureFlags);
