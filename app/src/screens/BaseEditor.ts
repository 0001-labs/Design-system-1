import { html, nothing } from "lit";
import { keyed } from "lit/directives/keyed.js";
import "../SystemWorkbench";
import { BaseDraft } from "../lib/baseDraft";
import { AppElement, defineElement } from "../lib/element";
import { button, loading, notice } from "../lib/ui";
import { currentLocation, navigate } from "../router";

/** Inline notices for a save that cannot go on: a newer version saved elsewhere, or a failure. Routine saves stay silent. */
export function draftNotices(draft: BaseDraft) {
  return html`${draft.state === "conflict" ? notice("Open the newest base to keep editing. Your last change has not been made live.", {
    tone: "warning", role: "alert", heading: "The base was saved somewhere else", testid: "base-conflict",
    actions: button("Open the newest", () => void draft.load()),
  }) : nothing}${draft.state === "error" && draft.failure ? notice(draft.failure, { tone: "danger", testid: "base-error" }) : nothing}`;
}

/** The base's versions, newest first, each made live again on request. */
export function draftHistory(draft: BaseDraft) {
  return html`<ol class="base-history" data-testid="base-history">${draft.history.map(row => html`<li>
    <span>Version ${row.version}${row.restoredFrom ? ` (from ${row.restoredFrom})` : ""}, ${row.overrides} ${row.overrides === 1 ? "token" : "tokens"} changed, ${new Date(row.createdAt).toLocaleString()}</span>
    ${row.version === draft.base?.version ? html`<span>Live</span>` : button("Make live", () => void draft.restore(row.version))}
  </li>`)}</ol>`;
}

/**
 * Every token of the base system in the libraries' token workbench (`/base?view=tokens`), live
 * once saved: every save is a version, and `/ds1/base/latest.css` serves it to every product that
 * links it. Loading and saving are the draft's (`lib/baseDraft.ts`).
 */
export class BaseEditor extends AppElement {
  static properties = { showHistory: { state: true } };
  declare showHistory: boolean;
  readonly draft = new BaseDraft(this);

  constructor() {
    super();
    this.showHistory = false;
  }

  #header() {
    const base = this.draft.base;
    return html`<header class="workbench-header" data-ds-area="Base actions">
      <div><strong>Design system 1</strong>${base ? html`<span>Version ${base.version}</span>` : html`<span>Not edited yet</span>`}</div>
      <div class="workbench-header-actions">
        ${button("Components", () => {
          const query = new URLSearchParams(currentLocation.get().search);
          query.delete("view");
          navigate(`/base${query.size ? `?${query}` : ""}`);
        })}
        ${button(this.showHistory ? "Back to tokens" : "History", () => { this.showHistory = !this.showHistory; })}
      </div>
      ${draftNotices(this.draft)}
      ${this.showHistory ? draftHistory(this.draft) : nothing}
    </header>`;
  }

  override render() {
    const draft = this.draft;
    if (draft.failure && draft.base === undefined) return html`<main class="route-splash"><p class="ds-text" role="alert">${draft.failure}</p></main>`;
    if (draft.base === undefined) return html`<main class="route-splash">${loading("Loading Design system 1")}</main>`;
    // Seeded once per load, as a library editor is per library.
    return keyed(draft.seed, html`<ds1-system-workbench
      .initialCss=${draft.css}
      .header=${this.#header()}
      @workbench-dirty=${(event: CustomEvent<{ css: string }>) => draft.replace(event.detail.css)}></ds1-system-workbench>`);
  }
}
defineElement("ds1-base-editor", BaseEditor);
