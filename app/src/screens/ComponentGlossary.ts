import { html } from "lit";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import "../../../DS1/1-root/controls.css";
import "../../../DS1/3-unit/ds-tabs";
import codes from "../../../shared/component-codes.json";
import { ALL_LAYERS } from "../../../shared/component-directory";
import { AppElement, defineElement } from "../lib/element";
import { button } from "../lib/ui";
import "./component-adoption.css";

/** Every component's code, layer by layer, for the owner. */
export class ComponentGlossary extends AppElement {
  static properties = { signOut: { attribute: false }, query: { state: true }, layer: { state: true } };
  declare signOut: () => Promise<void>;
  declare query: string;
  declare layer: number;

  constructor() {
    super();
    this.signOut = async () => {};
    this.query = "";
    this.layer = ALL_LAYERS[0]!.number;
  }

  override render() {
    const selected = ALL_LAYERS.find(entry => entry.number === this.layer)!;
    const layerCodes = codes.filter(code => selected.entries.some(entry => code.url === `https://designsystem1.com${entry.href}`));
    const matches = layerCodes.filter(entry => `${entry.code} ${entry.label}`.toLowerCase().includes(this.query.trim().toLowerCase())).sort((a, b) => a.code.localeCompare(b.code));
    return html`<main class="adoption">
      <header class="adoption-heading">
        <div><p class="adoption-eyebrow"><a href="#adoption">Component adoption</a> · Private</p><h1>Component glossary</h1></div>
        ${button("Sign out", () => void this.signOut(), { secondary: false })}
      </header>
      <ds-tabs aria-label="Component layers">
        ${ALL_LAYERS.map(entry => html`<ds-button control="slotted" ?active=${this.layer === entry.number}><button type="button" id=${`glossary-layer-${entry.number}`} role="tab"
          aria-selected=${String(this.layer === entry.number)} aria-controls="glossary-layer-panel" tabindex=${this.layer === entry.number ? 0 : -1}
          @click=${() => { this.layer = entry.number; }}>${entry.name}</button></ds-button>`)}
      </ds-tabs>
      <section id="glossary-layer-panel" role="tabpanel" aria-labelledby=${`glossary-layer-${this.layer}`} tabindex="0">
        <div class="adoption-controls">
          <label>Find a code or component <input class="ds-input" type="search" .value=${live(this.query)} @input=${(event: Event) => { this.query = (event.target as HTMLInputElement).value; }} /></label>
        </div>
        <p role="status">${matches.length} of ${layerCodes.length} ${selected.name} codes</p>
        <table class="ds-table"><thead><tr><th scope="col">Code</th><th scope="col">Component</th></tr></thead>
          <tbody>${repeat(matches, entry => entry.id, entry => html`<tr><td style="font-family: var(--ds-typeface-mono, var(--typeface-mono))">${entry.code}</td><td><a href=${entry.url}>${entry.label}</a></td></tr>`)}</tbody>
        </table>
      </section>
    </main>`;
  }
}
defineElement("ds1-component-glossary", ComponentGlossary);
