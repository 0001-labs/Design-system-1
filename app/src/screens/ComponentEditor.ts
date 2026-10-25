import { html, nothing, type TemplateResult } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { styleMap } from "lit/directives/style-map.js";
import "../../../DS1/2-core/ds-button";
import "../../../DS1/2-core/ds-checkbox";
import "../../../DS1/2-core/ds-icon";
import "../../../DS1/2-core/ds-input";
import "../../../DS1/2-core/ds-number";
import type { NumberField } from "../../../DS1/2-core/ds-number";
import "../../../DS1/2-core/ds-switch";
import "../../../DS1/2-core/ds-tag";
import "../../../DS1/3-unit/ds-select";
import "../../../DS1/3-unit/ds-sidebar";
import type { SidebarItem } from "../../../DS1/3-unit/ds-sidebar";
import "../../../DS1/3-unit/ds-tabs";
import "../../../DS1/4-page/ds-grid";
import { COLOURS, COMPONENTS, SQUARE, TEXT_SIZES, componentSpec, readLength, readWidth, tokenValue, type ComponentProperty, type ComponentSpec, type WidthMode } from "../component-specs";
import { BaseDraft } from "../lib/baseDraft";
import { AppElement, defineElement } from "../lib/element";
import { accordion, accordionId, loading } from "../lib/ui";
import { currentLocation, href, navigate } from "../router";
import { draftHistory, draftNotices } from "./BaseEditor";
import "./component-editor.css";

type Specimen = { name: string; render: () => TemplateResult };

/** Each component in the states a person meets it in, as its documentation draws it. */
const SPECIMENS: Record<string, Specimen[]> = {
  button: [
    { name: "Primary", render: () => html`<ds-button primary>Save changes</ds-button>` },
    { name: "Secondary", render: () => html`<ds-button secondary>Cancel</ds-button>` },
    { name: "Text", render: () => html`<ds-button>Text button</ds-button>` },
    { name: "With an icon", render: () => html`<ds-button primary><ds-icon type="check"></ds-icon> Save</ds-button>` },
    { name: "Disabled", render: () => html`<ds-button primary disabled>Disabled</ds-button>` },
  ],
  input: [
    { name: "Empty", render: () => html`<ds-input variant="field" aria-label="Your name" placeholder="Enter your name"></ds-input>` },
    { name: "Filled", render: () => html`<ds-input variant="field" aria-label="Email" value="hello@example.com"></ds-input>` },
    { name: "Disabled", render: () => html`<ds-input variant="field" aria-label="Unavailable" value="Read only" disabled></ds-input>` },
  ],
  checkbox: [
    { name: "Off", render: () => html`<ds-checkbox><input type="checkbox" aria-label="Updates"></ds-checkbox>` },
    { name: "Ticked", render: () => html`<ds-checkbox><input type="checkbox" aria-label="News" checked></ds-checkbox>` },
    { name: "Mixed", render: () => html`<ds-checkbox><input type="checkbox" aria-label="Some" .indeterminate=${true}></ds-checkbox>` },
    { name: "Disabled", render: () => html`<ds-checkbox><input type="checkbox" aria-label="Unavailable" disabled></ds-checkbox>` },
  ],
  switch: [
    { name: "On", render: () => html`<ds-switch><button type="button" role="switch" aria-label="Notifications" aria-checked="true"></button></ds-switch>` },
    { name: "Off", render: () => html`<ds-switch><button type="button" role="switch" aria-label="Sharing" aria-checked="false"></button></ds-switch>` },
    { name: "Disabled", render: () => html`<ds-switch><button type="button" role="switch" aria-label="Unavailable" aria-checked="false" disabled></button></ds-switch>` },
  ],
  tag: [
    { name: "Short", render: () => html`<ds-tag>App</ds-tag>` },
    { name: "Longer words", render: () => html`<ds-tag>Waiting for review</ds-tag>` },
  ],
};

const GROUPS = ["Layout", "Shape", "Text", "Colour"] as const;
const WIDTH_LABELS: Record<WidthMode, string> = { hug: "Hug", fill: "Fill", fixed: "Fixed" };

