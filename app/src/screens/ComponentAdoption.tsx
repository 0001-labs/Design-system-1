import { useAuthActions, useAuthToken } from "@convex-dev/auth/react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { totalSites, type AdoptionReport, type ComponentCell } from "../../../shared/component-adoption";
import "../../../DS1/2-core/ds-button";
import "../../../DS1/1-root/component-tokens.css";
import { IconMatrix } from "./IconAdoption";
import "./component-adoption.css";

type View = "all" | "shared" | "styled" | "local" | "unverified";
const views: { id: View; name: string }[] = [
  { id: "all", name: "All uses" }, { id: "shared", name: "DS1 components" }, { id: "styled", name: "DS1 styles" },
  { id: "local", name: "Local" }, { id: "unverified", name: "Needs review" },
];
const count = (cell: ComponentCell, view: View) => view === "all" ? totalSites(cell) : cell[view];
const kindName = { shared: "DS1 component", styled: "DS1 styles (native)", local: "Local", unverified: "Needs review" };
const cellClass = (cell: ComponentCell, view: View) => {
  if (!count(cell, view)) return "empty";
  if (view !== "all") return view;
  if ([cell.shared, cell.styled, cell.local, cell.unverified].filter(Boolean).length > 1) return "mixed";
  return cell.shared ? "shared" : cell.styled ? "styled" : cell.local ? "local" : "unverified";
};

export function ComponentAdoption({ onSignOut }: { onSignOut?: () => Promise<void> } = {}) {
  const token = useAuthToken();
  const { signOut } = useAuthActions();
  const [report, setReport] = useState<AdoptionReport | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setReport(null); setError("");
    if (!token) return;
    void fetch("/api/reports/components", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "The report could not be loaded.");
        if (data.schema !== 1 || !Array.isArray(data.apps) || !Array.isArray(data.columns)) throw new Error("The report format is not supported.");
        if (!controller.signal.aborted) setReport(data);
      }).catch(caught => { if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "The report could not be loaded."); });
    return () => controller.abort();
  }, [token, retry]);
  return <main className="adoption" data-testid="component-adoption">
    <header className="adoption-heading">
      <div><p className="adoption-eyebrow">Reports · Private</p><h1>Component adoption</h1></div>
      <ds-button onClick={() => void (onSignOut ? onSignOut() : signOut())}>Sign out</ds-button>
    </header>
    {error ? <div role="alert"><p>{error}</p><ds-button onClick={() => setRetry(value => value + 1)}>Try again</ds-button></div>
      : report ? <><ComponentMatrix report={report} /><IconMatrix report={report} /></> : <p role="status">Reading the source snapshot…</p>}
  </main>;
}

