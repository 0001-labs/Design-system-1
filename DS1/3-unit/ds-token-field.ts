import { LitElement, html, unsafeCSS } from "lit";
import { define } from "../0-face/define";
import { Menu } from "./ds-menu";
import { Token } from "../2-core/ds-token";
import styles from "./styles/ds-token-field.css?inline";

let nextId = 0;
export type TokenCommit = { text: string; reason: "enter" | "separator" | "input" | "blur" };
/** Native field and ARIA targets stay together in light DOM. This component
 * owns chip layout, editing gestures and suggestion navigation through its Select (`ds-select slot="suggestions"`). */
export class TokenField extends LitElement {
  static formAssociated = true;
  static properties = {
    separators: { type: String }, chooseLabel: { type: String, attribute: "choose-label" },
    expanded: { state: true }, blocked: { state: true },
  };
  static styles = unsafeCSS(styles);
  declare separators: string; declare chooseLabel: string;
  private declare expanded: boolean; private declare blocked: boolean;
  private fieldsetDisabled = false;
  private control: HTMLInputElement | null = null;
  private menu: Menu | null = null;
  private savedAttributes = new Map<string, string | null>();
  private activeId = "";
  private optionId = 0;
  private idPrefix = `ds-token-field-${++nextId}`;
  private mutations = new MutationObserver(() => this.refresh());
  constructor() {
    super(); this.attachInternals?.(); this.separators = ",;"; this.chooseLabel = ""; this.expanded = false; this.blocked = false;
    this.addEventListener("focusin", event => { if (event.target === this.control) this.setOpen(true); });
    this.addEventListener("focusout", this.onBlur);
    this.addEventListener("keydown", this.onKey);
    this.addEventListener("input", this.onInput);
    this.addEventListener("ds-menu-active", this.onActive);
    this.addEventListener("ds-menu-close", this.onClose);
    this.addEventListener("ds-menu-toggle", this.onToggle);
    this.addEventListener("ds-token-remove", this.onRemove);
    this.addEventListener("click", event => {
      if (event.composedPath().some(node => node instanceof HTMLElement && node.getAttribute("role") === "option")) this.focus();
    });
  }
  connectedCallback() { super.connectedCallback(); this.refresh(); }
  disconnectedCallback() { this.mutations.disconnect(); this.release(); super.disconnectedCallback(); }
  formDisabledCallback(disabled: boolean) { this.fieldsetDisabled = disabled; this.refresh(); }
  private release() {
    if (this.menu) { this.menu.open = false; this.menu.controller = null; this.menu.trigger = null; this.menu.anchor = null; }
    for (const [name, value] of this.savedAttributes) {
      if (value === null) this.control?.removeAttribute(name); else this.control?.setAttribute(name, value);
    }
    this.savedAttributes.clear(); this.control = null; this.menu = null; this.expanded = false;
  }
  /** Also called by the React binding after controlled values/options settle. */
  refresh() {
    if (!this.isConnected) return;
    const input = Array.from(this.children).find(child => child.localName === "input") as HTMLInputElement | undefined ?? null;
    const menu = Array.from(this.children).find(child => child instanceof Menu) as Menu | undefined ?? null;
    if (this.control !== input || this.menu !== menu) {
      this.release(); this.control = input; this.menu = menu; this.requestUpdate();
      for (const name of ["role", "aria-autocomplete", "aria-expanded", "aria-controls", "aria-activedescendant", "slot"]) this.savedAttributes.set(name, input?.getAttribute(name) ?? null);
    }
    this.mutations.disconnect();
    this.mutations.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "readonly", "hidden", "inert", "aria-disabled"] });
    if (input) input.slot = "input";
    this.blocked = this.fieldsetDisabled || !input || input.matches(":disabled") || input.readOnly;
    if (this.blocked) this.expanded = false;
    for (const token of this.tokens()) token.fieldDisabled = this.blocked;
    if (input && menu) {
      if (!menu.id) menu.id = `${this.idPrefix}-options`;
      menu.slot = "suggestions";
      menu.floating = true; menu.anchor = this; menu.controller = input;
      menu.trigger = this.shadowRoot?.querySelector<HTMLButtonElement>("button") ?? null;
      menu.open = this.expanded;
      const choices = Array.from(menu.querySelectorAll<HTMLElement>('[role="option"]')).filter(option => option.closest("ds-menu, ds-select") === menu);
      const options = choices.filter(option => !option.matches(':disabled, [disabled], [aria-disabled="true"]') && !option.closest("[hidden], [inert]"));
      for (const option of options) { if (!option.id) option.id = `${this.idPrefix}-option-${++this.optionId}`; option.tabIndex = -1; }
      if (!options.some(option => option.id === this.activeId)) this.activeId = options[0]?.id ?? "";
      for (const option of choices) option.setAttribute("aria-selected", String(option.id === this.activeId));
      menu.activeId = this.activeId;
      input.setAttribute("role", "combobox"); input.setAttribute("aria-autocomplete", "list");
      input.setAttribute("aria-expanded", String(this.expanded));
      input.setAttribute("aria-controls", menu.id);
      if (this.expanded && this.activeId) input.setAttribute("aria-activedescendant", this.activeId); else input.removeAttribute("aria-activedescendant");
    }
  }
  updated() { this.refresh(); }
  private tokens() { return Array.from(this.children).filter(child => child instanceof Token) as Token[]; }
  private setOpen(open: boolean) { this.expanded = Boolean(open && this.menu && !this.blocked); this.refresh(); }
  private commit(reason: TokenCommit["reason"], text = this.control?.value ?? "") {
    if (!this.blocked && text.trim()) this.dispatchEvent(new CustomEvent<TokenCommit>("ds-token-commit", {detail: {text, reason}, bubbles: true, composed: true, cancelable: true}));
  }
  private onInput = (event: Event) => {
    if (event.target !== this.control || this.blocked || (event as InputEvent).isComposing) return;
    this.activeId = ""; this.setOpen(true);
    const text = this.control!.value, control = this.control;
    if ([...this.separators].some(separator => text.includes(separator))) queueMicrotask(() => {
      if (this.isConnected && this.control === control && control!.value === text && !event.defaultPrevented) this.commit("input", text);
    });
  };
  private onKey = (event: KeyboardEvent) => {
    if (event.target !== this.control || this.blocked || event.defaultPrevented || event.isComposing || event.keyCode === 229 || event.altKey || event.metaKey || event.ctrlKey) return;
    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && !this.expanded && this.menu) { event.preventDefault(); this.setOpen(true); }
    else if (event.key === "Enter" || this.separators.includes(event.key) && event.key.length === 1) {
      event.preventDefault(); this.commit(event.key === "Enter" ? "enter" : "separator");
    } else if (event.key === "Backspace" && !this.control!.value) {
      const token = this.tokens().at(-1);
      if (token?.removeLabel && !token.blocked) { event.preventDefault(); token.requestRemove(); }
    }
  };
  private onBlur = (event: FocusEvent) => {
    if (event.relatedTarget instanceof Node && (this.contains(event.relatedTarget) || this.shadowRoot?.contains(event.relatedTarget))) return;
    this.setOpen(false); this.commit("blur");
  };
  private onActive = (event: Event) => { if (event.target !== this.menu) return; this.activeId = (event as CustomEvent<{id: string}>).detail.id; this.refresh(); };
  private onClose = (event: Event) => { if (event.target === this.menu) this.setOpen(false); };
  private onToggle = (event: Event) => {
    if (event.target !== this.menu) return;
    event.preventDefault(); const open = (event as CustomEvent<{open: boolean}>).detail.open;
    this.focus(); this.setOpen(open);
  };
  private onRemove = () => { queueMicrotask(() => { if (this.isConnected && !this.blocked) this.focus(); }); };
  focus(options?: FocusOptions) { if (!this.blocked) this.control?.focus(options); }
  render() {
    return html`<div class="frame" part="frame"><slot @slotchange=${this.refresh}></slot><div class="entry"><slot name="input" @slotchange=${this.refresh}></slot>${this.menu && this.chooseLabel ? html`<ds-button control="slotted" icon .disabled=${this.blocked}><button type="button" aria-label=${this.chooseLabel} ?disabled=${this.blocked}><ds-icon type="down"></ds-icon></button></ds-button>` : null}</div></div><slot name="suggestions" @slotchange=${this.refresh}></slot>`;
  }
}
define("ds-token-field", TokenField);
declare global { interface HTMLElementTagNameMap { "ds-token-field": TokenField } }
