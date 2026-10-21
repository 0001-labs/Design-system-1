import { html, nothing } from "lit";
import { keyed } from "lit/directives/keyed.js";
import { live } from "lit/directives/live.js";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import "../../../DS1/2-core/ds-input";
import type { Input as InputElement } from "../../../DS1/2-core/ds-input";
import "../SystemWorkbench";
import type { LibraryWorkbenchConfig as WorkbenchConfig } from "../SystemWorkbench";
import {
  AUTOSAVE_DEBOUNCE_MS,
  AUTOSAVE_MAX_WAIT_MS,
  backoffMs,
  clearLocalDraft,
  readLocalDraft,
  stashLocalDraft,
  type SaveState,
} from "../lib/autosave";
import { LiveQuery, mutation } from "../lib/backend";
import { asFailure } from "../lib/convex";
import { AppElement, defineElement } from "../lib/element";
import { button, loading, notice } from "../lib/ui";
import { currentLocation, follow, href, navigate } from "../router";
import "./PublishPanel";

const SAVE_LABEL: Record<SaveState, string> = {
  saved: "Saved",
  dirty: "Unsaved changes",
  saving: "Saving…",
  conflict: "Edited elsewhere",
  offline: "Offline — kept on this device",
  error: "Could not save",
};

/** A saved library in the workbench, autosaved as it changes. */
export class LibraryEditor extends AppElement {
  static properties = {
    libraryId: { type: String, attribute: "library-id" },
    renaming: { state: true },
    editingName: { state: true },
    nameInput: { state: true },
    renameError: { state: true },
    saveState: { state: true },
    serverRev: { state: true },
  };
  declare libraryId: string;
  declare renaming: boolean;
  declare editingName: boolean;
  declare nameInput: string;
  declare renameError: string | null;
  declare saveState: SaveState;
  declare serverRev: number | null;

  #library = new LiveQuery(this, api.libraries.get, () => ({ id: this.libraryId as Id<"libraries"> }));

  // The CSS currently in the editor, which may be newer than what the server
  // has returned. The publish panel validates against this so its issue list
  // matches what the user is looking at.
  #liveCss: string | null = null;
  // Latest editor state, kept outside rendering so the debounce timer never
  // re-arms on every keystroke and the flush handlers always see current values.
  #pending: { css: string; config: string } | null = null;
  #baseRev: number | null = null;
  #lastSavedCss: string | null = null;
  #debounceTimer: ReturnType<typeof setTimeout> | null = null;
  #maxWaitTimer: ReturnType<typeof setTimeout> | null = null;
  #attempt = 0;
  #mounted = false;

