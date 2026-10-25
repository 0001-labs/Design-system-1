import { html, nothing } from "lit";
import { keyed } from "lit/directives/keyed.js";
import { TOKENS_START } from "../../../shared/base-sheet";
import "../SystemWorkbench";
import { libraryTemplate } from "../SystemWorkbench";
import { AUTOSAVE_DEBOUNCE_MS, AUTOSAVE_MAX_WAIT_MS, backoffMs } from "../lib/autosave";
import { authToken } from "../lib/backend";
import { AppElement, defineElement } from "../lib/element";
import { button, loading, notice } from "../lib/ui";

type Base = { css: string; rev: number; version: number; updatedAt: number; sheet: string; contentHash: string };
type Version = { version: number; createdAt: number; contentHash: string; restoredFrom: number | null; overrides: number };
type State = "live" | "dirty" | "saving" | "conflict" | "error";
const LABEL: Record<State, string> = { live: "Live", dirty: "Not live yet", saving: "Making it live…", conflict: "Saved somewhere else", error: "Could not make it live" };

/**
 * The base system, edited by the owner and live once saved: every save is a version, and
 * `/ds1/base/latest.css` serves it to every product that links it. Reads and writes go through
 * the Worker's `/api/base`, which checks the owner and the release flag.
 */
export class BaseEditor extends AppElement {
  static properties = { base: { state: true }, history: { state: true }, failure: { state: true }, state: { state: true }, showHistory: { state: true } };
  declare base: Base | null | undefined;
  declare history: Version[];
  declare failure: string;
  declare state: State;
  declare showHistory: boolean;
  #rev = 0;
  #pending: string | null = null;
  #saved: string | null = null;
  #debounce: ReturnType<typeof setTimeout> | null = null;
  #maxWait: ReturnType<typeof setTimeout> | null = null;
  #attempt = 0;
  #seed = 0;

  constructor() {
    super();
    this.base = undefined; this.history = []; this.failure = ""; this.state = "live"; this.showHistory = false;
  }

