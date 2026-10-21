import { html, nothing } from "lit";
import { live } from "lit/directives/live.js";
import { confirm } from "../../../DS1/0-face/feedback";
import "../../../DS1/1-root/controls.css";
import "../../../DS1/2-core/ds-cycle";
import "../../../DS1/3-unit/ds-sidebar";
import "../../../DS1/3-unit/ds-tabs";
import "../../../DS1/4-page/ds-page";
import type { SidebarItem } from "../../../DS1/3-unit/ds-sidebar";
import { authState, authToken, signOut } from "../lib/backend";
import { AppElement, defineElement } from "../lib/element";
import { button, empty, loading } from "../lib/ui";
import "./SignIn";
import "./font-workspace.css";

type FontEntry = { id: string; name: string; detail: string; available: boolean; fileName?: string | null; development?: boolean; drawing?: boolean };
const sizes = [20, 40, 60, 80, 100, 120];
const spacings = [0, 1, 2, 3, 4];
const alphabets = ["ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz", "0123456789", ".,:;!?—–“”‘’()[]{}@&", "ÅÆØåæø"];
/** What a face in development says before a build is opened. The Worker lists the faces; a face without words of its own gets the plain ones. */
const studies: Record<string, { heading: string; text: string }> = {
  supernatural: { heading: "Supernatural starts with your handwriting.", text: "Open a font build to try it here. Handwriting scans and original letterforms are still needed to create the first version. English first. About ten forms per letter, with variation in shape, spacing and rhythm." },
  "0001-sans": { heading: "0001 Sans starts with the Regular.", text: "Open a font build to try it here. The studio’s own sans: Regular first, then Medium, on the metrics of the text face it replaces, so nothing on the grid shifts." },
};

/** A secondary button, as every control in the workspace is. */
const control = (label: string, onClick: () => void, options: { disabled?: boolean; pressed?: boolean } = {}) => button(label, onClick, options);

/** Design system 1's cycle through the workspace's own values; each click moves to the next. */
const cycle = (setting: string, values: string[], value: string, onChange: (value: string) => void) =>
  html`<ds-cycle secondary data-setting=${setting} .values=${values} .value=${value} @change=${(event: CustomEvent<{ value: string }>) => onChange(event.detail.value)}></ds-cycle>`;

/** The private font workspace on fonts.designsystem1.com: signed in, the owner's faces. */
export class FontWorkspace extends AppElement {
  override connectedCallback() {
    super.connectedCallback();
    document.title = "Fonts · Design system 1";
  }

  override render() {
    const { isLoading, isAuthenticated } = authState.get();
    if (isLoading) return html`<main class="fonts-status">${loading("Opening your fonts")}</main>`;
    if (!isAuthenticated) return html`<div class="app-shell fonts-sign-in"><ds1-sign-in fonts-only .redirectTo=${"/fonts"}></ds1-sign-in></div>`;
    return html`<ds1-private-fonts></ds1-private-fonts>`;
  }
}
defineElement("ds1-font-workspace", FontWorkspace);

export class PrivateFonts extends AppElement {
  static properties = {
    fonts: { state: true },
    selected: { state: true },
    mode: { state: true },
    drawFor: { state: true },
    text: { state: true },
    size: { state: true },
    spacing: { state: true },
    dark: { state: true },
    family: { state: true },
    error: { state: true },
    message: { state: true },
    busy: { state: true },
    local: { state: true },
    retry: { state: true },
    workbenchReady: { state: true },
  };
  declare fonts: FontEntry[] | null;
  declare selected: string;
  declare mode: "specimen" | "glyphs" | "draw";
  /** The face whose drawing is open: it stays open behind Specimen and Glyphs until another face is chosen. */
  declare drawFor: string | null;
  declare text: string;
  declare size: number;
  declare spacing: number;
  declare dark: boolean;
  declare family: string | null;
  declare error: string;
  declare message: string;
  declare busy: boolean;
  declare local: File | null;
  declare retry: number;
  declare workbenchReady: boolean;