  constructor() {
    super();
    this.libraryId = "";
    this.renaming = false;
    this.editingName = false;
    this.nameInput = "";
    this.renameError = null;
    this.saveState = "saved";
    this.serverRev = null;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#mounted = true;
    window.addEventListener("pagehide", this.#onHide);
    document.addEventListener("visibilitychange", this.#onHide);
    window.addEventListener("online", this.#onHide);
  }

  override disconnectedCallback() {
    this.#mounted = false;
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
    if (this.#maxWaitTimer) clearTimeout(this.#maxWaitTimer);
    this.#debounceTimer = this.#maxWaitTimer = null;
    window.removeEventListener("pagehide", this.#onHide);
    document.removeEventListener("visibilitychange", this.#onHide);
    window.removeEventListener("online", this.#onHide);
    super.disconnectedCallback();
  }

  #onHide = () => {
    if (this.#pending) void this.#flush();
  };

  // Seed the revision the first time the library arrives.
  override willUpdate() {
    const library = this.#library.value;
    if (library && this.#baseRev === null) {
      this.#baseRev = library.draftRev;
      this.#lastSavedCss = library.draftCss;
    }
  }

  #flush = async (): Promise<void> => {
    const draft = this.#pending;
    const rev = this.#baseRev;
    if (!draft || rev === null) return;

    // The drag handles emit many byte-identical states; skipping them is what
    // keeps autosave off the mutation-rate ceiling, not a micro-optimization.
    if (draft.css === this.#lastSavedCss) {
      this.#pending = null;
      if (this.#mounted) this.saveState = "saved";
      return;
    }
    if (this.#mounted) this.saveState = "saving";

    try {
      const result = await mutation(api.libraries.saveDraft, { id: this.libraryId as Id<"libraries">, css: draft.css, config: draft.config, baseRev: rev });
      this.#baseRev = result.draftRev;
      this.#lastSavedCss = draft.css;
      this.#pending = null;
      this.#attempt = 0;
      clearLocalDraft(this.libraryId);
      if (this.#mounted) this.saveState = "saved";
    } catch (caught) {
      const failure = asFailure(caught);
      if (failure?.code === "draft_conflict") {
        const details = failure.details as { serverRev?: number } | undefined;
        this.serverRev = details?.serverRev ?? null;
        stashLocalDraft(this.libraryId, { ...draft, baseRev: rev, savedAt: Date.now() });
        if (this.#mounted) this.saveState = "conflict";
        return;
      }
      // Anything else — offline, a deploy blip — keeps the work on the device
      // and retries. Never drop the user's edits on the floor.
      stashLocalDraft(this.libraryId, { ...draft, baseRev: rev, savedAt: Date.now() });
      this.#attempt += 1;
      if (this.#mounted) this.saveState = navigator.onLine ? "error" : "offline";
      setTimeout(() => {
        if (this.#mounted && this.#pending) void this.#flush();
      }, backoffMs(this.#attempt));
    }
  };

  #onDirty = (event: CustomEvent<{ css: string; config: WorkbenchConfig }>) => {
    const { css, config } = event.detail;
    this.#liveCss = css;
    if (this.#baseRev === null) return;
    if (css === this.#lastSavedCss && this.#pending === null) return;
    this.#pending = { css, config: JSON.stringify(config) };
    if (this.saveState !== "conflict") this.saveState = "dirty";
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
    this.#debounceTimer = setTimeout(() => void this.#flush(), AUTOSAVE_DEBOUNCE_MS);
    // Checkpoint even if the user never pauses.
    if (!this.#maxWaitTimer) {
      this.#maxWaitTimer = setTimeout(() => {
        this.#maxWaitTimer = null;
        void this.#flush();
      }, AUTOSAVE_MAX_WAIT_MS);
    }
  };

  #setPublishOpen(open: boolean) {
    const { path, search } = currentLocation.get();
    const query = new URLSearchParams(search);
    if (open) query.set("view", "overview");
    else query.delete("view");
    navigate(`${path}?${query}`);
  }

  async #rename(event: SubmitEvent) {
    event.preventDefault();
    if (this.renaming) return;
    this.renaming = true;
    this.renameError = null;
    try {
      await mutation(api.libraries.rename, { id: this.libraryId as Id<"libraries">, name: this.nameInput });
      this.editingName = false;
    } catch (error) {
      this.renameError = asFailure(error)?.message ?? "Could not rename the library. Try again.";
    } finally {
      this.renaming = false;
    }
  }

  #header(library: NonNullable<LiveQuery<typeof api.libraries.get>["value"]>, publishOpen: boolean) {
    const local = readLocalDraft(this.libraryId);
    return html`<header class="workbench-header" data-ds-area="Library actions">
      <div>
        <a class="workbench-back" href=${href("/libraries")} @click=${follow("/libraries")}><ds-icon type="left" aria-hidden="true"></ds-icon>Libraries</a>
        ${this.editingName ? html`<form @submit=${(event: SubmitEvent) => void this.#rename(event)}>
          <ds-input variant="field" type="text" aria-label="Library name" autofocus maxlength="60" required .value=${live(this.nameInput)} ?disabled=${this.renaming}
            @input=${(event: Event) => { this.nameInput = (event.currentTarget as InputElement).value; }}></ds-input>
          ${button(this.renaming ? "Saving…" : "Save name", undefined, { type: "submit", disabled: this.renaming || !this.nameInput.trim() })}
          ${button("Cancel", () => { this.editingName = false; this.renameError = null; }, { disabled: this.renaming })}
        </form>` : html`<strong>${library.name}</strong>${button("Rename", () => { this.nameInput = library.name; this.editingName = true; this.renameError = null; })}`}
        ${this.renameError ? html`<span role="alert">${this.renameError}</span>` : nothing}
      </div>

      <div class="workbench-header-actions">
        <span data-testid="save-state" data-state=${this.saveState}>${SAVE_LABEL[this.saveState]}</span>
        ${button(publishOpen ? "Back to components" : "System overview", () => this.#setPublishOpen(!publishOpen), { primary: true, testid: "open-publish" })}
      </div>

      ${publishOpen ? html`<ds1-publish-panel
        .css=${this.#liveCss ?? library.draftCss}
        .draftRev=${library.draftRev}
        .installUrl=${library.installUrl}
        .lastPublishError=${library.lastPublishError}
        .libraryId=${this.libraryId}
        .name=${library.name}
        .publicId=${library.publicId}
        .publishedVersion=${library.publishedVersion}
        .slug=${library.slug}
        .state=${library.state}
        @publish-close=${() => this.#setPublishOpen(false)}></ds1-publish-panel>` : nothing}

      ${this.saveState === "conflict" ? notice("Your changes are safe on this device.", {
        tone: "warning", role: "alert", testid: "conflict-bar",
        heading: `This library was edited somewhere else${this.serverRev === null ? "" : ` (revision ${this.serverRev})`}`,
        // Never auto-merge CSS text — the user decides.
        actions: html`${button("Keep mine", () => {
          if (this.serverRev !== null) this.#baseRev = this.serverRev;
          this.saveState = "dirty";
          void this.#flush();
        })}${button("Load theirs", () => {
          clearLocalDraft(this.libraryId);
          window.location.reload();
        })}`,
      }) : nothing}

      ${local && this.saveState !== "conflict" ? notice("Unsaved changes from an earlier session are stored on this device.", { testid: "local-draft-notice" }) : nothing}
    </header>`;
  }

  override render() {
    const library = this.#library.value;
    const publishOpen = currentLocation.get().search.get("view") === "overview";
    if (library === undefined) return html`<main class="route-splash" data-testid="editor-loading">${loading("Loading the library")}</main>`;
    if (library === null) {
      return html`<main class="route-splash">
        <p class="ds-text">That library does not exist.</p>
        ${button("Back to your libraries", () => navigate("/libraries"))}
      </main>`;
    }
    // Keyed on the library, so the workbench seeds again from initialCss when another opens.
    return keyed(this.libraryId, html`<ds1-system-workbench
      .initialCss=${library.draftCss}
      .initialConfig=${parseConfig(library.draftConfig, library.publicId)}
      .header=${this.#header(library, publishOpen)}
      @workbench-dirty=${this.#onDirty}></ds1-system-workbench>`);
  }
}
defineElement("ds1-library-editor", LibraryEditor);

/**
 * `draftConfig` is advisory. If it is unparseable or from a future schema, the
 * editor still opens. Preserve any readable advisory configuration; token
 * controls derive their values from the stylesheet.
 */
function parseConfig(raw: string, label: string): WorkbenchConfig | undefined {
  try {
    const parsed = JSON.parse(raw) as Partial<WorkbenchConfig>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || typeof parsed.schema !== "number") return undefined;
    return parsed as WorkbenchConfig;
  } catch {
    console.warn(`[editor] ignoring unreadable draftConfig for ${label}`);
    return undefined;
  }
}
