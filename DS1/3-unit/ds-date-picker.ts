// ds-date-picker.ts
// A field that opens a small month below it: the field's face shows the date
// in the current language, the month opens half a square from it on the
// menu's frame (two squares a day where the screen has room, one on a narrow
// phone), and choosing a day closes it. A form takes the day as
// `YYYY-MM-DD`, as a native date field would send it.

import { LitElement, html, nothing, unsafeCSS, type PropertyValues } from "lit";
import { define } from "../0-face/define";
import { getText } from "../0-face/i18n";
import { formatDate, type DateLength } from "../0-face/format";
import { isDay, readDay, today as todayDay, type Day } from "../0-face/calendar";
import "../2-core/ds-icon";
import "./ds-calendar";
import type { Calendar, CalendarChangeDetail } from "./ds-calendar";
import metrics from "../1-root/component-metrics.css?inline";
import controls from "../1-root/controls.css?inline";
import styles from "./styles/ds-date-picker.css?inline";

/** Detail of `change` and `input`: the day chosen, empty when cleared. */
export interface DatePickerChangeDetail {
  value: Day;
  previous: Day;
}

const openPickers = new Set<DatePicker>();

/**
 * @element ds-date-picker
 * @prop {string} value - The chosen day, `YYYY-MM-DD`; empty for none.
 * @prop {string} name - The form field's name.
 * @prop {string} label - The field's accessible name: a translation key, or
 *   literal words.
 * @prop {boolean} literal - Show `label` and `placeholder` as written.
 * @prop {string} placeholder - The words before a day is chosen; the shared
 *   "Choose a date" by default.
 * @prop {string} length - How the date is written: `short`, `medium` (the
 *   default) or `long`.
 * @prop {string} min - The first day a person may choose.
 * @prop {string} max - The last day a person may choose.
 * @prop {string} weekStart - The week's first day (`week-start`); the
 *   language's own by default.
 * @prop {string} today - The day drawn as today; the reader's own by default.
 * @prop {boolean} required - A form needs a day; the Clear button is left out.
 * @prop {boolean} disabled - The field cannot be opened.
 * @prop {boolean} open - The month is open.
 *
 * @fires change - A person chose or cleared a day; `{ value, previous }`.
 * @fires input - The same moment, for code listening as to a field.
 * @fires ds-date-picker-toggle - The month opened or closed; `{ open }`.
 *
 * @example
 * <ds-date-picker label="Due" literal name="due" value="2026-10-18"></ds-date-picker>
 */
export class DatePicker extends LitElement {
  static formAssociated = true;

  static properties = {
    value: { type: String, reflect: true },
    name: { type: String, reflect: true },
    label: { type: String },
    literal: { type: Boolean, reflect: true },
    placeholder: { type: String },
    length: { type: String },
    min: { type: String },
    max: { type: String },
    weekStart: { type: String, attribute: "week-start" },
    today: { type: String },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    open: { type: Boolean, reflect: true },
  };

  static styles = [unsafeCSS(metrics), unsafeCSS(controls), unsafeCSS(styles)];

  declare value: string;
  declare name: string | undefined;
  declare label: string | undefined;
  declare literal: boolean;
  declare placeholder: string | undefined;
  declare length: DateLength | undefined;
  declare min: string | undefined;
  declare max: string | undefined;
  declare weekStart: string | undefined;
  declare today: string | undefined;
  declare required: boolean;
  declare disabled: boolean;
  declare open: boolean;

  private readonly internals = typeof this.attachInternals === "function" ? this.attachInternals() : null;
  /** The day the field started with, for a form's reset. */
  private initial = "";
  private shown = false;
  /** Whether opening should move focus into the month (a key opened it). */
  private focusMonth = false;
  private readonly relabel = () => this.requestUpdate();

  constructor() {
    super();
    this.value = "";
    this.literal = false;
    this.required = false;
    this.disabled = false;
    this.open = false;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("language-changed", this.relabel);
    window.addEventListener("translations-loaded", this.relabel);
  }

  disconnectedCallback() {
    window.removeEventListener("language-changed", this.relabel);
    window.removeEventListener("translations-loaded", this.relabel);
    this.hide(false);
    super.disconnectedCallback();
  }

  protected firstUpdated() {
    this.initial = this.value;
  }

  /** The form was reset: back to the day it started with. */
  formResetCallback() {
    this.value = this.initial;
  }

  formDisabledCallback(disabled: boolean) {
    this.disabled = disabled;
  }

