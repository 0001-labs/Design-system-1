/**
 * Kunder and Flavo team, Flavo's accounts in Consistency's app, ported from the old CMS's member table, member
 * editor, creator and Link section (`src/components/Cms.ts`, deleted 26 October 2026). Kunder are the accounts with
 * no role, Flavo team those with one (Redaktør, Administrator), searched by company, name and CVR.
 *
 * Pressing a member opens it in a non-modal drawer: the company, name, phone and CVR, and its roles, saved with Gem
 * adgang. Ny kunde and Invitér teammedlem open the same drawer with a new account's fields; it is created at once and
 * signs in with a code to its e-mail once e-mail sign-in is open (no mail is sent from here). Only administrators
 * manage accounts; the business store checks every call again.
 *
 * Kunder also shows Link: connecting a Link account (approved at using.link with a code, read every five seconds
 * while it waits), its customers and their projects under the list, and disconnecting it.
 */
import { LitElement, html, nothing } from "lit";
import {
  draftCall, emptyDraft, failure, linkCustomersOf, linkWords, membersOf, roleAbout, roleWords,
  type FlavoPlaceContext, type LinkConnection, type LinkCustomer, type Me, type Member, type MemberDraft, type Role,
} from "./core";
import { KeepCurrent } from "./keep";

/** How often a waiting Link approval is asked about. */
const LINK_WAIT = 5000;
const ROLES: Role[] = ["editor", "admin"];

interface Open { member: Member; roles: Role[]; busy: boolean; error: string }
interface Creating { draft: MemberDraft; busy: boolean; error: string }

export class FlavoPlaceMembers extends LitElement {
  static properties = {
    members: { state: true }, me: { state: true }, error: { state: true }, search: { state: true }, opened: { state: true }, creating: { state: true },
    link: { state: true }, customers: { state: true }, linkBusy: { state: true }, linkError: { state: true },
  };
  context!: FlavoPlaceContext;
  /** Flavo team: the accounts with a role; else Kunder. */
  team = false;
  declare members: Member[] | null;
  declare me: Me | null;
  declare error: string;
  declare search: string;
  declare opened: Open | null;
  declare creating: Creating | null;
  declare link: LinkConnection | null | undefined;
  declare customers: LinkCustomer[];
  declare linkBusy: boolean;
  declare linkError: string;
  private readonly current = new KeepCurrent(this, () => this.read());
  private waiting: ReturnType<typeof setInterval> | undefined;

  constructor() {
    super();
    this.members = null; this.me = null; this.error = ""; this.search = ""; this.opened = null; this.creating = null;
    this.link = undefined; this.customers = []; this.linkBusy = false; this.linkError = "";
  }
  protected createRenderRoot() { return this; }
  disconnectedCallback() { super.disconnectedCallback(); clearInterval(this.waiting); this.waiting = undefined; }
  private get transport() { return this.context.transport; }
  private get heading() { return this.team ? "Flavo team" : "Kunder"; }
  private get manage() { return !!this.me?.roles.includes("admin"); }

  private async read(): Promise<boolean> {
    const [members, me] = await Promise.allSettled([this.transport("accounts:members", {}) as Promise<Member[]>, this.transport("accounts:me", {}) as Promise<Me>]);
    if (me.status === "fulfilled") this.me = me.value;
    if (members.status === "rejected") { this.error = failure(members.reason); return false; }
    this.error = "";
    this.members = Array.isArray(members.value) ? members.value : [];
    const open = this.opened;
    if (open && !open.busy) {
      const fresh = this.members.find(member => member._id === open.member._id);
      if (fresh) this.opened = { ...open, member: fresh, roles: open.roles.join() === open.member.roles.join() ? fresh.roles : open.roles };
    }
    if (!this.team && this.manage) void this.readLink();
    return true;
  }

