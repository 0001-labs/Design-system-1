import { html } from "lit";
import { authToken, signOut } from "../lib/backend";
import { AppElement, defineElement } from "../lib/element";
import { button, loading, notice } from "../lib/ui";
import type { AdoptionReport } from "../../../shared/component-adoption";
import "./ComponentMatrix";
export { ComponentMatrix } from "./ComponentMatrix";

/** The private report: the component matrix and the icon matrix from the last published source snapshot. */
export class ComponentAdoption extends AppElement {
  static properties = { signOut: { attribute: false }, report: { state: true }, error: { state: true }, retry: { state: true } };
  declare signOut: (() => Promise<void>) | undefined;
  declare report: AdoptionReport | null;
  declare error: string;
  declare retry: number;
  #loaded: string | null = null;
  #controller: AbortController | null = null;

  constructor() {
    super();
    this.signOut = undefined;
    this.report = null;
    this.error = "";
    this.retry = 0;
  }

  override disconnectedCallback() {
    this.#controller?.abort();
    this.#loaded = null;
    super.disconnectedCallback();
  }

  /** Reads the report again whenever the session changes or Try again is pressed. */
  override willUpdate() {
    const token = authToken.get();
    const key = JSON.stringify([token, this.retry]);
    if (key === this.#loaded) return;
    this.#loaded = key;
    this.#controller?.abort();
    const controller = this.#controller = new AbortController();
    this.report = null; this.error = "";
    if (!token) return;
    void fetch("/api/reports/components", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "The report could not be loaded.");
        if (data.schema !== 1 || !Array.isArray(data.apps) || !Array.isArray(data.columns)) throw new Error("The report format is not supported.");
        if (!controller.signal.aborted) this.report = data;
      }).catch(caught => { if (!controller.signal.aborted) this.error = caught instanceof Error ? caught.message : "The report could not be loaded."; });
  }

  override render() {
    return html`<main class="adoption" data-testid="component-adoption">
      <header class="adoption-heading">
        <div><p class="adoption-eyebrow">Reports · Private · <a href="/private-app/">App</a> · <a href="#glossary">Glossary</a></p><h1>Component adoption</h1></div>
        <ds-button @click=${() => void (this.signOut ? this.signOut() : signOut())}>Sign out</ds-button>
      </header>
      ${this.error ? notice(this.error, { tone: "danger", actions: button("Try again", () => { this.retry += 1; }) })
        : this.report ? html`<ds1-component-matrix .report=${this.report}></ds1-component-matrix><ds1-icon-matrix .report=${this.report}></ds1-icon-matrix>` : loading("Reading the source snapshot")}
    </main>`;
  }
}
defineElement("ds1-component-adoption", ComponentAdoption);