  override connectedCallback() { super.connectedCallback(); void this.#load(); window.addEventListener("pagehide", this.#flushNow); }
  override disconnectedCallback() {
    window.removeEventListener("pagehide", this.#flushNow);
    for (const timer of [this.#debounce, this.#maxWait]) if (timer) clearTimeout(timer);
    super.disconnectedCallback();
  }
  #flushNow = () => { if (this.#pending) void this.#flush(); };

  async #request(path: string, init: RequestInit = {}) {
    const token = authToken.get();
    const response = await fetch(path, { ...init, cache: "no-store", headers: { ...(init.body ? { "Content-Type": "application/json" } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) } });
    const body = await response.json().catch(() => ({})) as { base?: Base | null; history?: Version[]; error?: { code?: string; message?: string; details?: { serverRev?: number } } | string };
    return { response, body };
  }

  async #load() {
    const { response, body } = await this.#request("/api/base");
    if (!response.ok) { this.failure = typeof body.error === "string" ? body.error : body.error?.message ?? "The base could not be read."; return; }
    this.base = body.base ?? null;
    this.history = body.history ?? [];
    this.#rev = this.base?.rev ?? 0;
    this.#saved = this.base?.css ?? null;
    this.#seed += 1;
  }

  /** Today's component template under the saved overrides, so a newer template is never hidden by an old save. */
  get #initialCss() {
    const css = this.base?.css;
    const from = css?.lastIndexOf(TOKENS_START) ?? -1;
    return from < 0 ? libraryTemplate : `${libraryTemplate.trimEnd()}\n\n${css!.slice(from)}`;
  }

  #onDirty = (event: CustomEvent<{ css: string }>) => {
    if (this.base === undefined || event.detail.css === this.#saved) return;
    this.#pending = event.detail.css;
    if (this.state !== "conflict") this.state = "dirty";
    if (this.#debounce) clearTimeout(this.#debounce);
    this.#debounce = setTimeout(() => void this.#flush(), AUTOSAVE_DEBOUNCE_MS);
    this.#maxWait ??= setTimeout(() => { this.#maxWait = null; void this.#flush(); }, AUTOSAVE_MAX_WAIT_MS);
  };

  #flush = async () => {
    const css = this.#pending;
    if (css === null || this.state === "conflict" || this.state === "saving") return;
    this.state = "saving";
    const { response, body } = await this.#request("/api/base", { method: "PUT", body: JSON.stringify({ css, baseRev: this.#rev }) });
    if (response.ok && body.base) {
      this.#accept(body.base);
      if (this.#pending === css) this.#pending = null;
      this.state = this.#pending ? "dirty" : "live";
      if (this.#pending) void this.#flush();
      return;
    }
    const error = typeof body.error === "object" ? body.error : undefined;
    if (error?.code === "draft_conflict") { this.state = "conflict"; return; }
    this.state = "error";
    this.failure = error?.message ?? "";
    this.#attempt += 1;
    setTimeout(() => { if (this.isConnected && this.#pending) { this.state = "dirty"; void this.#flush(); } }, backoffMs(this.#attempt));
  };

  #accept(base: Base) {
    this.base = base;
    this.#rev = base.rev;
    this.#saved = base.css;
    this.#attempt = 0;
    this.failure = "";
    if (!this.history.some(row => row.version === base.version)) this.history = [{ version: base.version, createdAt: base.updatedAt, contentHash: base.contentHash, restoredFrom: null, overrides: (base.sheet.match(/^\s+--/gm) ?? []).length }, ...this.history].slice(0, 50);
  }

  async #restore(version: number) {
    this.state = "saving";
    const { response, body } = await this.#request("/api/base/restore", { method: "POST", body: JSON.stringify({ version }) });
    if (!response.ok || !body.base) { this.state = "error"; this.failure = typeof body.error === "object" ? body.error?.message ?? "" : ""; return; }
    this.#pending = null;
    await this.#load();
    this.state = "live";
  }

  #header() {
    const base = this.base;
    return html`<header class="workbench-header" data-ds-area="Base actions">
      <div><strong>Base system</strong>${base ? html`<span>Version ${base.version}</span>` : html`<span>Not edited yet</span>`}</div>
      <div class="workbench-header-actions">
        <span data-testid="save-state" data-state=${this.state}>${LABEL[this.state]}</span>
        ${button(this.showHistory ? "Back to components" : "History", () => { this.showHistory = !this.showHistory; })}
      </div>
      ${this.state === "conflict" ? notice("Reload to edit the newest base. Your last change has not been made live.", {
        tone: "warning", role: "alert", heading: "The base was saved somewhere else",
        actions: button("Reload", () => window.location.reload()),
      }) : nothing}
      ${this.state === "error" && this.failure ? notice(this.failure, { tone: "danger" }) : nothing}
      ${this.showHistory ? html`<ol class="base-history" data-testid="base-history">${this.history.map(row => html`<li>
        <span>Version ${row.version}${row.restoredFrom ? ` (from ${row.restoredFrom})` : ""}, ${row.overrides} ${row.overrides === 1 ? "token" : "tokens"} changed, ${new Date(row.createdAt).toLocaleString()}</span>
        ${row.version === base?.version ? html`<span>Live</span>` : button("Make live", () => void this.#restore(row.version))}
      </li>`)}</ol>` : nothing}
    </header>`;
  }

  override render() {
    if (this.failure && this.base === undefined) return html`<main class="route-splash"><p class="ds-text" role="alert">${this.failure}</p></main>`;
    if (this.base === undefined) return html`<main class="route-splash">${loading("Loading the base system")}</main>`;
    // Seeded once per load, as a library editor is per library.
    return keyed(this.#seed, html`<ds1-system-workbench
      .initialCss=${this.#initialCss}
      .header=${this.#header()}
      @workbench-dirty=${this.#onDirty}></ds1-system-workbench>`);
  }
}
defineElement("ds1-base-editor", BaseEditor);
