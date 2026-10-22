// ds-number.ts
// Number field: a value one control high, scrubbed by its lead, stepped by the arrows, typed as arithmetic.

import { LitElement, html, nothing, unsafeCSS, type PropertyDeclarations, type PropertyValues } from "lit";
import { live } from "lit/directives/live.js";
import { define } from "../0-face/define";
import { formatNumberValue, readNumberExpression, stepPlaces } from "./number-expression";
import "./ds-icon";
import styles from "./styles/ds-number.css?inline";

/** How far the pointer moves before a press on the lead becomes a drag. */
const DRAG_THRESHOLD = 3;

/**
 * A number a person sets by hand, in the inspector's way: the value on the field's fill, one control
 * high on the sixteen and a whole number of squares wide (`width`, four by default). Its lead, a short
 * `label` or an `icon` in the title grey, is the handle: dragging it sideways scrubs the value a `step`
 * a pixel (Shift: `big-step`), and a double-click puts back `default`. The arrows step it, Shift by the
 * big step. What is typed is read as arithmetic (`10 + 5`, `(3 − 1) × 4`), and an operator first works
 * on the value already there (`*2`, `/2`, `+10`); Enter takes it, Escape puts the value back.
 *
 * `input` fires as a drag moves the value and `change` when a value is taken (the drag's end, Enter,
 * leaving the field, an arrow). `value` is a number; the field takes part in its form under `name`.
 */
export class NumberField extends LitElement {
  static formAssociated = true;
  static styles = unsafeCSS(styles);
  static properties: PropertyDeclarations = {
    value: { type: Number },
    min: { type: Number },
    max: { type: Number },
    step: { type: Number },
    bigStep: { type: Number, attribute: "big-step" },
    places: { type: Number },
    defaultValue: { type: Number, attribute: "default" },
    label: { type: String },
    icon: { type: String },
    unit: { type: String },
    width: { type: Number, reflect: true },
    name: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    readonly: { type: Boolean, reflect: true },
    ariaLabel: { type: String, attribute: "aria-label" },
    _text: { state: true },
    _editing: { state: true },
    _scrubbing: { state: true },
  };

  declare value: number;
  declare min: number | undefined;
  declare max: number | undefined;
  declare step: number;
  declare bigStep: number | undefined;
  declare places: number | undefined;
  declare defaultValue: number | undefined;
  declare label: string;
  declare icon: string;
  declare unit: string;
  declare width: number;
  declare name: string;
  declare disabled: boolean;
  declare readonly: boolean;
  declare ariaLabel: string | null;
  declare _text: string;
  declare _editing: boolean;
  declare _scrubbing: boolean;

  private internals = typeof this.attachInternals === "function" ? this.attachInternals() : null;
  private drag: { id: number; x: number; from: number; moved: boolean; rest: number } | null = null;

  constructor() {
    super();
    this.value = 0;
    this.step = 1;
    this.label = "";
    this.icon = "";
    this.unit = "";
    this.width = 4;
    this.name = "";
    this.disabled = false;
    this.readonly = false;
    this._text = "";
    this._editing = false;
    this._scrubbing = false;
  }

  /** The decimals the field keeps: `places`, or as many as `step` has. */
  get decimals(): number {
    return this.places ?? stepPlaces(this.step || 1);
  }

  focus(options?: FocusOptions) {
    this.input?.focus(options);
  }

  private get input(): HTMLInputElement | null {
    return this.renderRoot.querySelector("input");
  }

  private get locked(): boolean {
    return this.disabled || this.readonly;
  }

  /** Kept inside min and max, at the field's decimals. */
  private clamp(value: number): number {
    let next = value;
    if (this.min !== undefined && next < this.min) next = this.min;
    if (this.max !== undefined && next > this.max) next = this.max;
    const factor = 10 ** this.decimals;
    return Math.round(next * factor) / factor;
  }

  /** Steps from a value, exactly: 1.03 a step of 0.05 up is 1.08, as typed values keep their own figures. */
  private stepped(from: number, steps: number, size: number): number {
    return this.clamp(from + steps * (size || 1));
  }

  private emit(type: "input" | "change") {
    this.dispatchEvent(new Event(type, { bubbles: true, composed: true }));
  }

  /** Sets the value as a person did: `input` while it is still moving, `change` once it is taken. */
  private set(value: number, type: "input" | "change") {
    const next = this.clamp(value);
    if (next === this.value) return;
    this.value = next;
    this.emit(type);
  }

  private commitText() {
    const read = readNumberExpression(this._text, this.value);
    this._editing = false;
    if (read === null) return this.requestUpdate();
    const before = this.value;
    this.value = this.clamp(read);
    if (this.value !== before) this.emit("change");
  }

  private onFocus = () => {
    this._editing = true;
    this._text = this.written;
    void this.updateComplete.then(() => this.input?.select());
  };

  private onBlur = () => {
    if (this._editing) this.commitText();
  };

