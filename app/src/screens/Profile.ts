import { html, nothing } from "lit";
import { live } from "lit/directives/live.js";
import { api } from "../../../convex/_generated/api";
import "../../../DS1/2-core/ds-avatar";
import "../../../DS1/2-core/ds-input";
import type { Input as InputElement } from "../../../DS1/2-core/ds-input";
import { LiveQuery, mutation, signOut } from "../lib/backend";
import { AppElement, defineElement } from "../lib/element";
import { button, loading, notice } from "../lib/ui";
import { follow, href } from "../router";
import "./profile.css";

/** The signed-in email, the company name and signing out. */
export class Profile extends AppElement {
  static properties = {
    company: { state: true },
    saving: { state: true },
    signingOut: { state: true },
    error: { state: true },
    saved: { state: true },
  };
  declare company: string | null;
  declare saving: boolean;
  declare signingOut: boolean;
  declare error: string | null;
  declare saved: boolean;
  #user = new LiveQuery(this, api.users.current, () => ({}));
  #profile = new LiveQuery(this, api.users.profile, () => ({}));
  #inFlight = false;

  constructor() {
    super();
    this.company = null;
    this.saving = false;
    this.signingOut = false;
    this.error = null;
    this.saved = false;
  }

  async #save(event: SubmitEvent, value: string) {
    event.preventDefault();
    if (this.#inFlight || !this.#profile.value || !value.trim()) return;
    this.#inFlight = true; this.saving = true; this.error = null; this.saved = false;
    try { await mutation(api.users.setCompanyName, { companyName: value }); this.company = null; this.saved = true; }
    catch { this.error = "Could not save the company name. Try again."; }
    finally { this.#inFlight = false; this.saving = false; }
  }

  async #signOut() {
    if (this.#inFlight) return;
    this.#inFlight = true; this.signingOut = true; this.error = null;
    try { await signOut(); }
    catch { this.error = "Could not sign out. Try again."; }
    finally { this.#inFlight = false; this.signingOut = false; }
  }

  override render() {
    const user = this.#user.value, profile = this.#profile.value;
    if (user === undefined || profile === undefined) return html`<main class="profile-page">${loading("Loading your profile")}</main>`;
    const value = this.company ?? profile?.companyName ?? "";
    return html`<main class="profile-page" data-testid="profile-page">
      <a href=${href("/libraries")} @click=${follow("/libraries")}>Your libraries</a>
      <header class="profile-heading"><ds-avatar icon="avatar" aria-hidden="true"></ds-avatar><h1>Your profile</h1></header>
      <div class="profile-email"><span class="profile-label">Signed-in email</span><p>${user?.email ?? "No email available"}</p></div>
      <form class="profile-form" @submit=${(event: SubmitEvent) => void this.#save(event, value)}>
        <label><span class="profile-label">Company name</span>
          <ds-input variant="field" type="text" aria-label="Company name" .value=${live(value)} required maxlength="80" ?disabled=${this.saving || !profile}
            @input=${(event: Event) => { this.company = (event.currentTarget as InputElement).value; this.saved = false; }}></ds-input>
        </label>
        ${button(this.saving ? "Saving…" : "Save company name", undefined, { type: "submit", disabled: this.saving || !profile || !value.trim() || value === profile.companyName })}
        <span class="profile-status" role="status">${this.saved ? "Company name saved" : ""}</span>
      </form>
      ${this.error ? notice(this.error, { tone: "danger" }) : nothing}
      <div class="profile-session">${button(this.signingOut ? "Signing out…" : "Sign out", () => void this.#signOut(), { disabled: this.saving || this.signingOut })}</div>
    </main>`;
  }
}
defineElement("ds1-profile", Profile);
