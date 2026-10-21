import { html } from "lit";
import "../../../../DS1/0-face/tooltips";
import "../../../../DS1/1-root/controls.css";
import "../../../../DS1/2-core/ds-checkbox";
import "../../../../DS1/2-core/ds-color";
import "../../../../DS1/2-core/ds-file-picker";
import "../../../../DS1/2-core/ds-input";
import "../../../../DS1/2-core/ds-swatch";
import "../../../../DS1/3-unit/ds-select";
import "../../../../DS1/3-unit/ds-tabs";
import { authState } from "../../lib/backend";
import { AppElement, defineElement } from "../../lib/element";
import { button, loading, notice } from "../../lib/ui";
import { OwnerSession } from "../AdoptionDashboard";
import "../SignIn";
import { builderMarkup } from "./markup";
import "./icon-builder.css";

/** The badge and favicon builder, for the owner alone on icon.designsystem1.com. */
export class IconBuilder extends AppElement {
  #session = new OwnerSession(this, "Icon builder · Design system 1");

  override render() {
    const { isLoading, isAuthenticated } = authState.get();
    const { ready, error, leave } = this.#session;
    if (isLoading) return html`<main class="icon-builder-status">${loading("Checking your session")}</main>`;
    if (!isAuthenticated) return html`<div class="app-shell"><ds1-sign-in private-title="Icon builder" .redirectTo=${"/"}></ds1-sign-in></div>`;
    if (error) return html`<main class="icon-builder-status">${notice(error, { tone: "danger", actions: button("Sign out", () => void leave()) })}</main>`;
    if (!ready) return html`<main class="icon-builder-status">${loading("Checking access")}</main>`;
    return html`<ds1-icon-studio .signOut=${leave}></ds1-icon-studio>`;
  }
}
defineElement("ds1-icon-builder", IconBuilder);

/** The builder itself: its markup, wired by the editor module as it loads, once per page. */
export class IconStudio extends AppElement {
  static properties = { signOut: { attribute: false } };
  declare signOut: () => Promise<void>;

  constructor() {
    super();
    this.signOut = async () => {};
  }

  override firstUpdated() {
    const host = this.querySelector<HTMLElement>("[data-builder]")!;
    host.innerHTML = builderMarkup();
    void import("./editor");
  }

  override render() {
    return html`<main class="icon-builder">
      <header class="icon-builder-bar"><h1 class="ds-text ds-text--heading">Icon builder</h1>${button("Sign out", () => void this.signOut(), { secondary: false })}</header>
      <div data-builder></div>
    </main>`;
  }
}
defineElement("ds1-icon-studio", IconStudio);
