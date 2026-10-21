import { html, nothing } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { api } from "../../../convex/_generated/api";
import { formatDateTime } from "../../../DS1/0-face/format";
import "../../../DS1/1-root/card.css";
import { LiveQuery, mutation } from "../lib/backend";
import { failureCode } from "../lib/convex";
import { AppElement, defineElement } from "../lib/element";
import { libraryTemplate, templateVersion } from "../lib/libraryTemplate";
import { button, empty, loading, notice } from "../lib/ui";
import { follow, href, navigate } from "../router";
import "./LibraryPreview";
import "./library-cards.css";

/** Human labels for the states convex/lib/libraryState.ts derives. */
const STATE_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  "unpublished-changes": "Unpublished changes",
  "failed-validation": "Last publish failed",
  publishing: "Publishing…",
  archived: "Archived",
};

/** The signed-in account's libraries, after Design system 1's own. */
export class LibraryList extends AppElement {
  static properties = { busy: { state: true }, error: { state: true } };
  declare busy: boolean;
  declare error: string | null;
  #libraries = new LiveQuery(this, api.libraries.list, () => ({}));

  constructor() {
    super();
    this.busy = false;
    this.error = null;
  }

  async #create() {
    if (this.busy) return;
    this.busy = true;
    this.error = null;
    try {
      const created = await mutation(api.libraries.create, { name: "Untitled library", css: libraryTemplate, config: JSON.stringify({ schema: 2 }), templateVersion: templateVersion() });
      navigate(`/l/${created._id}`);
    } catch (caught) {
      this.error = failureCode(caught) === "quota_exceeded" ? "You have reached the library limit. Archive one to make room." : "Could not create the library.";
      this.busy = false;
    }
  }

  override render() {
    const libraries = this.#libraries.value;
    if (libraries === undefined) return html`<main class="dashboard" data-ds-area="Libraries" data-testid="library-list-loading">${loading("Loading your libraries")}</main>`;
    return html`<main class="dashboard" data-ds-area="Libraries" data-testid="library-list">
      <header class="workbench-header" data-ds-area="Library actions">
        <h1>Your libraries</h1>
        <div class="workbench-header-actions">
          ${button(this.busy ? "Creating…" : "New library", () => void this.#create(), { primary: true, testid: "create-library", disabled: this.busy })}
        </div>
      </header>

      ${this.error ? notice(this.error, { tone: "danger" }) : nothing}

      <div role="list" class="library-grid library-preview-grid">
        <div role="listitem">
          <a class="ds-card library-preview-card" href="/" target=${ifDefined(document.documentElement.hasAttribute("data-docs-embed") ? "_top" : undefined)}>
            <span class="ds-card__label">Built-in</span>
            <h2 class="ds-card__title">Design system 1</h2>
            <ds1-library-preview></ds1-library-preview>
            <span class="library-preview-card__foot">The foundation · Components, colours and type</span>
          </a>
        </div>
        ${repeat(libraries, library => library._id, library => html`<div role="listitem">
          <a href=${href(`/l/${library._id}`)} @click=${follow(`/l/${library._id}`)} class="ds-card library-preview-card" data-testid="library-card">
            <span class="ds-card__label" data-testid="state-pill" data-state=${library.state}>${STATE_LABEL[library.state] ?? library.state}${library.publishedVersion === null ? nothing : ` · v${library.publishedVersion}`}</span>
            <h2 class="ds-card__title">${library.name}</h2>
            <ds1-library-preview .libraryId=${library._id}></ds1-library-preview>
            <span class="library-preview-card__foot">Edited ${formatDateTime(library.draftUpdatedAt)} · ${(library.draftBytes / 1024).toFixed(1)} KB</span>
          </a>
        </div>`)}
      </div>
      ${libraries.length === 0 ? empty("Start with Design system 1, or create a library with your own colours and components.", { icon: "templates", level: 2, testid: "library-list-empty" }) : nothing}
    </main>`;
  }
}
defineElement("ds1-library-list", LibraryList);
