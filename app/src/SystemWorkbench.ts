import { html, nothing } from "lit";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import "../../DS1/2-core/ds-button";
import "../../DS1/2-core/ds-composer";
import "../../DS1/2-core/ds-input";
import type { Input as InputElement } from "../../DS1/2-core/ds-input";
import { LAYERS } from "../../shared/component-directory";
import { libraryComponent } from "../../shared/library-navigation";
import { EXAMPLES, PAGE_EXAMPLES } from "../../website/src/lib/component-examples";
import "./AaStylesheet";
import "./BoxModel";
import type { BoxModelConfig, BoxRegion } from "./BoxModel";
import "./ComponentTree";
import type { TreeNode } from "./ComponentTree";
import { defaultButtonBox, writeButtonBox, type ButtonBox } from "./lib/buttonBoxModel";
import { AppElement, defineElement } from "./lib/element";
import { libraryTokenValues, setLibraryToken } from "./lib/libraryTokens";
import { libraryTemplate } from "./lib/libraryTemplate";
import { button, splitButton } from "./lib/ui";
import { currentLocation, navigate } from "./router";
import "./system-workbench.css";

/** The public catalogue as a tree: each layer opens onto its components, each row naming its element. */
const treeNodes: TreeNode[] = LAYERS.map(layer => ({ id: `layer-${layer.number}`, label: `${layer.number} ${layer.name}`, children: layer.entries.map(item => ({ id: item.href, label: item.name, meta: item.tag })) }));

export type LibraryWorkbenchConfig = { schema: number; [key: string]: unknown };
export { libraryTemplate };
const sources = import.meta.glob<string>("../../DS1/{2-core,3-unit,4-page}/**/*.css", { query: "?raw", import: "default", eager: true });
const properties = (text: string) => [...new Set([...text.matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g)].map(match => match[1]!))].sort();
const sharedTokens = properties(libraryTemplate);
const defaults = libraryTokenValues(libraryTemplate);
const aliases: Record<string, string> = { "--ds-accent-color": "--one-accent-color", "--ds-radius": "--one-radius", "--ds-text-color": "--one-text", "--ds-typeface-regular": "--one-font", "--ds-type-size-default": "--one-font-size" };

export type ButtonMetrics = { box: ButtonBox; contentSize: { width: number; height: number } };

/**
 * One example in its frame. The frame takes the library's stylesheet (and the
 * box region under the pointer); with `metrics`, it reports the button's box
 * back as `button-metrics`.
 */
export class ExamplePreview extends AppElement {
  static properties = {
    example: { type: String },
    css: { type: String },
    hoverRegion: { attribute: false },
    metrics: { type: Boolean },
  };
  declare example: string;
  declare css: string;
  declare hoverRegion: BoxRegion | null;
  declare metrics: boolean;
  #requestId = 0;

  constructor() {
    super();
    this.example = "";
    this.css = "";
    this.hoverRegion = null;
    this.metrics = false;
  }

