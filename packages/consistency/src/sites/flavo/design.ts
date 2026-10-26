/**
 * Designretning, the choice of Flavo's homepage design in Consistency's app, ported from the old design chooser
 * (`src/flavo-design/chooser.ts`, deleted 26 October 2026): the three directions (Gallery, Flower studio, Portfolio)
 * as cards, the chosen one previewed from the site (`/design-preview/<id>`, a page that writes nothing), at a phone's
 * width with Telefon, or opened in a new tab. Brug design saves the choice (`PUT design`, the owners only, every
 * choice kept with who and when); a refusal keeps the design the site uses and says why. Switching keeps the
 * homepage's words.
 */
import { LitElement, html, nothing } from "lit";
import { designWords, failure, mediaUrl, type Design, type FlavoPlaceContext } from "./core";
import { KeepCurrent } from "./keep";

interface DesignAnswer { design: string; designs?: Design[] }

export class FlavoPlaceDesign extends LitElement {
  static properties = { designs: { state: true }, active: { state: true }, selected: { state: true }, error: { state: true }, busy: { state: true }, phone: { state: true } };
  context!: FlavoPlaceContext;
  declare designs: Design[];
  declare active: string | null;
  declare selected: string | null;
  declare error: string;
  declare busy: boolean;
  declare phone: boolean;
  private readonly keep = new KeepCurrent(this, () => this.read());

  constructor() { super(); this.designs = []; this.active = null; this.selected = null; this.error = ""; this.busy = false; this.phone = false; }
  protected createRenderRoot() { return this; }

  private async read(): Promise<boolean> {
    try {
      const answer = await this.context.route<DesignAnswer>("design");
      if (Array.isArray(answer.designs)) this.designs = answer.designs;
      if (!this.busy) {
        const following = this.selected === null || this.selected === this.active;
        this.active = answer.design;
        if (following) this.selected = answer.design;
      }
      this.error = "";
      return true;
    } catch (error) {
      this.error = failure(error);
      return false;
    }
  }

  private async use() {
    const chosen = this.selected;
    if (!chosen || this.busy || chosen === this.active) return;
    this.busy = true; this.error = "";
    try {
      const answer = await this.context.route<DesignAnswer>("design", { method: "PUT", json: { design: chosen } });
      this.active = answer.design;
      this.context.say(`${this.designs.find(design => design.id === answer.design)?.name ?? "Designet"} bruges nu på hjemmesiden.`);
    } catch (error) {
      this.error = failure(error);
    } finally { this.busy = false; }
  }

  render() {
    const origin = this.context.origin;
    const selected = this.designs.find(design => design.id === this.selected);
    return html`<section class="place flavo-place flavo-design" aria-label="Designretning">
      <div class="place-head"><ds-text class="place-title" role="heading" aria-level="1" literal size="display" text="Designretning"></ds-text></div>
      ${this.error ? html`<ds-message role="alert" tone="danger" literal text=${this.error}></ds-message>` : nothing}
      ${!this.designs.length ? (this.error ? nothing : html`<ds-text tone="muted" literal text="Henter designs…"></ds-text>`) : html`
        <div class="flavo-design__choices" role="group" aria-label="Designretninger">${this.designs.map(design => html`<button type="button" class="flavo-design__card" data-design=${design.id}
            aria-pressed=${String(this.selected === design.id)} @click=${() => { this.selected = design.id; this.error = ""; }}>
          <span class="flavo-design__image" style=${`background:${design.color}`}><img src=${mediaUrl(origin, design.image)} alt="" width="400" height="280"></span>
          <span class="flavo-design__words"><strong>${design.name}</strong><span class="place-muted">${design.description}</span></span>
          ${this.active === design.id ? html`<ds-tag>Bruges nu</ds-tag>` : nothing}
        </button>`)}</div>
        <div class="place-actions">
          <ds-button secondary ?active=${this.phone} aria-pressed=${String(this.phone)} @click=${() => { this.phone = !this.phone; }}>Telefon</ds-button>
          ${selected ? html`<a class="ds-link" href=${`${origin}/design-preview/${selected.id}`} target="_blank" rel="noopener">Åbn i ny fane</a>` : nothing}
          <ds-button primary data-use ?disabled=${this.busy || !this.selected || this.selected === this.active} @click=${() => void this.use()}>${this.busy ? "Gemmer…" : "Brug design"}</ds-button>
        </div>
        ${this.selected ? html`<ds-text tone="muted" wrap literal aria-live="polite" text=${designWords(this.selected, this.active)}></ds-text>` : nothing}
        ${selected ? html`<div class="flavo-design__stage"><iframe class=${this.phone ? "flavo-design__frame flavo-design__frame--phone" : "flavo-design__frame"}
          title=${`Flavo – ${selected.name}`} src=${`${origin}/design-preview/${selected.id}?ph=out`}></iframe></div>` : nothing}`}
    </section>`;
  }
}
if (!customElements.get("flavo-place-design")) customElements.define("flavo-place-design", FlavoPlaceDesign);