/**
 * The base system's components on a canvas, edited by their own tokens: the components down the
 * side as the documentation lists them, the chosen one's states on the grid, and its properties
 * beside it in whole squares, as a design tool sets them. Every edit goes into the draft
 * (`lib/baseDraft.ts`), which makes it live after a pause; the canvas shows the draft at once.
 * The code stays behind the CSS disclosure. Every token of the base is still at `?view=tokens`.
 */
export class ComponentEditor extends AppElement {
  static override box = true;
  static properties = {
    selected: { state: true },
    cssOpen: { state: true },
    collapsed: { state: true },
    measure: { state: true },
  };
  declare selected: number;
  declare cssOpen: boolean;
  declare collapsed: boolean;
  declare measure: { width: number; height: number; left: number; top: number } | null;
  readonly draft = new BaseDraft(this);
  #component = "";
  #cssId = accordionId();
  #observer: ResizeObserver | null = null;
  #frame = 0;

  constructor() {
    super();
    this.selected = 0;
    this.cssOpen = false;
    this.collapsed = false;
    this.measure = null;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add("component-editor");
    this.dataset.testid = "component-editor";
    if (typeof ResizeObserver !== "undefined") this.#observer = new ResizeObserver(() => this.#scheduleMeasure());
  }

  override disconnectedCallback() {
    this.#observer?.disconnect();
    cancelAnimationFrame(this.#frame);
    super.disconnectedCallback();
  }

  override willUpdate() {
    // A newly opened component starts on its first state.
    const id = componentSpec(currentLocation.get().search.get("component")).id;
    if (id !== this.#component) { this.#component = id; this.selected = 0; }
  }

  override updated() {
    const canvas = this.querySelector(".component-editor-canvas");
    if (canvas) this.#observer?.observe(canvas);
    this.#scheduleMeasure();
  }

  #scheduleMeasure() {
    cancelAnimationFrame(this.#frame);
    this.#frame = requestAnimationFrame(() => this.#measure());
  }

  /** The selected specimen's box, read from the component as drawn, for the selection and its numbers. */
  #measure() {
    const frame = this.querySelector<HTMLElement>(".component-editor-specimen[aria-selected='true']");
    const target = frame?.querySelector<HTMLElement>(".component-editor-specimen-body > *");
    if (!frame || !target) { if (this.measure) this.measure = null; return; }
    const outer = frame.getBoundingClientRect();
    const box = target.getBoundingClientRect();
    const next = { width: Math.round(box.width), height: Math.round(box.height), left: Math.round(box.left - outer.left), top: Math.round(box.top - outer.top) };
    const current = this.measure;
    if (!current || current.width !== next.width || current.height !== next.height || current.left !== next.left || current.top !== next.top) this.measure = next;
  }

  #link(query: Record<string, string>) {
    const search = new URLSearchParams(currentLocation.get().search);
    for (const key of ["component", "view"]) search.delete(key);
    for (const [key, value] of Object.entries(query)) search.set(key, value);
    return `/base${search.size ? `?${search}` : ""}`;
  }

