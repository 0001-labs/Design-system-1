import { html, nothing } from "lit";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import "../../../DS1/1-root/component-tokens.css";
import "../../../DS1/1-root/controls.css";
import "../../../DS1/2-core/ds-checkbox";
import "../../../DS1/3-unit/ds-list";
import "../../../DS1/3-unit/ds-row";
import { appIdentity, componentIdentity, totalSites, type AdoptionReport, type ComponentCell } from "../../../shared/component-adoption";
import { AppElement, defineElement } from "../lib/element";
import { accordion, accordionId, splitButton } from "../lib/ui";
import "../../../DS1/0-face/tooltips";
import "./IconAdoption";
import "./component-adoption.css";

type View = "all" | "shared" | "styled" | "local" | "unverified";
const views: { id: View; name: string }[] = [
  { id: "all", name: "All uses" }, { id: "shared", name: "DS1 components" }, { id: "styled", name: "DS1 styles" },
  { id: "local", name: "Local" }, { id: "unverified", name: "Needs review" },
];
const count = (cell: ComponentCell, view: View) => view === "all" ? totalSites(cell) : cell[view];
const kindName = { shared: "DS1 component", styled: "DS1 styles", local: "Local", unverified: "Needs review" };
const cellClass = (cell: ComponentCell, view: View) => {
  if (!count(cell, view)) return "empty";
  if (view !== "all") return view;
  if ([cell.shared, cell.styled, cell.local, cell.unverified].filter(Boolean).length > 1) return "mixed";
  return cell.shared ? "shared" : cell.styled ? "styled" : cell.local ? "local" : "unverified";
};

/** Kept separate from authentication so the evidence view can be verified with fixtures. */
export class ComponentMatrix extends AppElement {
  static properties = {
    report: { attribute: false },
    view: { state: true },
    showEmpty: { state: true },
    selection: { state: true },
    limit: { state: true },
    open: { state: true },
  };
  declare report: AdoptionReport;
  declare view: View;
  declare showEmpty: boolean;
  declare selection: { app: string; component: string } | null;
  declare limit: number;
  declare open: ReadonlySet<string>;
  #ids = { method: accordionId(), elements: accordionId(), parts: accordionId() };
  #priorities: { report: AdoptionReport; rows: { column: AdoptionReport["columns"][number]; apps: AdoptionReport["apps"]; total: number }[] } | null = null;

  constructor() {
    super();
    this.view = "all";
    this.showEmpty = true;
    this.selection = null;
    this.limit = 100;
    this.open = new Set();
  }