  #frame() {
    return this.querySelector("iframe");
  }

  #send = () => {
    this.#frame()?.contentWindow?.postMessage({ type: "ds1-example-styles", css: this.css, hoverRegion: this.hoverRegion, requestId: ++this.#requestId }, location.origin);
  };

  #receive = (event: MessageEvent) => {
    if (event.origin !== location.origin || event.source !== this.#frame()?.contentWindow) return;
    if (event.data?.type === "ds1-example-library-ready") { this.#send(); return; }
    if (event.data?.type !== "ds1-example-button-metrics" || event.data.requestId !== this.#requestId || !this.metrics) return;
    const { box, contentSize } = event.data;
    if (!box || !contentSize || !Object.values({ ...box, ...contentSize }).every(value => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100000)) return;
    this.emit<ButtonMetrics>("button-metrics", { box, contentSize });
  };

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener("message", this.#receive);
  }

  override disconnectedCallback() {
    window.removeEventListener("message", this.#receive);
    super.disconnectedCallback();
  }

  override updated(changed: Map<string, unknown>) {
    if (changed.has("css") || changed.has("hoverRegion")) this.#send();
  }

  override render() {
    const example = EXAMPLES[this.example]!;
    return html`<iframe src=${`/examples/${this.example}/`} title=${example.title} @load=${this.#send} style=${`height: ${example.height ?? 200}px`}></iframe>`;
  }
}
defineElement("ds1-example-preview", ExamplePreview);

/**
 * The library workbench: the catalogue, the open component's examples and its
 * tokens, and the stylesheet. `initialCss` and `initialConfig` seed it once;
 * every edit is a `workbench-dirty` with the CSS and the configuration.
 * `header` stands at its top (a library's own actions).
 */
export class SystemWorkbench extends AppElement {
  static properties = {
    initialCss: { attribute: false },
    initialConfig: { attribute: false },
    header: { attribute: false },
    buttonMode: { state: true },
    stylesheetOpen: { state: true },
    css: { state: true },
    search: { state: true },
    buttonMetrics: { state: true },
    boxPreview: { state: true },
    hoverRegion: { state: true },
  };
  declare initialCss: string | undefined;
  declare initialConfig: LibraryWorkbenchConfig | undefined;
  declare header: unknown;
  declare buttonMode: "single" | "split";
  declare stylesheetOpen: boolean;
  declare css: string | undefined;
  declare search: string;
  declare buttonMetrics: ButtonMetrics;
  declare boxPreview: Partial<ButtonBox> | null;
  declare hoverRegion: BoxRegion | null;
  #config: LibraryWorkbenchConfig | undefined;

  constructor() {
    super();
    this.initialCss = undefined;
    this.initialConfig = undefined;
    this.header = nothing;
    this.buttonMode = "single";
    this.stylesheetOpen = false;
    this.css = undefined;
    this.search = "";
    this.buttonMetrics = { box: defaultButtonBox, contentSize: { width: 0, height: 0 } };
    this.boxPreview = null;
    this.hoverRegion = null;
  }

  override willUpdate() {
    this.css ??= this.initialCss ?? libraryTemplate;
    this.#config ??= this.initialConfig ?? { schema: 2 };
  }

  #setSelected(component: string) {
    const { path, search } = currentLocation.get();
    const query = new URLSearchParams(search);
    query.set("component", component);
    query.delete("view");
    navigate(`${path}?${query}`);
  }

  #update(value: string) {
    this.boxPreview = null;
    this.css = value;
    this.emit("workbench-dirty", { css: value, config: this.#config });
  }

  #setToken(name: string, value: string) {
    // Preserve older native-element libraries while exposing the canonical component tokens.
    let next = setLibraryToken(this.css!, name, value);
    const alias = aliases[name];
    if (alias && libraryTokenValues(this.css!).get(alias) !== undefined) next = setLibraryToken(next, alias, value);
    this.#update(next);
  }

  #commitBox(patch: Partial<BoxModelConfig> & { gap?: number }) {
    this.#update(writeButtonBox(this.css!, { ...this.buttonMetrics.box, ...this.boxPreview, ...patch }, this.buttonMode));
  }

  #closeStylesheet() {
    this.stylesheetOpen = false;
    void this.updateComplete.then(() => this.querySelector<HTMLButtonElement>('button[aria-controls="library-stylesheet"]')?.focus());
  }

  override render() {
    const css = this.css ?? this.initialCss ?? libraryTemplate;
    const { path, search: routeSearch } = currentLocation.get();
    const selected = libraryComponent(routeSearch.get("component"));
    const embeddedLibrary = document.documentElement.hasAttribute("data-docs-embed") && path.startsWith("/l/");
    const values = libraryTokenValues(css);
    const entry = LAYERS.flatMap(layer => layer.entries).find(item => item.href === selected)!;
    const examples = (PAGE_EXAMPLES[selected.replace(/^\/|\/$/g, "")] ?? []).filter(example => entry.tag !== "ds-button" || (this.buttonMode === "split" ? example === "split" : example !== "split"));
    const own = Object.entries(sources).filter(([file]) => entry.tag && file.includes(entry.tag)).map(([, source]) => source).join("\n");
    const used = [...own.matchAll(/var\((--ds-[a-zA-Z0-9_-]+)/g)].map(match => match[1]!);
    const tokens = [...new Set([...sharedTokens, ...used, ...properties(css)])].filter(name => !this.search || name.toLowerCase().includes(this.search.toLowerCase())).sort();
    const buttonSelected = entry.tag === "ds-button";
    const shownBox = { ...this.buttonMetrics.box, ...this.boxPreview };
    const previewCss = this.boxPreview ? writeButtonBox(css, shownBox, this.buttonMode) : css;
    const fieldValue = (event: Event) => (event.currentTarget as InputElement).value;

    return html`<div class=${`workbench system-workbench${this.stylesheetOpen ? "" : " system-workbench--no-stylesheet"}${routeSearch.get("view") === "overview" ? " system-workbench--overview" : ""}`} data-testid="workbench">
      ${this.header}
      <div class=${`system-workbench-panes${embeddedLibrary ? " system-workbench-panes--external-navigation" : ""}`}>
        ${embeddedLibrary ? nothing : html`<aside class="library-panel system-library-panel">
          <h2 class="app-panel-label">Components</h2>
          <ds1-component-tree label="Component library" .nodes=${treeNodes} current=${selected}
            @tree-select=${(event: CustomEvent<string>) => { if (!event.detail.startsWith("layer-")) this.#setSelected(event.detail); }}></ds1-component-tree>
        </aside>`}
        <main class="system-workbench-preview">
          <div class="app-panel-heading"><h1>${entry.name}</h1>${button(this.stylesheetOpen ? "Hide stylesheet" : "Show stylesheet", () => { this.stylesheetOpen = !this.stylesheetOpen; }, { expanded: this.stylesheetOpen, controls: "library-stylesheet" })}<a class="system-workbench-docs" href=${entry.href} target="_blank" rel="noreferrer">Documentation<ds-icon type="up-right" aria-hidden="true"></ds-icon></a></div>
          ${examples.length ? repeat(examples, example => example, (example, index) => html`<section><h2>${EXAMPLES[example]!.title}</h2><ds1-example-preview example=${example} css=${previewCss}
            .hoverRegion=${buttonSelected ? this.hoverRegion : null} ?metrics=${buttonSelected && index === 0}
            @button-metrics=${(event: CustomEvent<ButtonMetrics>) => { if (JSON.stringify(this.buttonMetrics) !== JSON.stringify(event.detail)) this.buttonMetrics = event.detail; }}></ds1-example-preview></section>`)
            : html`<p>This composition is described in the <a href=${entry.href} target="_blank" rel="noreferrer">documentation</a>.</p>`}
        </main>
        <aside class="system-workbench-tokens">
          ${buttonSelected ? html`<div class="library-button-mode">${splitButton("Button mode", [{ value: "single", label: "Single" }, { value: "split", label: "Split" }], this.buttonMode, mode => { this.buttonMode = mode; this.boxPreview = null; })}</div>
          <section class="controls-section controls-section--box-model library-button-properties" aria-label="Button properties">
            <h2 @mouseenter=${() => { this.hoverRegion = "all"; }} @mouseleave=${() => { this.hoverRegion = null; }}>Box model</h2>
            <ds1-box-model .config=${shownBox} .contentSize=${this.buttonMetrics.contentSize} .hoverRegion=${this.hoverRegion} supportsSpacing
              @box-change=${(event: CustomEvent<Partial<BoxModelConfig>>) => this.#commitBox(event.detail)}
              @box-preview=${(event: CustomEvent<Partial<BoxModelConfig>>) => { this.boxPreview = event.detail; }}
              @box-hover=${(event: CustomEvent<BoxRegion | null>) => { this.hoverRegion = event.detail; }}></ds1-box-model>
            <label class="library-button-gap">Content gap <ds-input variant="field" aria-label="Content gap px" type="number" min="0" max="48" step="4" .value=${live(String(shownBox.gap))}
              @input=${(event: Event) => this.#commitBox({ gap: Math.min(48, Math.max(0, Number(fieldValue(event)))) })}></ds-input></label>
          </section>` : nothing}
          <h2 class="app-panel-label">Tokens</h2>
          <ds-input variant="field" class="system-workbench-filter" type="search" aria-label="Filter tokens" placeholder="Filter tokens" .value=${live(this.search)} @input=${(event: Event) => { this.search = fieldValue(event); }}></ds-input>
          ${repeat(tokens, name => name, name => html`<label><span>${name}</span><ds-input variant="field" type="text" aria-label=${name} placeholder=${defaults.get(name) ?? "Inherited"} .value=${live(values.get(name) ?? "")}
            @input=${(event: Event) => this.#setToken(name, fieldValue(event))}></ds-input></label>`)}
        </aside>
      </div>
      ${this.stylesheetOpen ? html`<section id="library-stylesheet" aria-label="Live CSS file" class="css-file-panel">
        <div class="app-panel-heading"><h2>Stylesheet</h2>${button("Close stylesheet", () => this.#closeStylesheet())}</div>
        <div class="css-editor-shell"><ds1-aa-stylesheet .value=${css} @stylesheet-change=${(event: CustomEvent<string>) => this.#update(event.detail)}></ds1-aa-stylesheet></div>
      </section>` : nothing}
    </div>`;
  }
}
defineElement("ds1-system-workbench", SystemWorkbench);