  #navigation(spec: ComponentSpec, view: string | null): TemplateResult {
    const items: SidebarItem[] = [
      { id: "components", label: "Components", depth: 0, expanded: !this.collapsed },
      ...(this.collapsed ? [] : COMPONENTS.map(component => ({ id: `component:${component.id}`, label: component.name, depth: 1, href: href(this.#link({ component: component.id })), current: !view && component.id === spec.id }))),
      { id: "history", label: "History", depth: 0, href: href(this.#link({ view: "history" })), current: view === "history" },
      { id: "tokens", label: "All tokens", depth: 0, href: href(this.#link({ view: "tokens" })) },
    ];
    const activate = (event: CustomEvent<{ id: string }>) => {
      const id = event.detail.id;
      const to = id === "history" ? this.#link({ view: "history" }) : id === "tokens" ? this.#link({ view: "tokens" }) : id.startsWith("component:") ? this.#link({ component: id.slice("component:".length) }) : null;
      if (!to) return;
      event.preventDefault();
      navigate(to);
    };
    return html`<aside class="component-editor-navigation" data-ds-area="Components">
      <ds-sidebar label="Design system 1" disclosure-position="start" expand-icon="chevron-down" collapse-icon="chevron-up" .items=${items}
        @sidebar-activate=${activate}
        @sidebar-toggle=${(event: CustomEvent<{ id: string; expanded: boolean }>) => { if (event.detail.id === "components") this.collapsed = !event.detail.expanded; }}></ds-sidebar>
    </aside>`;
  }

  #canvas(spec: ComponentSpec): TemplateResult {
    const specimens = SPECIMENS[spec.id] ?? [];
    const selected = Math.min(this.selected, specimens.length - 1);
    const overrides = Object.fromEntries(this.draft.overrides);
    const select = (index: number) => { this.selected = index; };
    const keys = (event: KeyboardEvent) => {
      const step = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 0;
      if (!step) return;
      event.preventDefault();
      this.selected = (selected + step + specimens.length) % specimens.length;
      void this.updateComplete.then(() => this.querySelector<HTMLElement>(".component-editor-specimen[aria-selected='true']")?.focus());
    };
    const measure = this.measure;
    return html`<div class="component-editor-canvas" data-testid="component-canvas" style=${styleMap(overrides)}>
      <ds-grid contained></ds-grid>
      <div class="component-editor-specimens" role="listbox" aria-label=${`${spec.name} states`} @keydown=${keys}>
        ${specimens.map((specimen, index) => html`<div class="component-editor-specimen" role="option" aria-selected=${String(index === selected)} tabindex=${index === selected ? 0 : -1}
          @click=${() => select(index)}>
          <span class="component-editor-specimen-name">${specimen.name}</span>
          ${index === selected && measure ? html`<span class="component-editor-selection" aria-hidden="true"
            style=${styleMap({ width: `${measure.width}px`, height: `${measure.height}px`, transform: `translate(${measure.left}px, ${measure.top}px)` })}></span>` : nothing}
          <div class="component-editor-specimen-body" inert>${specimen.render()}</div>
          ${index === selected && measure ? html`<span class="component-editor-size" data-testid="component-size">${measure.width} × ${measure.height}</span>` : nothing}
        </div>`)}
      </div>
    </div>`;
  }

  #edit(property: ComponentProperty, value: string) {
    if (value) this.draft.edit(property.token, value);
    else this.draft.remove(property.token);
  }

  #reset(property: ComponentProperty) {
    return this.draft.value(property.token) === undefined ? nothing
      : html`<ds-button icon class="component-editor-reset" aria-label=${`Reset ${property.label.toLowerCase()}`} data-testid=${`reset${property.token}`}
        @click=${() => this.draft.remove(property.token)}><ds-icon type="undo"></ds-icon></ds-button>`;
  }

  #number(property: ComponentProperty, value: number, options: { step: number; bigStep: number; min: number; max: number; default: number }, onValue: (value: number) => void) {
    const take = (event: Event) => onValue((event.currentTarget as NumberField).value);
    return html`<ds-number label=${ifDefined(property.lead)} aria-label=${property.label} unit="px" width="4"
      .value=${live(value)} step=${options.step} big-step=${options.bigStep} min=${options.min} max=${options.max} default=${options.default}
      data-token=${property.token} @input=${take} @change=${take}></ds-number>`;
  }

  #control(property: ComponentProperty): TemplateResult {
    const written = this.draft.value(property.token);
    switch (property.kind) {
      case "width": {
        const { mode, squares } = readWidth(property, written);
        const set = (next: { mode: WidthMode; squares: number }) => this.#edit(property, tokenValue(property, next));
        return html`<div class="component-editor-width">
          <ds-tabs role="group" aria-label=${property.label} data-token=${property.token}>
            ${property.modes!.map(option => html`<ds-button control="host" ?active=${option === mode} aria-pressed=${String(option === mode)} @click=${() => set({ mode: option, squares })}>${WIDTH_LABELS[option]}</ds-button>`)}
          </ds-tabs>
          ${mode === "fixed" ? this.#number(property, squares * SQUARE,
            { step: SQUARE, bigStep: 4 * SQUARE, min: property.min! * SQUARE, max: property.max! * SQUARE, default: Number(property.default) * SQUARE },
            px => set({ mode: "fixed", squares: Math.round(px / SQUARE) })) : nothing}
        </div>`;
      }
      case "text": {
        const value = String(readLength(property, written));
        return html`<ds-select><select aria-label=${property.label} data-token=${property.token}
          @change=${(event: Event) => this.#edit(property, tokenValue(property, Number((event.currentTarget as HTMLSelectElement).value)))}>
          ${TEXT_SIZES.map(size => html`<option value=${size.value} ?selected=${String(size.value) === value} data-details=${`${size.value}`}>${size.label}</option>`)}
        </select></ds-select>`;
      }
      case "colour": {
        const value = written ?? "";
        return html`<ds-select swatch=${ifDefined(value || undefined)}><select aria-label=${property.label} data-token=${property.token}
          @change=${(event: Event) => this.#edit(property, (event.currentTarget as HTMLSelectElement).value)}>
          <option value="" ?selected=${!value}>Default</option>
          ${COLOURS.map(colour => html`<option value=${colour.value} ?selected=${colour.value === value}>${colour.label}</option>`)}
        </select></ds-select>`;
      }
      default: {
        const value = readLength(property, written);
        return this.#number(property, value,
          { step: property.step!, bigStep: property.bigStep ?? property.step!, min: property.min!, max: property.max!, default: Number(property.default) },
          px => this.#edit(property, tokenValue(property, px)));
      }
    }
  }

  #inspector(spec: ComponentSpec): TemplateResult {
    const embedded = document.documentElement.hasAttribute("data-docs-embed");
    const own = this.draft.overrides.filter(([token]) => spec.properties.some(property => property.token === token));
    const css = own.length ? `:root {\n${own.map(([token, value]) => `  ${token}: ${value};`).join("\n")}\n}` : "No changes yet.";
    return html`<aside class="component-editor-inspector" data-ds-area="Properties" aria-label=${`${spec.name} properties`}>
      <div class="component-editor-inspector-heading">
        <h2 class="ds-text">${spec.name}</h2>
        <a class="component-editor-link" href=${spec.href} target=${embedded ? "_top" : "_blank"} rel=${ifDefined(embedded ? undefined : "noreferrer")}>Documentation</a>
      </div>
      ${GROUPS.map(group => {
        const properties = spec.properties.filter(property => property.group === group);
        return properties.length ? html`<section class="component-editor-group" aria-label=${group}>
          <h3 class="ds-text ds-text--muted">${group}</h3>
          ${properties.map(property => html`<div class="component-editor-property" data-property=${property.token} data-kind=${property.kind}>
            <span class="component-editor-label">${property.label}</span>
            ${this.#control(property)}
            ${this.#reset(property)}
          </div>`)}
        </section>` : nothing;
      })}
      ${accordion(this.#cssId, "CSS", html`<pre class="component-editor-css" data-testid="component-css"><code>${css}</code></pre>`, this.cssOpen, open => { this.cssOpen = open; }, "component-editor-code")}
    </aside>`;
  }

  override render() {
    const draft = this.draft;
    if (draft.failure && draft.base === undefined) return html`<main class="route-splash"><p class="ds-text" role="alert">${draft.failure}</p></main>`;
    if (draft.base === undefined) return html`<main class="route-splash">${loading("Loading Design system 1")}</main>`;
    const { search } = currentLocation.get();
    const view = search.get("view") === "history" ? "history" : null;
    const spec = componentSpec(search.get("component"));
    return html`${this.#navigation(spec, view)}
      <main class="component-editor-stage">
        ${draftNotices(draft)}
        ${view === "history" ? html`<section class="component-editor-history" aria-label="History">
          <h1 class="ds-text">History</h1>
          ${draft.history.length ? draftHistory(draft) : html`<p class="ds-text ds-text--muted">Not edited yet</p>`}
        </section>` : this.#canvas(spec)}
      </main>
      ${view === "history" ? nothing : this.#inspector(spec)}`;
  }
}
defineElement("ds1-component-editor", ComponentEditor);
