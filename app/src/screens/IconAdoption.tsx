import { Fragment, useState } from "react";
import type { AdoptionReport, IconCell, IconSite } from "../../../shared/component-adoption";
import "../../../DS1/2-core/ds-icon";

type View = "all" | "differs" | "local";
const views: { id: View; name: string }[] = [{ id: "all", name: "All icons" }, { id: "differs", name: "Needs the DS1 drawing" }, { id: "local", name: "Local only" }];
const statusClass = { shared: "shared", differs: "unverified", local: "local" } as const;
const copyText: Record<IconCell["copy"], string> = {
  same: "The app's copy is today's DS1 drawing.",
  differs: "The app's copy is not today's DS1 drawing. Refresh it from DS1, or bring the change back to DS1.",
  missing: "DS1 draws this icon, but the app's copy of the icon map does not have it.",
  local: "DS1 does not draw this icon; it exists only in this app.",
  none: "The app has no copy of the icon map and takes this drawing from DS1.",
};
/** A copy that is not used shows a mark rather than a count. */
const mark = (cell: IconCell) => cell.uses || (cell.status === "differs" ? "≠" : "+");

/** One row per icon, one column per app: the icons each app names, against today's DS1 drawings. */
export function IconMatrix({ report }: { report: AdoptionReport }) {
  const [view, setView] = useState<View>("all");
  const [selection, setSelection] = useState<{ app: string; icon: string } | null>(null);
  const apps = report.apps.filter(app => app.status === "scanned" && app.icons);
  const ds1 = new Set(report.icons?.names ?? []);
  const rows = [...new Set(apps.flatMap(app => Object.keys(app.icons!.cells)))].sort((a, b) => a.localeCompare(b))
    .filter(name => view === "all" || apps.some(app => app.icons!.cells[name]?.status === view));
  const groups = [{ name: "In DS1", rows: rows.filter(name => ds1.has(name)) }, { name: "Local only", rows: rows.filter(name => !ds1.has(name)) }].filter(group => group.rows.length);
  const tally = (status: IconCell["status"]) => apps.reduce((sum, app) => sum + Object.values(app.icons!.cells).filter(cell => cell.status === status).length, 0);
  const selectedApp = apps.find(app => app.id === selection?.app);
  const selected = selection && selectedApp ? selectedApp.icons!.cells[selection.icon] : undefined;
  const extra = (label: string, pick: (sites: { dynamic: IconSite[]; inline: IconSite[] }) => IconSite[], className: string) => <tr>
    <th className="adoption-app-column" scope="row">{label}</th>
    {apps.map(app => { const n = pick(app.icons!).length; return <td key={app.id} className={n ? className : "empty"}>{n || "–"}</td>; })}
    <td className="adoption-total">{apps.reduce((sum, app) => sum + pick(app.icons!).length, 0)}</td>
  </tr>;

  return <section className="adoption-icons" aria-labelledby="icon-adoption-title">
    <h2 id="icon-adoption-title">Icon adoption</h2>
    <p className="adoption-intro">One row per icon. One column per app. Numbers are places in the web source where an icon is named. {tally("differs")} copies need the DS1 drawing and {tally("local")} icons are local only.</p>
    <div className="adoption-controls">
      <div className="adoption-views" role="group" aria-label="Icons to show">
        {views.map(option => <ds-button key={option.id} control="host" choice active={view === option.id} aria-pressed={view === option.id} onClick={() => setView(option.id)}>{option.name}</ds-button>)}
      </div>
    </div>
    <div className="adoption-scroll" tabIndex={0} role="region" aria-label="Icon adoption matrix">
      <table className="adoption-matrix" style={{ width: `calc(${apps.length + 12} * var(--report-unit))` }}>
        <caption className="adoption-sr">Icons by app. Counts are source sites.</caption>
        <colgroup><col style={{ width: "calc(8 * var(--report-unit))" }} />{apps.map(app => <col key={app.id} style={{ width: "var(--report-unit)" }} />)}<col style={{ width: "calc(4 * var(--report-unit))" }} /></colgroup>
        <thead><tr className="adoption-column-names"><th className="adoption-app-column" scope="col">Icon</th>{apps.map(app => <th key={app.id} scope="col"><span>{app.name}</span></th>)}<th className="adoption-total" scope="col">Total</th></tr></thead>
        <tbody>{groups.map(group => <Fragment key={group.name}>
          <tr className="adoption-app-group"><th colSpan={apps.length + 2} scope="rowgroup">{group.name}</th></tr>
          {group.rows.map(name => <tr key={name}>
            <th className="adoption-app-column" scope="row"><span className="adoption-icon-name"><span>{name}</span>{ds1.has(name) && <ds-icon type={name} aria-hidden="true" />}</span></th>
            {apps.map(app => {
              const cell = app.icons!.cells[name];
              if (!cell || (view !== "all" && cell.status !== view)) return <td key={app.id} className="empty">–</td>;
              return <td key={app.id} className={statusClass[cell.status]}><button type="button" aria-label={`${app.name}, ${name}: ${cell.uses} uses, ${cell.status === "shared" ? "DS1 drawing" : cell.status === "differs" ? "needs the DS1 drawing" : "local only"}`} aria-pressed={selection?.app === app.id && selection.icon === name} onClick={() => setSelection({ app: app.id, icon: name })}>{mark(cell)}</button></td>;
            })}
            <td className="adoption-total">{apps.reduce((sum, app) => sum + (app.icons!.cells[name]?.uses ?? 0), 0)}</td>
          </tr>)}
        </Fragment>)}</tbody>
        <tfoot>{extra("Dynamic names", icons => icons.dynamic, "unverified")}{extra("Inline SVG", icons => icons.inline, "local")}</tfoot>
      </table>
    </div>
    <div className="adoption-legend" aria-label="Icon matrix legend">
      <span><i className="shared" /> DS1 drawing</span><span><i className="unverified" /> Needs the DS1 drawing</span><span><i className="local" /> Local only</span><span>≠ Unused copy that differs</span><span>+ Unused local addition</span><span>– Not named</span>
    </div>
    {selected && selectedApp && selection ? <section className="adoption-detail" aria-label="Selected icon" aria-live="polite">
      <div className="adoption-detail-heading"><h2>{selectedApp.name} · {selection.icon}</h2><ds-button onClick={() => setSelection(null)}>Close details</ds-button></div>
      <p>{selected.uses} uses. {copyText[selected.copy]}{selectedApp.icons!.copy ? ` Copy: ${selectedApp.icons!.copy}.` : ""}</p>
      {selected.sites.length ? <div className="adoption-evidence"><table><thead><tr><th>Source</th><th>Icon</th></tr></thead><tbody>{selected.sites.map((site, i) => <tr key={`${site.file}:${site.line}:${i}`}><td><code>{site.file}:{site.line}</code></td><td><code>{site.name}</code></td></tr>)}</tbody></table></div> : <p>Named in the app's copy only, not in its source.</p>}
    </section> : null}
    <p className="adoption-meta">Dynamic names are ds-icon uses whose name is an expression; inline SVG counts drawings made in the source instead of taken from the set. Both are review leads.</p>
  </section>;
}