/** Kept separate from authentication so the evidence view can be verified with fixtures. */
export function ComponentMatrix({ report }: { report: AdoptionReport }) {
  const [view, setView] = useState<View>("all");
  const [showEmpty, setShowEmpty] = useState(false);
  const [selection, setSelection] = useState<{ app: string; component: string } | null>(null);
  const [limit, setLimit] = useState(100);
  const appGroups = [...new Set(report.apps.map(app => app.group ?? "Products"))];
  const available = report.apps.filter(app => app.status === "scanned");
  const columns = report.columns.filter(column => showEmpty || available.some(app => totalSites(app.cells[column.id]!) > 0));
  const groups = [...new Set(columns.map(column => column.group))];
  const totals = (id: string, mode: View) => available.reduce((sum, app) => sum + count(app.cells[id]!, mode), 0);
  const selectedApp = report.apps.find(app => app.id === selection?.app);
  const selectedColumn = report.columns.find(column => column.id === selection?.component);
  const selected = selectedApp && selection ? selectedApp.cells[selection.component] : undefined;
  const sites = selected?.sites.filter(site => view === "all" || site.kind === view) ?? [];
  const needsReview = available.reduce((sum, app) => sum + Object.values(app.cells).reduce((n, c) => n + c.unverified, 0), 0);
  const priorities = useMemo(() => ["button", "input", "tooltip", "tabs", "text"].map(id => ({
    column: report.columns.find(c => c.id === id)!,
    apps: report.apps.filter(a => a.status === "scanned" && a.migration !== "deferred" && (a.cells[id]?.local ?? 0) > 0),
    total: report.apps.filter(a => a.migration !== "deferred").reduce((sum, a) => sum + (a.cells[id]?.local ?? 0), 0),
  })).filter(row => row.total > 0).slice(0, 3), [report]);
  const scannedAt = new Date(report.generatedAt);
  const old = Date.now() - scannedAt.getTime() > 7 * 24 * 60 * 60 * 1000;

  return <>
    <p className="adoption-intro">One row per app. One column per component. Numbers are places in the web source where a component is used.</p>
    <p className="adoption-meta">Snapshot <time dateTime={report.generatedAt}>{scannedAt.toLocaleString()}</time>{old ? " · More than a week old" : ""} · {available.length} of {report.apps.length} apps scanned · Click a number to inspect it.</p>
    <div className="adoption-controls">
      <div className="adoption-views" role="group" aria-label="Count to show">
        {views.map(option => <ds-button key={option.id} control="host" choice active={view === option.id} aria-pressed={view === option.id} onClick={() => { setView(option.id); setLimit(100); }}>{option.name}</ds-button>)}
      </div>
      <label><input type="checkbox" checked={showEmpty} onChange={event => setShowEmpty(event.target.checked)} /> Show unused components</label>
    </div>
    <div className="adoption-scroll" tabIndex={0} role="region" aria-label="Component adoption matrix, scroll horizontally for more components">
      <table className="adoption-matrix" style={{ width: `calc(${columns.length + 12} * var(--report-unit))` }}>
        <caption className="adoption-sr">{views.find(v => v.id === view)!.name} by app and component. Counts are source sites.</caption>
        <colgroup><col style={{ width: "calc(8 * var(--report-unit))" }} />{columns.map(column => <col key={column.id} style={{ width: "var(--report-unit)" }} />)}<col style={{ width: "calc(4 * var(--report-unit))" }} /></colgroup>
        <thead>
          <tr className="adoption-groups"><th className="adoption-app-column" /><>{groups.map(group => <th key={group} colSpan={columns.filter(c => c.group === group).length} style={{ width: `calc(${columns.filter(c => c.group === group).length} * var(--report-unit))` }} className={`group-${group.toLowerCase()}`} scope="colgroup">{group}</th>)}</><th /></tr>
          <tr className="adoption-column-names"><th className="adoption-app-column" scope="col">App</th>{columns.map(column => <th key={column.id} scope="col" className={`group-${column.group.toLowerCase()}`}><span>{column.name}</span></th>)}<th className="adoption-total" scope="col">Total</th></tr>
        </thead>
        <tbody>{appGroups.map(appGroup => <Fragment key={appGroup}>
          <tr className="adoption-app-group"><th colSpan={columns.length + 2} scope="rowgroup">{appGroup}</th></tr>
          {report.apps.filter(app => (app.group ?? "Products") === appGroup).map(app => <tr key={app.id}>
          <th className="adoption-app-column" scope="row">{app.name}{app.migration === "deferred" && <span className="adoption-deferred"> · Deferred</span>}</th>
          {columns.map(column => {
            const cell = app.cells[column.id];
            if (app.status !== "scanned" || !cell) return <td key={column.id} className="unavailable" aria-label={`${app.name}, ${column.name}: not scanned`}>?</td>;
            const n = count(cell, view);
            return <td key={column.id} className={cellClass(cell, view)}><button type="button" aria-label={`${app.name}, ${column.name}: ${cell.shared} DS1 components, ${cell.styled} DS1 styles, ${cell.local} local, ${cell.unverified} need review`} aria-pressed={selection?.app === app.id && selection.component === column.id} onClick={() => { setSelection({ app: app.id, component: column.id }); setLimit(100); }}>{n || "–"}</button></td>;
          })}
          <td className="adoption-total">{app.status === "scanned" ? Object.values(app.cells).reduce((sum, cell) => sum + count(cell, view), 0) : "?"}</td>
        </tr>)}
        </Fragment>)}</tbody>
        <tfoot>{([ ["shared", "DS1 components"], ["styled", "DS1 styles"], ["local", "Local uses"], ["unverified", "Needs review"] ] as const).map(([kind, name]) => <tr key={kind}>
          <th className="adoption-app-column" scope="row">{name}</th>{columns.map(column => <td key={column.id} className={totals(column.id, kind) ? kind : "empty"}>{totals(column.id, kind) || "–"}</td>)}<td className="adoption-total">{report.columns.reduce((sum, col) => sum + totals(col.id, kind), 0)}</td>
        </tr>)}</tfoot>
      </table>
    </div>
    <div className="adoption-legend" aria-label="Matrix legend">
      <span><i className="shared" /> DS1 components</span><span><i className="styled" /> DS1 styles</span><span><i className="local" /> Local or native</span><span><i className="unverified" /> Needs review</span><span><i className="mixed" /> Mixed</span><span>– No recognized uses</span><span>? Not scanned</span>
    </div>

    {selected && selectedApp && selectedColumn ? <section className="adoption-detail" aria-label="Selected component" aria-live="polite">
      <div className="adoption-detail-heading"><h2>{selectedApp.name} · {selectedColumn.name}</h2><ds-button onClick={() => setSelection(null)}>Close details</ds-button></div>
      {selectedApp.migrationReason && <p>{selectedApp.migrationReason}</p>}
      <p>{selected.shared} DS1 components · {selected.styled} native controls with DS1 styles · {selected.local} local · {selected.unverified} need review. {selected.snapshot === "verified" ? selected.current ? "The shared component copy matches the current DS1 source." : "The shared component copy matches its recorded DS1 revision; a newer source is available." : selected.snapshot === "none" ? "No verified DS1 Lit component snapshot is recorded for this component." : "The DS1 copy could not be fully verified."}</p>
      {selected.issues.length > 0 && <ul>{selected.issues.map(issue => <li key={issue}>{issue}</li>)}</ul>}
      {sites.length ? <><p className="adoption-meta">{sites.length} {view === "all" ? "source sites" : views.find(v => v.id === view)!.name.toLowerCase() + " sites"}. Paths are relative to {selectedApp.name}.</p>
        <div className="adoption-evidence"><table><thead><tr><th>Source</th><th>Element</th><th>Implementation</th></tr></thead><tbody>{sites.slice(0, limit).map((site, i) => <tr key={`${site.file}:${site.line}:${i}`}><td><code>{site.file}:{site.line}</code></td><td><code>{site.tag}</code></td><td>{kindName[site.kind]}</td></tr>)}</tbody></table></div>
        {sites.length > limit && <ds-button onClick={() => setLimit(n => n + 100)}>Show 100 more</ds-button>}</> : <p>No recognized source sites in this view.</p>}
    </section> : null}

    <section className="adoption-next"><h2>Next to consolidate</h2>
      {needsReview > 0 && <p>Verify the {needsReview} DS1 uses marked for review before treating them as shared. Open a cell to see which files differ or lack source evidence.</p>}
      <ol>{priorities.map(row => <li key={row.column.id}><strong>{row.column.name}</strong> · {row.total} local sites across {row.apps.map(a => a.name).join(", ")}. Inspect the local view and move common behavior into DS1.</li>)}</ol>
      <p className="adoption-meta">These are consolidation leads. Native HTML can be intentional; inspect its role before replacing it. Apps marked Deferred remain measured but are excluded from migration recommendations.</p>
    </section>
    <details className="adoption-method"><summary>Source snapshots and counting rules</summary>
      <p>DS1 reference: <code>{report.sourceCommit.slice(0, 10)}</code>{report.sourceDirty ? " + working changes" : ""}. This snapshot describes local source, not what is deployed.</p>
      <div className="adoption-evidence"><table><thead><tr><th>App</th><th>Source revision</th><th>DS1 snapshot</th><th>Files</th><th>Scope</th></tr></thead><tbody>{report.apps.map(app => <tr key={app.id}><th>{app.name}</th><td><code>{app.commit?.slice(0, 10) ?? "Unavailable"}</code>{app.dirty ? " + working changes" : ""}</td><td><code>{app.snapshotCommit?.slice(0, 10) ?? "None"}</code></td><td>{app.files}</td><td>{app.scope.join(", ")}{app.error ? ` · ${app.error}` : ""}</td></tr>)}</tbody></table></div>
      <ul>{report.method.map(rule => <li key={rule}>{rule}</li>)}</ul>
      <p>Refresh the source snapshot with <code>vp run reports:scan</code>; publish it with <code>vp run reports:upload</code>. Reloading this page only reads the last published snapshot.</p>
      {available.some(app => Object.keys(app.otherCustomElements).length > 0) && <details><summary>Custom elements outside this component catalogue</summary>{available.map(app => <p key={app.id}><strong>{app.name}</strong>: {Object.entries(app.otherCustomElements).map(([tag, n]) => `${tag} (${n})`).join(", ") || "None"}</p>)}</details>}
    </details>
  </>;
}
