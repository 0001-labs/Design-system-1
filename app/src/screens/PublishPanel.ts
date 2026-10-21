import { validateCss, type Issue } from "@ds-one/css-validate";
import { html, nothing } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { confirm, copyText } from "../../../DS1/0-face/feedback";
import { formatDateTime } from "../../../DS1/0-face/format";
import "../../../DS1/1-root/controls.css";
import "../../../DS1/2-core/ds-badge";
import "../../../DS1/3-unit/ds-list";
import "../../../DS1/3-unit/ds-row";
import "../../../DS1/4-page/ds-panel";
import { action, LiveQuery } from "../lib/backend";
import { downloadCss } from "../lib/download";
import { AppElement, defineElement } from "../lib/element";
import { button, empty, loading, notice } from "../lib/ui";

type Stage = "idle" | "publishing";

const STATE_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  "unpublished-changes": "Unpublished changes",
  "failed-validation": "Last publish failed",
  publishing: "Publishing",
  archived: "Archived",
};

function parseIssues(raw: string | null): Issue[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Issue[]) : [];
  } catch {
    return [];
  }
}

/** The library's overview: its problems, publishing, install and pin entries, downloads and history. `publish-close` asks to close it. */
export class PublishPanel extends AppElement {
  static properties = {
    libraryId: { attribute: false },
    publicId: { attribute: false },
    name: { attribute: false },
    slug: { attribute: false },
    css: { attribute: false },
    draftRev: { attribute: false },
    state: { attribute: false },
    publishedVersion: { attribute: false },
    installUrl: { attribute: false },
    /** Sticky issues from the last failed publish, as stored JSON. */
    lastPublishError: { attribute: false },
    stage: { state: true },
    error: { state: true },
    serverIssues: { state: true },
  };
  declare libraryId: string;
  declare publicId: string;
  declare name: string;
  declare slug: string;
  declare css: string;
  declare draftRev: number;
  declare state: string;
  declare publishedVersion: number | null;
  declare installUrl: string | null;
  declare lastPublishError: string | null;
  declare stage: Stage;
  declare error: string | null;
  declare serverIssues: Issue[] | null;

  #history = new LiveQuery(this, api.versions.history, () => ({ id: this.libraryId as Id<"libraries"> }));
  #validated: { css: string; issues: Issue[] } | null = null;

  constructor() {
    super();
    this.css = "";
    this.publishedVersion = null;
    this.installUrl = null;
    this.lastPublishError = null;
    this.stage = "idle";
    this.error = null;
    this.serverIssues = null;
  }

  /**
   * Client-side validation is advisory — the deployment re-runs it and is
   * authoritative. A user on a cached bundle can legitimately disagree with the
   * server, which is exactly why server-returned issues render through this
   * same list rather than a separate error path.
   */
  #localIssues() {
    if (this.#validated?.css !== this.css) this.#validated = { css: this.css, issues: validateCss(this.css).issues };
    return this.#validated.issues;
  }