  /** Link's connection, its customers once connected, and a wait for an approval under way. */
  private async readLink() {
    try {
      this.link = ((await this.transport("link:connection", {})) as LinkConnection | null) ?? null;
      if (this.link?.status === "connected") this.customers = ((await this.transport("link:customers", {})) as LinkCustomer[]) ?? [];
      else this.customers = [];
    } catch (error) {
      this.linkError = failure(error);
    }
    this.watchLink();
  }
  private watchLink() {
    if (this.link?.status === "pending" && !this.waiting) this.waiting = setInterval(() => void this.linkStep("link:finish", false), LINK_WAIT);
    if (this.link?.status !== "pending" && this.waiting) { clearInterval(this.waiting); this.waiting = undefined; }
  }
  private async linkStep(operation: string, shown = true) {
    if (shown) { this.linkBusy = true; this.linkError = ""; }
    try {
      await this.transport(operation, {});
      if (operation === "link:disconnect") this.customers = [];
      await this.readLink();
    } catch (error) {
      if (shown) this.linkError = failure(error);
    } finally { if (shown) this.linkBusy = false; }
  }

  private open(member: Member) { this.creating = null; this.opened = { member, roles: member.roles, busy: false, error: "" }; }
  private create() { this.opened = null; this.creating = { draft: emptyDraft(), busy: false, error: "" }; }
  private close() { this.opened = null; this.creating = null; }

  /** The roles, saved as one; a refusal puts the saved ones back and says why. */
  private async saveRoles() {
    const open = this.opened;
    if (!open || open.busy) return;
    this.opened = { ...open, busy: true, error: "" };
    try {
      await this.transport("accounts:setRoles", { id: open.member._id, roles: open.roles });
      this.context.say("Adgangen er gemt.");
      if (this.opened?.member._id === open.member._id) this.opened = { ...this.opened, busy: false, member: { ...open.member, roles: open.roles } };
      void this.current.run();
    } catch (error) {
      if (this.opened?.member._id === open.member._id) this.opened = { ...this.opened, busy: false, roles: open.member.roles, error: failure(error) };
    }
  }

  private async submit() {
    const creating = this.creating;
    if (!creating || creating.busy) return;
    const call = draftCall(creating.draft, this.team);
    if ("problem" in call) { this.creating = { ...creating, error: call.problem }; return; }
    this.creating = { ...creating, busy: true, error: "" };
    try {
      await this.transport(call.operation, call.args);
      this.creating = null;
      this.context.say(`Kontoen er oprettet. ${String(call.args.email)} kan logge ind med en kode til den adresse, når e-mail-login er åbent. Der sendes ingen mail herfra.`);
      void this.current.run();
    } catch (error) {
      if (this.creating) this.creating = { ...this.creating, busy: false, error: failure(error) };
    }
  }

  render() {
    const shown = this.members ? membersOf(this.members, this.team, this.search, this.me) : [];
    const count = this.members ? membersOf(this.members, this.team, "", this.me).length : null;
    return html`<section class="place flavo-place" aria-label=${this.heading}>
      <div class="place-head">
        <ds-text class="place-title" role="heading" aria-level="1" literal size="display" text=${this.heading}></ds-text>
        ${count === null ? nothing : html`<span class="place-muted">${count}</span>`}
      </div>
      <div class="place-tools">
        <span class="place-filters"><ds-input class="place-search" type="search" aria-label="Søg i medlemmer" placeholder=${this.team ? "Søg i teamet" : "Søg efter en kunde"} autocomplete="off"
          .value=${this.search} @input-change=${(event: CustomEvent<{ value: string }>) => { this.search = event.detail.value; }}></ds-input></span>
        ${this.manage ? html`<ds-button primary @click=${() => this.create()}>${this.team ? "Invitér teammedlem" : "Ny kunde"}</ds-button>` : nothing}
      </div>
      ${this.error ? html`<ds-message role="alert" tone="danger" literal text=${this.error}></ds-message>` : nothing}
      ${this.members === null ? (this.error ? nothing : html`<ds-text tone="muted" literal text="Henter medlemmer…"></ds-text>`)
        : shown.length ? html`<ds-list class="flavo-members">${shown.map(member => this.row(member))}</ds-list>`
          : html`<ds-empty literal heading=${this.team ? "Teamet samles her" : "Kunderne samles her"} text=${this.search ? "Ingen medlemmer matcher søgningen." : this.team
            ? "Invitér et teammedlem her. Redaktører arbejder med indhold; administratorer behandler forespørgsler og adgang."
            : "Opret en kunde her, eller vent til virksomheden selv udfylder sin profil."}></ds-empty>`}
      ${!this.team && this.manage ? this.linkSection() : nothing}
      ${this.drawer()}
    </section>`;
  }