  #accordion(id: string, summary: string, content: unknown, className?: string) {
    return accordion(id, summary, content, this.open.has(id), open => {
      const next = new Set(this.open);
      if (open) next.add(id); else next.delete(id);
      this.open = next;
    }, className);
  }

  #prioritiesFor(report: AdoptionReport) {
    if (this.#priorities?.report !== report) {
      this.#priorities = { report, rows: ["button", "input", "tooltip", "tabs", "text"].map(id => ({
        column: report.columns.find(c => c.id === id)!,
        apps: report.apps.filter(a => a.status === "scanned" && a.migration !== "deferred" && (a.cells[id]?.local ?? 0) > 0),
        total: report.apps.filter(a => a.migration !== "deferred").reduce((sum, a) => sum + (a.cells[id]?.local ?? 0), 0),
      })).filter(row => row.total > 0).slice(0, 3) };
    }
    return this.#priorities.rows;
  }

  override render() {
    const { report, view, selection, limit } = this;
    const appGroups = [...new Set(report.apps.map(app => app.group ?? "Products"))];
    const available = report.apps.filter(app => app.status === "scanned");
    const columns = report.columns.filter(column => this.showEmpty || available.some(app => totalSites(app.cells[column.id]!) > 0));
    const groups = [...new Set(columns.map(column => column.group))];
    const totals = (id: string, mode: View) => available.reduce((sum, app) => sum + count(app.cells[id]!, mode), 0);
    const selectedApp = report.apps.find(app => app.id === selection?.app);
    const selectedColumn = report.columns.find(column => column.id === selection?.component);
    const selected = selectedApp && selection ? selectedApp.cells[selection.component] : undefined;
    const sites = selected?.sites.filter(site => view === "all" || site.kind === view) ?? [];
    const needsReview = available.reduce((sum, app) => sum + Object.values(app.cells).reduce((n, c) => n + c.unverified, 0), 0);
    const priorities = this.#prioritiesFor(report);
    const scannedAt = new Date(report.generatedAt);
    const old = Date.now() - scannedAt.getTime() > 7 * 24 * 60 * 60 * 1000;

    return html`
      <p class="adoption-intro">One row per app. One column per Root foundation or component. Numbers count authored source sites; Root counts stylesheet and module connections, including their imported foundations.</p>
      <p class="adoption-meta">Snapshot <time datetime=${report.generatedAt}>${scannedAt.toLocaleString()}</time>${old ? " · More than a week old" : ""} · ${available.length} of ${report.apps.length} apps scanned · Click a number to inspect it.</p>
      <div class="adoption-controls">
        ${splitButton("Count to show", views.map(option => ({ value: option.id, label: option.name })), view, (next: View) => { this.view = next; this.limit = 100; }, "adoption-views")}
        <label><ds-checkbox><input type="checkbox" .checked=${live(this.showEmpty)} @change=${(event: Event) => { this.showEmpty = (event.target as HTMLInputElement).checked; }} /></ds-checkbox> Show unused components</label>
      </div>
      <div class="adoption-scroll ds-table-scroll" tabindex="0" role="region" aria-label="Component adoption matrix, scroll horizontally for more components">
        <table class="adoption-matrix ds-table" data-sticky style=${`width: calc(${columns.length + 12} * var(--report-unit))`}>
          <caption class="adoption-sr">${views.find(v => v.id === view)!.name} by app and component. Counts are source sites.</caption>
          <colgroup><col style="width: calc(8 * var(--report-unit))" />${columns.map(() => html`<col style="width: var(--report-unit)" />`)}<col style="width: calc(4 * var(--report-unit))" /></colgroup>
          <thead>
            <tr class="adoption-groups"><th class="adoption-app-column"></th>${groups.map(group => { const span = columns.filter(c => c.group === group).length; return html`<th colspan=${span} style=${`width: calc(${span} * var(--report-unit))`} class=${`group-${group.toLowerCase()}`} scope="colgroup">${group}</th>`; })}<th></th></tr>
            <tr class="adoption-column-names"><th class="adoption-app-column" scope="col">App</th>${columns.map(column => html`<th scope="col" class=${`group-${column.group.toLowerCase()}`}><span data-tooltip=${componentIdentity(column)}>${column.name}</span></th>`)}<th class="adoption-total" scope="col" data-numeric>Total</th></tr>
          </thead>
          <tbody>${appGroups.map(appGroup => html`
            <tr class="adoption-app-group"><th colspan=${columns.length + 2} scope="rowgroup">${appGroup}</th></tr>
            ${repeat(report.apps.filter(app => (app.group ?? "Products") === appGroup), app => app.id, app => html`<tr>
              <th class="adoption-app-column" scope="row" data-tooltip=${appIdentity(app)}>${app.name}${app.migration === "deferred" ? html`<span class="adoption-deferred"> · Deferred</span>` : nothing}</th>
              ${columns.map(column => {
                const cell = app.cells[column.id];
                if (app.status !== "scanned" || !cell) return html`<td class="unavailable" aria-label=${`${app.name}, ${column.name}: not scanned`}>?</td>`;
                const n = count(cell, view);
                return html`<td class=${cellClass(cell, view)}><button type="button" aria-label=${`${app.name}, ${column.name}: ${cell.shared} DS1 components, ${cell.styled} DS1 styles, ${cell.local} local, ${cell.unverified} need review`} aria-pressed=${String(selection?.app === app.id && selection.component === column.id)} @click=${() => { this.selection = { app: app.id, component: column.id }; this.limit = 100; }}>${n || "–"}</button></td>`;
              })}
              <td class="adoption-total" data-numeric>${app.status === "scanned" ? Object.values(app.cells).reduce((sum, cell) => sum + count(cell, view), 0) : "?"}</td>
            </tr>`)}`)}</tbody>
          <tfoot>${([["shared", "DS1 components"], ["styled", "DS1 styles"], ["local", "Local uses"], ["unverified", "Needs review"]] as const).map(([kind, name]) => html`<tr>
            <th class="adoption-app-column" scope="row">${name}</th>${columns.map(column => html`<td class=${totals(column.id, kind) ? kind : "empty"}>${totals(column.id, kind) || "–"}</td>`)}<td class="adoption-total" data-numeric>${report.columns.reduce((sum, col) => sum + totals(col.id, kind), 0)}</td>
          </tr>`)}</tfoot>
        </table>
      </div>
      <div class="adoption-legend" aria-label="Matrix legend">
        <span><i class="shared"></i> DS1 components</span><span><i class="styled"></i> DS1 styles</span><span><i class="local"></i> Local or native</span><span><i class="unverified"></i> Needs review</span><span><i class="mixed"></i> Mixed</span><span>– No recognized uses</span><span>? Not scanned</span>
      </div>

      ${selected && selectedApp && selectedColumn ? html`<section class="adoption-detail" aria-label="Selected component" aria-live="polite">
        <div class="adoption-detail-heading"><h2>${selectedApp.name} · ${selectedColumn.name}</h2><ds-button @click=${() => { this.selection = null; }}>Close details</ds-button></div>
        ${selectedApp.migrationReason ? html`<p>${selectedApp.migrationReason}</p>` : nothing}
        <p>${selected.shared} DS1 components · ${selected.styled} sites with DS1 styles · ${selected.local} local · ${selected.unverified} need review. ${selectedColumn.group === "Root" ? "Root counts stylesheet and module connections, including imported foundations; it does not count each element that inherits them." : selected.snapshot === "verified" ? selected.current ? "The shared component copy matches the current DS1 source." : "The shared component copy matches its recorded DS1 revision; a newer source is available." : selected.snapshot === "none" ? "No verified DS1 Lit component snapshot is recorded for this component." : "The DS1 copy could not be fully verified."}</p>
        ${selected.issues.length > 0 ? html`<ds-list role="list">${selected.issues.map(issue => html`<ds-row auto role="listitem"><p>${issue}</p></ds-row>`)}</ds-list>` : nothing}
        ${sites.length ? html`<p class="adoption-meta">${sites.length} ${view === "all" ? "source sites" : views.find(v => v.id === view)!.name.toLowerCase() + " sites"}. Paths are relative to ${selectedApp.name}.</p>
          <div class="adoption-evidence"><table class="ds-table"><thead><tr><th>Source</th><th>Element</th><th>Implementation</th></tr></thead><tbody>${sites.slice(0, limit).map(site => html`<tr><td><code>${site.file}:${site.line}</code></td><td><code>${site.tag}</code></td><td>${kindName[site.kind]}</td></tr>`)}</tbody></table></div>
          ${sites.length > limit ? html`<ds-button @click=${() => { this.limit += 100; }}>Show 100 more</ds-button>` : nothing}` : html`<p>No recognized source sites in this view.</p>`}
      </section>` : nothing}

      <section class="adoption-next"><h2>Next to consolidate</h2>
        ${needsReview > 0 ? html`<p>Verify the ${needsReview} DS1 uses marked for review before treating them as shared. Open a cell to see which files differ or lack source evidence.</p>` : nothing}
        <ds-list role="list" class="adoption-list">${priorities.map(row => html`<ds-row auto role="listitem"><p><strong>${row.column.name}</strong> · ${row.total} local sites across ${row.apps.map(a => a.name).join(", ")}. Inspect the local view and move common behavior into DS1.</p></ds-row>`)}</ds-list>
        <p class="adoption-meta">These are consolidation leads. Native HTML can be intentional; inspect its role before replacing it. Apps marked Deferred remain measured but are excluded from migration recommendations.</p>
      </section>
      ${this.#accordion(this.#ids.method, "Source snapshots and counting rules", html`
        <p>DS1 reference: <code>${report.sourceCommit.slice(0, 10)}</code>${report.sourceDirty ? " + working changes" : ""}. This snapshot describes local source, not what is deployed.</p>
        <div class="adoption-evidence"><table class="ds-table"><thead><tr><th>App</th><th>Source revision</th><th>DS1 snapshot</th><th data-numeric>Files</th><th>Scope</th></tr></thead><tbody>${report.apps.map(app => html`<tr><th>${app.name}</th><td><code>${app.commit?.slice(0, 10) ?? "Unavailable"}</code>${app.dirty ? " + working changes" : ""}</td><td><code>${app.snapshotCommit?.slice(0, 10) ?? "None"}</code></td><td data-numeric>${app.files}</td><td>${app.scope.join(", ")}${app.error ? ` · ${app.error}` : ""}</td></tr>`)}</tbody></table></div>
        <ds-list role="list" class="adoption-list">${report.method.map(rule => html`<ds-row auto role="listitem"><p>${rule}</p></ds-row>`)}</ds-list>
        <p>Refresh the source snapshot with <code>vp run reports:scan</code>; publish it with <code>vp run reports:upload</code>. Reloading this page only reads the last published snapshot.</p>
        ${available.some(app => Object.keys(app.otherCustomElements).length > 0) ? this.#accordion(this.#ids.elements, "Custom elements outside this component catalogue", available.map(app => html`<p><strong>${app.name}</strong>: ${Object.entries(app.otherCustomElements).map(([tag, n]) => `${tag} (${n})`).join(", ") || "None"}</p>`)) : nothing}
        ${available.some(app => Object.keys(app.sharedParts ?? {}).length > 0 || (app.gaps?.range?.length ?? 0) > 0) ? this.#accordion(this.#ids.parts, "Shared parts and known gaps", html`<p>Shared parts are custom elements copied from a studio part, not product-local; a Sync 1 lock that matches the copy is named. Ranges (range inputs and slider roles) have no DS1 column yet.</p>${available.map(app => html`<p><strong>${app.name}</strong>: ${[...Object.entries(app.sharedParts ?? {}).map(([tag, part]) => `${tag} (${part.uses}${part.lock ? `, ${part.lock} lock` : ""})`), ...(app.gaps?.range?.length ? [`ranges (${app.gaps.range.length})`] : [])].join(", ") || "None"}</p>`)}`) : nothing}
      `, "adoption-method")}
    `;
  }
}
defineElement("ds1-component-matrix", ComponentMatrix);