  private onKeydown = (event: KeyboardEvent) => {
    if (this.locked) return;
    if (event.key === "Enter") {
      event.preventDefault();
      this.commitText();
      this._editing = true;
      this._text = this.written;
      void this.updateComplete.then(() => this.input?.select());
    } else if (event.key === "Escape") {
      event.preventDefault();
      this._editing = false;
      this.input?.blur();
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const from = readNumberExpression(this._text, this.value) ?? this.value;
      const size = event.shiftKey ? (this.bigStep ?? this.step * 10) : this.step;
      this.set(this.stepped(from, event.key === "ArrowUp" ? 1 : -1, size), "change");
      this._text = this.written;
      void this.updateComplete.then(() => this.input?.select());
    }
  };

  private onText = (event: Event) => {
    event.stopPropagation();
    this._text = (event.target as HTMLInputElement).value;
  };

  private onLeadDown = (event: PointerEvent) => {
    if (this.locked || event.button !== 0) return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    if (this._editing) this.commitText();
    this.drag = { id: event.pointerId, x: event.clientX, from: this.value, moved: false, rest: 0 };
  };

  private onLeadMove = (event: PointerEvent) => {
    const drag = this.drag;
    if (!drag || drag.id !== event.pointerId) return;
    const travel = event.clientX - drag.x;
    if (!drag.moved && Math.abs(travel) < DRAG_THRESHOLD) return;
    if (!drag.moved) {
      drag.moved = true;
      this._scrubbing = true;
    }
    const size = event.shiftKey ? (this.bigStep ?? this.step * 10) : this.step;
    const pixels = event.clientX - drag.x + drag.rest;
    const steps = Math.trunc(pixels);
    drag.rest = pixels - steps;
    drag.x = event.clientX;
    if (steps) this.set(this.stepped(this.value, steps, size), "input");
  };

  private onLeadUp = (event: PointerEvent) => {
    const drag = this.drag;
    if (!drag || drag.id !== event.pointerId) return;
    this.drag = null;
    this._scrubbing = false;
    if (drag.moved && this.value !== drag.from) this.emit("change");
    else if (!drag.moved) this.focus();
  };

  private onLeadCancel = (event: PointerEvent) => {
    const drag = this.drag;
    if (!drag || drag.id !== event.pointerId) return;
    this.drag = null;
    this._scrubbing = false;
    if (this.value !== drag.from) this.set(drag.from, "input");
  };

  private onLeadDouble = () => {
    if (this.locked || this.defaultValue === undefined) return;
    if (this.value !== this.clamp(this.defaultValue)) this.set(this.defaultValue, "change");
  };

  /** Escape during a drag puts the value back where the drag began. */
  private onWindowKey = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !this.drag) return;
    const from = this.drag.from;
    this.drag = null;
    this._scrubbing = false;
    if (this.value !== from) this.set(from, "input");
  };

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("keydown", this.onWindowKey);
  }

  disconnectedCallback() {
    window.removeEventListener("keydown", this.onWindowKey);
    super.disconnectedCallback();
  }

  /** The value as the field writes it. */
  get written(): string {
    return formatNumberValue(Number.isFinite(this.value) ? this.value : 0, this.decimals);
  }

  protected willUpdate(changed: PropertyValues<this>) {
    if (changed.has("value") && typeof this.value === "string") this.value = Number(this.value);
  }

  protected updated(changed: PropertyValues<this>) {
    if (changed.has("width")) this.style.setProperty("--ds-number-squares", String(Math.max(1, Math.round(this.width || 4))));
    if (changed.has("value") || changed.has("disabled")) this.internals?.setFormValue(this.disabled ? null : String(this.value));
  }

  formResetCallback() {
    const initial = Number(this.getAttribute("value") ?? 0);
    this.value = Number.isFinite(initial) ? initial : 0;
  }

  render() {
    const lead = this.icon
      ? html`<ds-icon type=${this.icon} size="large"></ds-icon>`
      : this.label ? html`<span class="lead__words">${this.label}</span>` : nothing;
    const valueText = this.unit ? `${this.written} ${this.unit}` : this.written;
    return html`<span class=${this._scrubbing ? "face scrubbing" : "face"} part="face">
      ${lead === nothing ? nothing : html`<span
        class="lead"
        part="lead"
        aria-hidden="true"
        @pointerdown=${this.onLeadDown}
        @pointermove=${this.onLeadMove}
        @pointerup=${this.onLeadUp}
        @pointercancel=${this.onLeadCancel}
        @lostpointercapture=${this.onLeadCancel}
        @dblclick=${this.onLeadDouble}
      >${lead}</span>`}
      <input
        part="input"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        spellcheck="false"
        role="spinbutton"
        aria-label=${this.ariaLabel || this.label || nothing}
        aria-valuenow=${this.value}
        aria-valuemin=${this.min ?? nothing}
        aria-valuemax=${this.max ?? nothing}
        aria-valuetext=${valueText}
        .value=${live(this._editing ? this._text : this.written)}
        ?disabled=${this.disabled}
        ?readonly=${this.readonly}
        @focus=${this.onFocus}
        @blur=${this.onBlur}
        @keydown=${this.onKeydown}
        @input=${this.onText}
        @change=${(event: Event) => event.stopPropagation()}
      />
      ${this.unit ? html`<span class="unit" part="unit" aria-hidden="true">${this.unit}</span>` : nothing}
    </span>`;
  }
}

define("ds-number", NumberField);
declare global { interface HTMLElementTagNameMap { "ds-number": NumberField } }