  private row(member: Member) {
    return html`<ds-row interactive class="flavo-member" data-member=${member._id} ?open=${this.opened?.member._id === member._id} @ds-row-press=${() => this.open(member)}>
      <span class="ds-row__name">${member.name}</span>
      <span class="place-muted flavo-member__company">${member.company}</span>
      <span class="place-muted flavo-member__phone">${member.phone || "—"}</span>
      ${this.team ? member.roles.map(role => html`<ds-tag>${roleWords(role)}</ds-tag>`) : html`<span class="ds-row__value">${member.cvr || "—"}</span>`}
    </ds-row>`;
  }

  private linkSection() {
    const link = this.link;
    const customers = linkCustomersOf(this.customers, this.search);
    return html`<section class="flavo-link" aria-label="Link">
      <ds-text role="heading" aria-level="2" literal size="heading" text="Link"></ds-text>
      <ds-text wrap literal text=${linkWords(link)}></ds-text>
      ${link?.status === "pending" && link.verificationUrl ? html`<a class="ds-link" href=${link.verificationUrl} target="_blank" rel="noreferrer">Godkend i Link</a>` : nothing}
      <div class="place-actions">
        ${link && link.status !== "connected" && link.status !== "pending" || link === null ? html`<ds-button primary ?disabled=${this.linkBusy} @click=${() => void this.linkStep("link:begin")}>Forbind Link</ds-button>` : nothing}
        ${link?.status === "pending" ? html`<ds-button primary ?disabled=${this.linkBusy} @click=${() => void this.linkStep("link:finish")}>Jeg har godkendt</ds-button>` : nothing}
        ${link?.status === "connected" ? html`<ds-button secondary ?disabled=${this.linkBusy} @click=${() => void this.linkStep("link:disconnect")}>Afbryd Link</ds-button>` : nothing}
      </div>
      ${this.linkError ? html`<ds-message role="alert" tone="danger" literal text=${this.linkError}></ds-message>` : nothing}
      ${link?.status === "connected" ? customers.length ? html`<ds-list heading="Kunder fra Link">${customers.map(customer => html`<ds-row>
          <span class="ds-row__name">${customer.name}</span>
          <span class="place-muted">${customer.projects.length ? customer.projects.map(project => `${project.name}${project.status ? ` · ${project.status}` : ""}`).join(", ") : "Ingen projekter"}</span>
          <ds-tag>Fra Link</ds-tag></ds-row>`)}</ds-list>`
        : html`<ds-text tone="muted" literal text=${this.search ? "Ingen kunder fra Link matcher søgningen." : "Ingen kunder i det forbundne arbejdsrum."}></ds-text>` : nothing}
    </section>`;
  }

  private drawer() {
    const open = !!this.opened || !!this.creating;
    return html`<ds-overlay type="drawer" non-modal .holdScroll=${false} .blockOutside=${false} ?open=${open} @ds-close-request=${() => this.close()}>
      <dialog class="place-drawer flavo-drawer" aria-labelledby="flavo-member-title">${this.opened ? this.member(this.opened) : this.creating ? this.creator(this.creating) : nothing}</dialog>
    </ds-overlay>`;
  }

