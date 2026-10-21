/**
 * Design system 1's elements as the app writes them again and again: a button
 * around its native control, a notice and an empty state with their slots, the
 * loading indicator. Each is DS1's own element; these only spare the markup.
 */
import { html, nothing, type TemplateResult } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import "../../../DS1/2-core/ds-button";
import type { SplitSegment } from "../../../DS1/2-core/ds-button";
import "../../../DS1/2-core/ds-empty";
import "../../../DS1/2-core/ds-icon";
import "../../../DS1/3-unit/ds-accordion";
import "../../../DS1/2-core/ds-notice";
import "../../../packages/app/src/2-core/ds-loading";

type Content = unknown;

export interface ButtonOptions {
  primary?: boolean;
  /** Secondary unless primary, as the app's buttons are. */
  secondary?: boolean;
  active?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  testid?: string;
  pressed?: boolean;
  expanded?: boolean;
  controls?: string;
  label?: string;
  id?: string;
  className?: string;
}

/** `ds-button` around a native button, as Design system 1's Button is written. */
export function button(content: Content, onClick?: (event: MouseEvent) => void, options: ButtonOptions = {}): TemplateResult {
  const { primary = false, secondary = !primary, active = false, disabled = false, type = "button" } = options;
  return html`<ds-button control="slotted" class=${ifDefined(options.className)} ?primary=${primary} ?secondary=${secondary} ?active=${active} ?disabled=${disabled}><button
    type=${type} id=${ifDefined(options.id)} ?disabled=${disabled} data-testid=${ifDefined(options.testid)}
    aria-pressed=${ifDefined(options.pressed === undefined ? undefined : String(options.pressed))}
    aria-expanded=${ifDefined(options.expanded === undefined ? undefined : String(options.expanded))}
    aria-controls=${ifDefined(options.controls)} aria-label=${ifDefined(options.label)}
    @click=${ifDefined(onClick)}>${content}</button></ds-button>`;
}

export interface NoticeOptions {
  tone?: "neutral" | "success" | "warning" | "danger";
  heading?: Content;
  actions?: Content;
  role?: string;
  testid?: string;
}

/** A notice: the words in the light DOM, its title and actions in their slots. */
export function notice(content: Content, options: NoticeOptions = {}): TemplateResult {
  const { tone, heading, actions } = options;
  return html`<ds-notice role=${options.role ?? (tone === "danger" ? "alert" : "status")} tone=${ifDefined(tone)} data-testid=${ifDefined(options.testid)}>${heading ? html`<span slot="heading">${heading}</span>` : nothing}${content}${actions ? html`<div slot="actions" style="display: contents">${actions}</div>` : nothing}</ds-notice>`;
}

export interface EmptyOptions {
  heading?: Content;
  icon?: string;
  level?: number;
  className?: string;
  testid?: string;
}

/** An empty place, centred, its title in the heading slot. */
export function empty(content: Content, options: EmptyOptions = {}): TemplateResult {
  return html`<ds-empty centered class=${ifDefined(options.className)} icon=${ifDefined(options.icon)} level=${ifDefined(options.level)} data-testid=${ifDefined(options.testid)}>${options.heading ? html`<span slot="heading">${options.heading}</span>` : nothing}${content}</ds-empty>`;
}

/** The busy indicator, named for what is under way. */
export function loading(label: string): TemplateResult {
  return html`<ds-loading label=${label}></ds-loading>`;
}

/**
 * Button's split mode: one group of segments, `value` the pressed one. The
 * element reports a choice as `change` (cancelled here, the app owns the value)
 * or, without a value, as `press`.
 */
export function splitButton<T extends string>(label: string, segments: ReadonlyArray<SplitSegment<T>>, value: T | undefined, onPress: (value: T) => void, className?: string): TemplateResult {
  const press = (event: Event) => {
    if (event.target !== event.currentTarget) return;
    if (event.type === "change") event.preventDefault();
    onPress((event as CustomEvent<{ value: T }>).detail.value);
  };
  return html`<ds-button split aria-label=${label} class=${ifDefined(className)} .split=${true} .segments=${segments} .value=${value ?? ""}
    .actions=${value === undefined} .disabled=${false} .compact=${false} .literal=${true} @change=${press} @press=${press}></ds-button>`;
}

let accordions = 0;
/** A fresh id for an accordion's details, as React's useId gave. */
export const accordionId = () => `ds1-accordion-${++accordions}`;

/**
 * Design system 1's accordion: its trigger a choice button with the chevron,
 * the details below. The app keeps whether it is open (`open`) and hears
 * `onOpenChange`.
 */
export function accordion(id: string, summary: Content, content: Content, open: boolean, onOpenChange: (open: boolean) => void, className?: string): TemplateResult {
  const toggle = (event: Event) => {
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    onOpenChange((event as CustomEvent<{ open: boolean }>).detail.open);
  };
  return html`<ds-accordion class=${ifDefined(className)} control="slotted" .open=${open} @ds-accordion-toggle=${toggle}><ds-button slot="trigger" control="slotted" choice><button
    type="button" aria-expanded=${String(open)} aria-controls=${id}>${summary}<ds-icon type="chevron-down" size="large" aria-hidden="true"
    style=${`margin-inline-start: auto; flex: 0 0 auto; color: var(--ds-title-color);${open ? " transform: rotate(180deg);" : ""}`}></ds-icon></button></ds-button><div slot="details" id=${id} ?hidden=${!open}>${content}</div></ds-accordion>`;
}