  #drawingDirty = false;
  #generation = 0;
  #loaded: FontFace | null = null;
  #listKey: string | null = null;
  #faceKey: string | null = null;
  #listController: AbortController | null = null;
  #faceController: AbortController | null = null;

  constructor() {
    super();
    this.fonts = null;
    this.selected = "supernatural";
    this.mode = "specimen";
    this.drawFor = null;
    this.text = "a little of the natural.\nevery letter a little different.";
    this.size = 40;
    this.spacing = 0;
    this.dark = false;
    this.family = null;
    this.error = "";
    this.message = "";
    this.busy = false;
    this.local = null;
    this.retry = 0;
    this.workbenchReady = Boolean(customElements.get("ds1-font-workbench"));
  }

  #active() {
    return this.fonts?.find(font => font.id === this.selected);
  }

  #request = async (path: string, init: RequestInit = {}, session = authToken.get()) => {
    const response = await fetch(path, { ...init, headers: { ...init.headers, Authorization: `Bearer ${session}` }, cache: "no-store" });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (response.status === 401 || response.status === 403) this.fonts = null;
      throw Object.assign(new Error(body.error || "The font workspace could not be opened. Try again."), { status: response.status });
    }
    return response;
  };

  override willUpdate() {
    const token = authToken.get();
    // The list of faces, again for a new session or Try again.
    const listKey = JSON.stringify([token, this.retry]);
    if (listKey !== this.#listKey) {
      this.#listKey = listKey;
      this.#listController?.abort();
      this.#listController = null;
      if (token) {
        const controller = this.#listController = new AbortController();
        this.error = "";
        this.#request("/api/fonts", { signal: controller.signal }, token).then(response => response.json()).then((data: { fonts: FontEntry[] }) => {
          if (!controller.signal.aborted) this.fonts = data.fonts;
        }).catch(problem => { if (!controller.signal.aborted) this.error = problem instanceof Error ? problem.message : "Could not open fonts."; });
      }
    }
    // The chosen face's build, when it has one.
    const active = this.#active();
    const faceKey = JSON.stringify([this.selected, active?.available, token, this.retry]);
    if (faceKey !== this.#faceKey) {
      this.#faceKey = faceKey;
      this.#faceController?.abort();
      const current = ++this.#generation;
      const controller = this.#faceController = new AbortController();
      this.family = null; this.error = ""; this.local = null;
      if (!active?.available || !token) { this.busy = false; return; }
      this.busy = true;
      this.#request(`/api/fonts/file/${this.selected}`, { signal: controller.signal }, token).then(response => response.arrayBuffer()).then(async bytes => {
        const face = await new FontFace(`WorkspaceFont${current}`, bytes).load();
        if (current !== this.#generation || controller.signal.aborted) return;
        if (this.#loaded) document.fonts.delete(this.#loaded);
        document.fonts.add(face); this.#loaded = face; this.family = face.family;
      }).catch(problem => { if (!controller.signal.aborted) this.error = problem instanceof Error ? problem.message : "The font could not load."; })
        .finally(() => { if (current === this.#generation) this.busy = false; });
    }
  }

  override disconnectedCallback() {
    this.#listController?.abort();
    this.#faceController?.abort();
    this.#listKey = this.#faceKey = null;
    this.#generation++;
    if (this.#loaded) document.fonts.delete(this.#loaded);
    this.#loaded = null;
    super.disconnectedCallback();
  }

  async #openFont(input: HTMLInputElement) {
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { this.error = "Choose a font smaller than 10 MB."; return; }
    const current = ++this.#generation;
    this.busy = true; this.error = ""; this.message = "";
    try {
      const face = await new FontFace(`LocalFont${current}`, await file.arrayBuffer()).load();
      if (current !== this.#generation) return;
      if (this.#loaded) document.fonts.delete(this.#loaded);
      document.fonts.add(face); this.#loaded = face; this.family = face.family; this.local = file;
      this.message = "Local preview. Save when you want to keep this version.";
    } catch { if (current === this.#generation) this.error = "This file could not be opened as a font. Choose a WOFF2, WOFF, OTF or TTF file."; }
    finally { if (current === this.#generation) this.busy = false; input.value = ""; }
  }

  async #saveFont() {
    const active = this.#active(), local = this.local;
    if (!local || !active?.development) return;
    const { id } = active;
    this.busy = true; this.error = "";
    try {
      await this.#request(`/api/fonts/${id}`, { method: "PUT", headers: { "Content-Type": "application/octet-stream", "X-Font-Name": local.name.replace(/[^\x20-\x7e]/g, "_") }, body: local });
      // Keep the loaded preview and text in place; the next visit reads the saved version.
      this.message = "Saved privately. Previous font versions are retained.";
      this.fonts = this.fonts?.map(font => font.id === id ? { ...font, available: true, fileName: local.name } : font) ?? null;
      this.local = null;
    } catch (problem) { this.error = problem instanceof Error ? problem.message : "The font could not be saved."; }
    finally { this.busy = false; }
  }

  /** The shared sidebar owns rows, focus and arrow keys; the workspace owns which font is open. */
  async #choose(id: string) {
    if (this.busy || id === this.selected) return;
    if (this.#drawingDirty && !(await confirm({ title: "Leave the drawing without saving?", text: "Changes since the last save are lost.", confirm: "Leave", danger: true }))) return;
    this.#drawingDirty = false;
    const drawn = Boolean(this.fonts?.find(font => font.id === id)?.drawing);
    this.message = ""; this.error = ""; this.drawFor = this.mode === "draw" && drawn ? id : null;
    if (this.mode === "draw" && !drawn) this.mode = "specimen";
    this.selected = id;
  }

  #openDrawing() {
    this.mode = "draw"; this.drawFor = this.selected; this.message = "";
  }

  // The workbench, with its font reader and writer, loads only when a drawing is opened.
  #workbench(active: FontEntry) {
    if (!this.workbenchReady) {
      void import("./fontWorkbench/Workbench").then(() => { this.workbenchReady = true; });
      return this.mode === "draw" ? loading("Opening the workbench") : nothing;
    }
    return html`<ds1-font-workbench .face=${active} .request=${this.#request} .hidden=${this.mode !== "draw"}
      @workbench-message=${(event: CustomEvent<string>) => { this.error = ""; this.message = event.detail; }}
      @workbench-error=${(event: CustomEvent<string>) => { this.error = event.detail; }}
      @dirty-change=${(event: CustomEvent<boolean>) => { this.#drawingDirty = event.detail; }}
      @build-saved=${(event: CustomEvent<string>) => { this.fonts = this.fonts?.map(font => font.id === active.id ? { ...font, available: true, fileName: event.detail } : font) ?? null; }}></ds1-font-workbench>`;
  }

  #stage(active: FontEntry | undefined) {
    const { mode, family, size, spacing, busy } = this;
    if (mode === "draw") return nothing;
    if (family) {
      if (mode === "specimen") return html`<textarea aria-label=${`${active?.name} specimen text`} spellcheck="false" .value=${live(this.text)} @input=${(event: Event) => { this.text = (event.target as HTMLTextAreaElement).value; }}
        style=${`font-family: "${family}"; font-size: calc(${size}px * var(--sf, 1)); letter-spacing: calc(${spacing}px * var(--sf, 1))`}></textarea>`;
      return html`<div class="font-glyphs" style=${`font-family: "${family}"; font-size: calc(${size}px * var(--sf, 1))`}>${alphabets.flatMap(line => [...line]).map(letter => html`<div><span>${letter}</span><small>U+${letter.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}</small></div>`)}</div>`;
    }
    return empty(active?.development ? studies[active.id]?.text ?? "Open a font build to try it here." : "Select a font to view it, or try again if it could not load.", {
      className: "font-empty",
      heading: busy ? "Loading the font…" : active?.development ? studies[active.id]?.heading ?? `${active.name} is in development.` : "No specimen loaded.",
    });
  }

  override render() {
    const { fonts, error, message, mode, busy, dark } = this;
    const retry = () => { this.retry += 1; };
    const leave = () => void signOut();
    if (!fonts) return html`<main class="fonts-status"><h1>Fonts</h1><p role=${error ? "alert" : "status"}>${error || "Checking access…"}</p>${error ? control("Try again", retry) : nothing}${control("Sign out", leave)}</main>`;
    const active = this.#active();
    const items: SidebarItem[] = fonts.map(font => ({ id: font.id, label: font.name, current: this.selected === font.id, disabled: busy }));
    const tab = (label: string, view: typeof mode, choose: () => void) => button(label, choose, { secondary: false, active: mode === view, pressed: mode === view });

    return html`<main class=${`font-workspace${dark ? " font-workspace-dark" : ""}`} data-ds-surface>
      <header class="fonts-header"><h1>Fonts</h1><span>Private workspace</span>${control("Sign out", leave)}</header>
      <ds-page layout="sidebar" divided fill class="fonts-body">
        <ds-sidebar slot="nav" label="Fonts" .items=${items} @sidebar-activate=${(event: CustomEvent<{ id: string }>) => void this.#choose(event.detail.id)}></ds-sidebar>
        <header slot="header" class="font-heading"><h2>${active?.name}</h2><span>${active?.detail}</span></header>
        <section class="font-desk" aria-label=${active?.name ?? ""}>
          <div class="font-toolbar">
            <ds-tabs role="group" aria-label="View">${tab("Specimen", "specimen", () => { this.mode = "specimen"; })}${tab("Glyphs", "glyphs", () => { this.mode = "glyphs"; })}${active?.drawing ? tab("Draw", "draw", () => this.#openDrawing()) : nothing}</ds-tabs>
            ${mode !== "draw" ? html`${cycle("size", sizes.map(n => `Size ${n}`), `Size ${this.size}`, value => { this.size = Number(value.slice(5)); })}
            ${cycle("spacing", spacings.map(n => `Spacing ${n}`), `Spacing ${this.spacing}`, value => { this.spacing = Number(value.slice(8)); })}` : nothing}
            ${control("Dark paper", () => { this.dark = !this.dark; }, { pressed: dark })}
            ${active?.development && mode !== "draw" ? html`<input class="font-file" type="file" accept=".woff2,.woff,.ttf,.otf" @change=${(event: Event) => void this.#openFont(event.target as HTMLInputElement)} />${control("Open font", () => this.querySelector<HTMLInputElement>(".font-file")?.click(), { disabled: busy })}${this.local ? control("Save font", () => void this.#saveFont(), { disabled: busy }) : nothing}` : nothing}
          </div>
          <div class="font-stage" aria-busy=${String(busy)}>
            ${active?.drawing && this.drawFor === active.id ? this.#workbench(active) : nothing}
            ${this.#stage(active)}
          </div>
        </section>
        <footer slot="footer" class="font-footer"><p role=${error ? "alert" : "status"}>${error || message || (mode === "draw" ? "Drag points and handles; double-click the outline to add a point. References are drawn behind, never copied." : this.family ? active?.development ? "Development study. Missing characters use a fallback." : mode === "glyphs" ? "Unsupported characters use a fallback." : "Edit the specimen text. Size changes stay inside the specimen." : "No substitute handwriting font is shown.")}</p>${error ? control("Try again", retry) : nothing}</footer>
      </ds-page>
    </main>`;
  }
}
defineElement("ds1-private-fonts", PrivateFonts);