  private member(open: Open) {
    const { member } = open;
    return html`<div data-ds-overlay="header"><h2 data-ds-overlay="title" id="flavo-member-title">${member.name}</h2>
        <p data-ds-overlay="description">${member.company}</p></div>
      <ds-list>
        <ds-row><span class="ds-row__name">Telefon</span><span class="ds-row__value">${member.phone || "—"}</span></ds-row>
        ${member.cvr ? html`<ds-row><span class="ds-row__name">CVR</span><span class="ds-row__value">${member.cvr}</span></ds-row>` : nothing}
      </ds-list>
      ${this.manage ? html`<ds-list heading="Adgang">${ROLES.map(role => html`<ds-row><label class="place-check"><ds-checkbox><input type="checkbox" data-role=${role} .checked=${open.roles.includes(role)} ?disabled=${open.busy}
          @change=${(event: Event) => { const on = (event.target as HTMLInputElement).checked; if (this.opened) this.opened = { ...this.opened, error: "", roles: on ? [...this.opened.roles.filter(each => each !== role), role] : this.opened.roles.filter(each => each !== role) }; }}></ds-checkbox>${roleAbout(role)}</label></ds-row>`)}</ds-list>
        ${open.error ? html`<ds-message role="alert" tone="danger" literal text=${open.error}></ds-message>` : nothing}`
        : html`<ds-text tone="muted" literal text="Kun administratorer kan ændre adgang."></ds-text>`}
      <div data-ds-overlay="footer" class="place-actions">
        ${this.manage ? html`<ds-button primary data-save ?disabled=${open.busy || open.roles.join() === member.roles.join()} @click=${() => void this.saveRoles()}>Gem adgang</ds-button>` : nothing}
        <ds-button secondary @click=${() => this.close()}>Luk</ds-button>
      </div>`;
  }

  private creator(creating: Creating) {
    const { draft } = creating;
    const set = (next: Partial<MemberDraft>) => { if (this.creating) this.creating = { ...this.creating, error: "", draft: { ...this.creating.draft, ...next } }; };
    const field = (label: string, key: keyof MemberDraft, type = "text") => html`<div class="place-field"><ds-text tone="muted" literal text=${label}></ds-text>
      <ds-input variant="field" aria-label=${label} type=${type} data-field=${key} ?disabled=${creating.busy} .value=${String(draft[key])} @input-change=${(event: CustomEvent<{ value: string }>) => set({ [key]: event.detail.value })}></ds-input></div>`;
    return html`<div data-ds-overlay="header"><h2 data-ds-overlay="title" id="flavo-member-title">${this.team ? "Invitér et teammedlem" : "Ny kunde"}</h2>
        <p data-ds-overlay="description">${this.team ? "Adgangen gælder med det samme. Personen logger ind med en kode til e-mailen, når e-mail-login er åbent." : "Kunden vises her med det samme og logger ind med en kode til e-mailen, når e-mail-login er åbent."}</p></div>
      <div class="flavo-form">
        ${field("Fornavn", "firstName")}${field("Efternavn", "lastName")}${field("E-mail", "email", "email")}
        ${this.team ? ROLES.map(role => html`<label class="place-check"><ds-checkbox><input type="checkbox" data-role=${role} .checked=${draft[role]} ?disabled=${creating.busy}
            @change=${(event: Event) => set({ [role]: (event.target as HTMLInputElement).checked })}></ds-checkbox>${roleAbout(role)}</label>`)
          : html`${field("Virksomhed", "company")}${field("Telefon", "phone", "tel")}${field("CVR", "cvr")}`}
      </div>
      ${creating.error ? html`<ds-message role="alert" tone="danger" literal text=${creating.error}></ds-message>` : nothing}
      <div data-ds-overlay="footer" class="place-actions">
        <ds-button primary data-create ?disabled=${creating.busy} @click=${() => void this.submit()}>${this.team ? "Opret konto" : "Opret kunde"}</ds-button>
        <ds-button secondary @click=${() => this.close()}>Annuller</ds-button>
      </div>`;
  }
}
if (!customElements.get("flavo-place-members")) customElements.define("flavo-place-members", FlavoPlaceMembers);