  async #publish() {
    this.stage = "publishing";
    this.error = null;
    this.serverIssues = null;
    try {
      await action(api.publish.publish, { id: this.libraryId as Id<"libraries">, baseRev: this.draftRev });
    } catch (caught) {
      const data = (caught as { data?: { code?: string; message?: string; details?: { issues?: string } } }).data;
      if (data?.code === "validation_failed" && data.details?.issues) this.serverIssues = parseIssues(data.details.issues);
      this.error = data?.message ?? "Publishing failed.";
    } finally {
      this.stage = "idle";
    }
  }

  async #rollback(version: number) {
    const sure = await confirm({
      title: `Roll back to v${version}?`,
      text: "The live stylesheet goes back to this version. Every version stays published at its own address.",
      confirm: "Roll back",
    });
    if (!sure) return;
    void action(api.versions.rollback, { id: this.libraryId as Id<"libraries">, version });
  }

  override render() {
    const history = this.#history.value;
    const localIssues = this.#localIssues();
    const issues = this.serverIssues ?? (localIssues.length > 0 ? localIssues : parseIssues(this.lastPublishError));
    const blocking = issues.filter(issue => issue.severity === "error");
    const snippet = this.installUrl ? `<link rel="stylesheet" href="${this.installUrl}">` : null;
    // A product that pins the live version copies it with Sync 1, which records its hash.
    const pin = this.publishedVersion !== null
      ? JSON.stringify({ library: { to: "src/design", id: this.publicId, version: this.publishedVersion } }, null, 2)
      : null;
    const failed = history?.events.filter(event => event.status === "failed") ?? [];

    return html`<ds-panel class="publish-panel" data-testid="publish-panel">
      <ds-row slot="header" fill>
        <h2 class="ds-text ds-text--heading">System overview</h2>
        ${button("Close", () => this.emit("publish-close"))}
      </ds-row>

      <p class="ds-text">${history ? `${history.versions.filter(version => version.status === "published").length} published versions` : "Loading publications…"}</p>
      <p class="ds-text ds-text--muted">Installation locations are not tracked yet.</p>
      <ds-badge class="library-card__state" data-state=${this.state} data-testid="state-pill">${STATE_LABEL[this.state] ?? this.state}${this.publishedVersion !== null ? ` · v${this.publishedVersion}` : ""}</ds-badge>

      ${blocking.length > 0 ? html`<section class="publish-issues">
        <h3 class="ds-text ds-text--danger">${blocking.length === 1 ? "1 problem" : `${blocking.length} problems`}</h3>
        <ds-list role="list">
          ${blocking.map(issue => html`<ds-row auto role="listitem" data-testid="validation-issue">
            <div>
              <p class="ds-text ds-text--small"><code>${issue.code}</code>${issue.line !== undefined ? html`<span class="ds-text--muted"> line ${issue.line}</span>` : nothing}</p>
              <p class="ds-text">${issue.message}</p>
              ${issue.detail ? html`<p class="ds-text ds-text--small ds-text--muted">${issue.detail}</p>` : nothing}
            </div>
          </ds-row>`)}
        </ds-list>
      </section>` : nothing}

      ${this.error && blocking.length === 0 ? notice(this.error, { tone: "danger", testid: "publish-error" }) : nothing}

      ${button(this.stage === "publishing" ? "Publishing…" : "Publish", () => void this.#publish(), { primary: true, testid: "publish-button", disabled: this.stage === "publishing" || blocking.length > 0 })}

      <section>
        <h3 class="ds-text ds-text--muted">Install</h3>
        ${snippet ? html`<pre data-testid="install-snippet">${snippet}</pre>
          ${button("Copy install link", () => void copyText(snippet), { testid: "install-link" })}`
          // A copied link to a 404 is the obvious top support ticket.
          : empty("Publish once to get an install link.", { heading: "No install link yet" })}
      </section>

      <section>
        <h3 class="ds-text ds-text--muted">Pin in a product</h3>
        ${pin ? html`<p class="ds-text ds-text--small ds-text--muted">
            Under Design system 1 in the product's sync.json. Sync 1 copies this version and records its hash, so the product keeps it until it pins another.
          </p>
          <pre data-testid="pin-snippet">${pin}</pre>
          ${button("Copy Sync 1 entry", () => void copyText(pin), { testid: "pin-entry" })}`
          : empty("Publish once to pin a version in a product.", { heading: "Nothing to pin yet" })}
      </section>

      <section>
        <h3 class="ds-text ds-text--muted">Download</h3>
        <ds-row>
          ${button("Download draft", () => downloadCss(this.css, `${this.slug}-draft.css`))}
          ${this.installUrl ? button("Download published", () => {
            // Fetched from the public URL, so it is byte-identical to what
            // customers receive rather than to what the editor happens to hold.
            void fetch(this.installUrl!).then(response => response.text()).then(text => downloadCss(text, `${this.slug}-v${this.publishedVersion}.css`));
          }) : nothing}
        </ds-row>
      </section>

      <section>
        <h3 class="ds-text ds-text--muted">History</h3>
        ${history === undefined ? loading("Loading the history")
          : history.versions.length === 0 ? empty("Each version you publish is listed here.", { heading: "Nothing published yet" })
          : html`<ds-list role="list" class="version-list" data-testid="version-list">
            ${repeat(history.versions, version => version.version, version => html`<ds-row fill role="listitem">
              <ds-row>
                <strong class="ds-text ds-text--strong">v${version.version}</strong>
                ${version.isLive ? html`<ds-badge class="version-live">Live</ds-badge>` : nothing}
                <span class="ds-text ds-text--small ds-text--muted">${version.byteSize} bytes</span>
              </ds-row>
              ${!version.isLive && version.status === "published" ? button("Roll back", () => void this.#rollback(version.version), { testid: `rollback-${version.version}` }) : nothing}
            </ds-row>`)}
          </ds-list>`}
        ${failed.length ? html`<ds-list role="list" class="event-list" data-testid="failed-events">
          ${repeat(failed.slice(0, 5), event => event._id, event => html`<ds-row role="listitem">
            <span class="ds-text ds-text--small ds-text--danger">Failed at ${event.failureStage ?? "unknown"} · ${formatDateTime(event.startedAt)}</span>
          </ds-row>`)}
        </ds-list>` : nothing}
      </section>
    </ds-panel>`;
  }
}
defineElement("ds1-publish-panel", PublishPanel);
