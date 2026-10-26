/**
 * Profil, the signed-in owner's own Flavo profile in Consistency's app, ported from the old CMS's profile page
 * (`src/components/iroco-cms/ProfilePage.ts`): the e-mail (changed only by Flavo), the role, the first and last name
 * (each saved on leaving it; a refusal puts the saved name back and says why), and whether the profile's feature
 * flag is on. Language and password stayed with the old CMS: the app has its own language, and the owner signs in
 * through System.
 */
import { LitElement, html, nothing } from "lit";
import { failure, joinName, roleWords, splitName, type FlavoPlaceContext, type Me } from "./core";
import { KeepCurrent } from "./keep";

export class FlavoPlaceProfile extends LitElement {
  static properties = { me: { state: true }, error: { state: true }, first: { state: true }, last: { state: true }, busy: { state: true }, saveError: { state: true } };
  context!: FlavoPlaceContext;
  declare me: Me | null;
  declare error: string;
  declare first: string;
  declare last: string;
  declare busy: boolean;
  declare saveError: string;
  private readonly current = new KeepCurrent(this, () => this.read());

  constructor() { super(); this.me = null; this.error = ""; this.first = ""; this.last = ""; this.busy = false; this.saveError = ""; }
  protected createRenderRoot() { return this; }
  private get savedName() { return this.me?.profile?.name ?? ""; }

  private async read(): Promise<boolean> {
    try {
      const me = (await this.context.transport("accounts:me", {})) as Me;
      // A name being typed stays; otherwise the fields follow the profile as it is now.
      const typing = this.me !== null && (this.busy || joinName(this.first, this.last) !== this.savedName);
      this.me = me;
      this.error = "";
      if (!typing) ({ first: this.first, last: this.last } = splitName(me.profile?.name ?? ""));
      return true;
    } catch (error) {
      this.error = failure(error);
      return false;
    }
  }

  /** The name, saved on leaving a field when it changed. */
  private async save() {
    const me = this.me;
    const name = joinName(this.first, this.last);
    if (!me || this.busy || name === this.savedName) return;
    if (!name) { ({ first: this.first, last: this.last } = splitName(this.savedName)); return; }
    const profile = me.profile;
    this.busy = true; this.saveError = "";
    try {
      await this.context.transport("accounts:save", { company: profile?.company.trim() || "Flavo", name, phone: profile?.phone ?? "", cvr: profile?.cvr ?? "" });
      this.me = { ...me, profile: profile ? { ...profile, name } : profile };
      void this.current.run();
    } catch (error) {
      ({ first: this.first, last: this.last } = splitName(this.savedName));
      this.saveError = failure(error);
    } finally { this.busy = false; }
  }

  render() {
    const me = this.me;
    const role = me?.roles.includes("admin") ? "admin" : me?.roles.includes("editor") ? "editor" : null;
    const flag = me?.flags?.["flavo-profile-flags"] === true;
    const name = (label: string, value: string, set: (value: string) => void) => html`<div class="place-field"><ds-text tone="muted" literal text=${label}></ds-text>
      <ds-input variant="field" aria-label=${label} autocomplete=${label === "Fornavn" ? "given-name" : "family-name"} ?disabled=${!me || this.busy} .value=${value}
        @input-change=${(event: CustomEvent<{ value: string }>) => set(event.detail.value)} @focusout=${() => void this.save()}></ds-input></div>`;
    return html`<section class="place flavo-place" aria-label="Profil">
      <div class="place-head"><ds-text class="place-title" role="heading" aria-level="1" literal size="display" text="Profil"></ds-text>
        ${role ? html`<ds-tag>${roleWords(role)}</ds-tag>` : nothing}</div>
      ${this.error ? html`<ds-message role="alert" tone="danger" literal text=${this.error}></ds-message>` : nothing}
      ${!me ? (this.error ? nothing : html`<ds-text tone="muted" literal text="Henter profilen…"></ds-text>`) : html`<div class="flavo-form">
        <div class="place-field"><ds-text tone="muted" literal text="E-mail"></ds-text><ds-input variant="field" aria-label="E-mail" readonly .value=${me.email}></ds-input></div>
        <div class="flavo-names">${name("Fornavn", this.first, value => { this.first = value; this.saveError = ""; })}${name("Efternavn", this.last, value => { this.last = value; this.saveError = ""; })}</div>
        ${this.saveError ? html`<ds-message role="alert" tone="danger" literal text=${this.saveError}></ds-message>` : nothing}
        <ds-list heading="Funktionsflag"><ds-row><span class="ds-row__name">Profilsiden, der viser flag</span><ds-tag>${flag ? "Til" : "Fra"}</ds-tag></ds-row></ds-list>
      </div>`}
    </section>`;
  }
}
if (!customElements.get("flavo-place-profile")) customElements.define("flavo-place-profile", FlavoPlaceProfile);
