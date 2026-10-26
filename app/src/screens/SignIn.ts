import { html, nothing } from "lit";
import { api } from "../../../convex/_generated/api";
import { query, signIn } from "../lib/backend";
import { AppElement, defineElement } from "../lib/element";
import { follow, href, navigate } from "../router";
import { signInAdapter } from "../signIn/adapter";
import { defineSignInScreen, type SignInScreen as SignInScreenElement } from "../signIn/sign-in";
import "../signIn/sign-in.css";

/**
 * The shared sign-in screen (app/src/signIn, copied from Sign-in): the email, then the code
 * sent to it or the owner's password, with Google and Apple when the backend has them.
 * Signed in, the app goes where the person was headed (`redirectTo`).
 */
export class SignIn extends AppElement {
  static properties = {
    redirectTo: { attribute: false },
    fontsOnly: { type: Boolean, attribute: "fonts-only" },
    dashboardOnly: { type: Boolean, attribute: "dashboard-only" },
    privateTitle: { type: String, attribute: "private-title" },
    anyone: { type: Boolean },
    brand: { type: String },
  };
  declare redirectTo: string | undefined;
  declare fontsOnly: boolean;
  declare dashboardOnly: boolean;
  declare privateTitle: string | undefined;
  /** A private product's sign-in open to every address, by the emailed code alone: Consistency's invited people. */
  declare anyone: boolean;
  /** Which of the backend's brands the emailed code goes out under (`convex/auth.ts`), for another product's sign-in. */
  declare brand: string | undefined;
  #screen: SignInScreenElement | null = null;
  #mounted: string | null = null;

  constructor() {
    super();
    this.redirectTo = undefined;
    this.fontsOnly = false;
    this.dashboardOnly = false;
    this.privateTitle = undefined;
    this.anyone = false;
    this.brand = undefined;
  }

  /** A private host takes the owner's email alone, without Google or Apple. */
  #ownerOnly() {
    return this.fontsOnly || this.dashboardOnly || (Boolean(this.privateTitle) && !this.anyone);
  }

  override updated() {
    const settings = JSON.stringify([this.redirectTo, this.fontsOnly, this.dashboardOnly, this.privateTitle, this.anyone, this.brand]);
    if (settings === this.#mounted && this.#screen?.isConnected) return;
    this.#mounted = settings;
    this.#screen?.remove();
    const host = this.querySelector<HTMLElement>("[data-sign-in-host]")!;
    defineSignInScreen();
    const ownerOnly = this.#ownerOnly();
    const codeOnly = ownerOnly || this.anyone;
    const { privateTitle, dashboardOnly, redirectTo } = this;
    const screen = document.createElement("sign-in-screen") as SignInScreenElement;
    screen.adapter = signInAdapter({
      signIn: (provider, params) => {
        if (ownerOnly && (typeof params.email !== "string" || params.email.trim().toLowerCase() !== "jaa90@icloud.com")) throw new Error(privateTitle ? `${privateTitle} is private.` : dashboardOnly ? "This dashboard is private." : "This font workspace is private.");
        return signIn(provider, params);
      },
      providers: async () => {
        const available = await query(api.auth.providers, {});
        return codeOnly ? { ...available, google: false, apple: false } : available;
      },
      passwordSignIn: email => query(api.auth.passwordSignIn, { email }),
      redirectTo: () => `${window.location.origin}${window.location.pathname}`,
      brand: this.brand,
    });
    screen.addEventListener("signed-in", () => {
      navigate(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/libraries", { replace: true });
    });
    host.replaceChildren(screen);
    this.#screen = screen;
  }

  override disconnectedCallback() {
    this.#screen?.remove();
    this.#screen = null;
    super.disconnectedCallback();
  }

  override connectedCallback() {
    super.connectedCallback();
    if (this.hasUpdated) this.requestUpdate();
  }

  override render() {
    const { privateTitle, fontsOnly, dashboardOnly, redirectTo } = this;
    return html`<main class="auth-screen" data-ds-area="Sign in" data-testid="signin">
      <h1>${privateTitle ?? (fontsOnly ? "Fonts" : dashboardOnly ? "Component adoption" : "Sign in to Design system 1")}</h1>
      <p class="auth-intro">${privateTitle ? `Sign in to your private ${privateTitle.toLowerCase()}.` : fontsOnly ? "Sign in to your private font workspace." : redirectTo === "/reports/components"
        ? "Sign in with an authorised account to view component reports."
        : "Save, edit and publish your design libraries."}</p>
      <div data-sign-in-host></div>
      ${this.#ownerOnly() ? nothing : html`<div class="auth-alternative">
        <p>Just exploring? No account needed.</p>
        <a href=${href("/playground")} @click=${follow("/playground")}>Try the editor</a>
      </div>`}
    </main>`;
  }
}
defineElement("ds1-sign-in", SignIn);
