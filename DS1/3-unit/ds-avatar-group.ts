import { LitElement, html, unsafeCSS } from "lit";
import { define } from "../0-face/define";
import styles from "./styles/ds-avatar-group.css?inline";

/** Overlapping identity marks. The app chooses people, overflow and actions. */
export class AvatarGroup extends LitElement {
  static properties = {
    size: { type: String, reflect: true },
    vertical: { type: Boolean, reflect: true },
    hasLead: { state: true },
    hasMembers: { state: true },
  };
  declare size: "default" | "compact";
  declare vertical: boolean;
  declare private hasLead: boolean;
  declare private hasMembers: boolean;
  static styles = unsafeCSS(styles);
  private static owners = new WeakMap<HTMLElement, AvatarGroup>();
  private owned = new Map<HTMLElement, Map<string, [string, string]>>();
  private observer = new MutationObserver(() => this.arrange());
  constructor() {
    super();
    this.size = "default";
    this.hasLead = false;
    this.hasMembers = false;
    this.vertical = false;
  }
  connectedCallback() {
    super.connectedCallback();
    this.observer.observe(this, {
      childList: true,
      attributes: true,
      subtree: true,
      attributeFilter: ["hidden", "slot"],
    });
    void this.updateComplete.then(() => {
      if (this.isConnected) this.arrange();
    });
  }
  disconnectedCallback() {
    this.observer.disconnect();
    for (const element of this.owned.keys()) this.release(element);
    super.disconnectedCallback();
  }
  private release(element: HTMLElement) {
    for (const [name, [value, priority]] of this.owned.get(element) ?? []) {
      if (value) element.style.setProperty(name, value, priority);
      else element.style.removeProperty(name);
    }
    this.owned.delete(element);
    AvatarGroup.owners.delete(element);
  }
  private arrange = () => {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>("slot:not([name])");
    const members = (slot?.assignedElements() ?? []).filter(
      (element): element is HTMLElement => element instanceof HTMLElement && !element.hidden,
    );
    this.hasMembers = members.length > 0;
    for (const element of this.owned.keys()) if (!members.includes(element)) this.release(element);
    members.forEach((element, index) => {
      const previous = AvatarGroup.owners.get(element);
      if (previous && previous !== this) previous.release(element);
      if (!this.owned.has(element))
        this.owned.set(
          element,
          new Map(
            ["--ds-avatar-group-order", "--ds-avatar-group-inset"].map((name) => [
              name,
              [element.style.getPropertyValue(name), element.style.getPropertyPriority(name)],
            ]),
          ),
        );
      AvatarGroup.owners.set(element, this);
      element.style.setProperty("--ds-avatar-group-order", String(members.length - index));
      element.style.setProperty(
        "--ds-avatar-group-inset",
        index ? "calc(-1 * var(--group-overlap))" : "0px",
      );
    });
    this.hasLead = Boolean(
      this.shadowRoot
        ?.querySelector<HTMLSlotElement>('slot[name="lead"]')
        ?.assignedElements()
        .some((element) => !(element instanceof HTMLElement) || !element.hidden),
    );
  };
  render() {
    return html`<slot name="lead" @slotchange=${this.arrange}></slot
      ><span class=${this.hasLead && this.hasMembers ? "members separated" : "members"}
        ><slot @slotchange=${this.arrange}></slot
      ></span>`;
  }
}
define("ds-avatar-group", AvatarGroup);
declare global {
  interface HTMLElementTagNameMap {
    "ds-avatar-group": AvatarGroup;
  }
}