  private words(value: string | undefined, fallback: string): string {
    if (value && this.literal) return value;
    return getText(value || fallback) || value || fallback;
  }

  private get trigger() {
    return this.renderRoot.querySelector<HTMLButtonElement>(".trigger");
  }

  private get frame() {
    return this.renderRoot.querySelector<HTMLElement>(".popover");
  }

  private get calendar() {
    return this.renderRoot.querySelector<Calendar>("ds-calendar");
  }

  protected willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("value") && this.value && !isDay(this.value)) this.value = "";
    if (changed.has("disabled") && this.disabled) this.open = false;
  }

  protected updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (changed.has("value") || changed.has("required")) {
      this.internals?.setFormValue(this.value || null);
      if (this.required && !this.value) this.internals?.setValidity({ valueMissing: true }, this.words(undefined, "Choose a date"), this.trigger ?? undefined);
      else this.internals?.setValidity({});
    }
    if (changed.has("open")) {
      if (this.open) this.show();
      else this.hide(changed.get("open") === true);
    }
  }

  /** Opens the month. */
  show() {
    if (this.shown || this.disabled || !this.isConnected) return;
    const popover = this.frame;
    if (!popover) return;
    for (const other of openPickers) if (other !== this) other.open = false;
    openPickers.add(this);
    this.shown = true;
    this.open = true;
    const calendar = this.calendar;
    if (calendar) calendar.month = (this.value || this.today || todayDay()).slice(0, 7);
    popover.showPopover?.();
    if (calendar) {
      // Two squares a day where the screen holds the month that wide (fifteen squares and its
      // margins), one square on a narrow phone.
      const unit = ((parseFloat(getComputedStyle(popover).paddingTop) || 9) + 1) * 2;
      const view = this.ownerDocument.defaultView!;
      calendar.dayWidth = (view.visualViewport?.width ?? view.innerWidth) >= 17 * unit ? 2 : 1;
      void calendar.updateComplete.then(this.place);
    }
    this.place();
    this.ownerDocument.addEventListener("pointerdown", this.onOutside, true);
    this.ownerDocument.addEventListener("scroll", this.place, true);
    window.addEventListener("resize", this.place);
    this.dispatchEvent(new CustomEvent("ds-date-picker-toggle", { bubbles: true, composed: true, detail: { open: true } }));
    if (this.focusMonth) void this.focusDay();
  }

  /** Closes the month, giving focus back to the field when it was inside. */
  hide(restore = true) {
    if (!this.shown) return;
    this.shown = false;
    openPickers.delete(this);
    const popover = this.frame;
    const within = popover?.matches(":focus-within");
    if (popover?.matches(":popover-open")) popover.hidePopover?.();
    this.ownerDocument.removeEventListener("pointerdown", this.onOutside, true);
    this.ownerDocument.removeEventListener("scroll", this.place, true);
    window.removeEventListener("resize", this.place);
    this.open = false;
    if (restore && within) this.trigger?.focus({ preventScroll: true });
    this.dispatchEvent(new CustomEvent("ds-date-picker-toggle", { bubbles: true, composed: true, detail: { open: false } }));
  }

  private async focusDay() {
    const calendar = this.calendar;
    if (!calendar) return;
    await calendar.updateComplete;
    calendar.renderRoot.querySelector<HTMLElement>('[data-day][tabindex="0"]')?.focus({ preventScroll: true });
  }

  /** Below the field, half a square from it, or above when there is more room there; held inside the screen. */
  private place = () => {
    const popover = this.frame, trigger = this.trigger;
    if (!this.shown || !popover || !trigger) return;
    const rect = trigger.getBoundingClientRect();
    const view = this.ownerDocument.defaultView!;
    const viewport = view.visualViewport;
    const left = viewport?.offsetLeft ?? 0, top = viewport?.offsetTop ?? 0;
    const width = viewport?.width ?? view.innerWidth, height = viewport?.height ?? view.innerHeight;
    const box = popover.getBoundingClientRect();
    const gap = box.width ? parseFloat(getComputedStyle(popover).getPropertyValue("--ds-date-picker-gap")) || 10 : 10;
    // The face is one control high at the foot of its square: measure from that square.
    const square = Math.max(rect.height, gap * 2);
    const foot = rect.bottom, head = rect.bottom - square;
    const below = top + height - foot - 2 * gap, above = head - top - 2 * gap;
    const up = below < box.height && above > below;
    const rtl = getComputedStyle(this).direction === "rtl";
    const x = rtl ? rect.right - box.width : rect.left;
    popover.style.left = `${Math.max(left + gap, Math.min(x, left + width - gap - box.width))}px`;
    popover.style.top = `${Math.max(top + gap, up ? head - gap - box.height : foot + gap)}px`;
  };

  private onOutside = (event: Event) => {
    if (!event.composedPath().includes(this)) this.open = false;
  };

  private toggle = () => {
    if (this.disabled) return;
    this.focusMonth = false;
    this.open = !this.open;
  };

  private onTriggerKey = (event: KeyboardEvent) => {
    if (this.disabled) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || ((event.key === "Enter" || event.key === " ") && !this.open)) {
      event.preventDefault();
      this.focusMonth = true;
      if (this.open) void this.focusDay();
      else this.open = true;
    }
  };

  private onPopoverKey = (event: KeyboardEvent) => {
    if (event.key === "Escape" && !event.defaultPrevented) {
      event.preventDefault();
      event.stopPropagation();
      this.open = false;
    }
  };

  private onFocusOut = (event: FocusEvent) => {
    const next = event.relatedTarget;
    if (this.open && next instanceof Node && !this.contains(next) && !this.renderRoot.contains(next)) this.open = false;
  };

  /** Takes a day (or none), says so, and closes. */
  private choose(value: Day) {
    const previous = (this.value || "") as Day;
    this.open = false;
    if (value === previous) return;
    this.value = value;
    const detail: DatePickerChangeDetail = { value, previous };
    this.dispatchEvent(new CustomEvent("input", { bubbles: true, composed: true, detail }));
    this.dispatchEvent(new CustomEvent("change", { bubbles: true, composed: true, detail }));
  }

  private picked = (event: CustomEvent<CalendarChangeDetail>) => {
    event.stopPropagation();
    this.choose(event.detail.value);
  };

  private pressedChosen = (event: CustomEvent<{ day: Day }>) => {
    // Pressing the chosen day again closes the month as choosing it did.
    if (event.detail.day === this.value) this.open = false;
  };

  private chooseToday = () => {
    const day = this.today && isDay(this.today) ? this.today : todayDay();
    if ((this.min && isDay(this.min) && day < this.min) || (this.max && isDay(this.max) && day > this.max)) return;
    this.choose(day);
  };

  render() {
    const value = this.value && readDay(this.value) ? this.value : "";
    const text = value ? formatDate(value, this.length ?? "medium") : this.words(this.placeholder, "Choose a date");
    const name = this.label ? this.words(this.label, this.label) : this.words(undefined, "Date");
    const day = this.today && isDay(this.today) ? this.today : todayDay();
    const todayAllowed = !((this.min && isDay(this.min) && day < this.min) || (this.max && isDay(this.max) && day > this.max));
    return html`<button
        class="ds-select trigger"
        part="trigger"
        type="button"
        aria-haspopup="dialog"
        aria-expanded=${String(this.open)}
        aria-label=${value ? `${name}, ${text}` : name}
        ?disabled=${this.disabled}
        ?data-empty=${!value}
        @click=${this.toggle}
        @keydown=${this.onTriggerKey}
      >
        <ds-icon class="icon" type="calendar" aria-hidden="true"></ds-icon>
        <span class="text">${text}</span>
        <ds-icon class="arrow" type="down" aria-hidden="true"></ds-icon>
      </button>
      <div
        class="popover"
        part="popover"
        popover="manual"
        role="dialog"
        aria-label=${name}
        @keydown=${this.onPopoverKey}
        @focusout=${this.onFocusOut}
      >
        <ds-calendar
          compact
          selectable
          fixed
          no-today
          .value=${value}
          .min=${this.min}
          .max=${this.max}
          .weekStart=${this.weekStart}
          .today=${this.today}
          @change=${this.picked}
          @day-press=${this.pressedChosen}
        ></ds-calendar>
        <div class="footer" part="footer">
          <button class="ds-button ds-button--secondary" type="button" ?disabled=${!todayAllowed} @click=${this.chooseToday}>${this.words(undefined, "Today")}</button>
          ${this.required || !value ? nothing : html`<button class="ds-button ds-button--secondary" type="button" @click=${() => this.choose("")}>${this.words(undefined, "Clear")}</button>`}
        </div>
      </div>`;
  }
}

define("ds-date-picker", DatePicker);

declare global {
  interface HTMLElementTagNameMap {
    "ds-date-picker": DatePicker;
  }
}
