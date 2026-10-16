import { Fragment, useState } from "react";
import type { AdoptionReport, IconAdoption as AppIcons, IconCell, IconKind, IconSite, IconStatus } from "../../../shared/component-adoption";
import "../../../DS1/2-core/ds-icon";

type View = "all" | "differs" | "local";
type Kind = "all" | IconKind;
type Extra = "dynamic" | "inline" | "script" | "fonts";
const views: { id: View; name: string }[] = [{ id: "all", name: "All icons" }, { id: "differs", name: "Needs the DS1 drawing" }, { id: "local", name: "Local only" }];
/** How a site draws its icon, as the filter and the drilldown name it. */
const kinds: { id: IconKind; name: string; about: string }[] = [
  { id: "element", name: "ds-icon", about: "a ds-icon element naming the icon" },
  { id: "component", name: "Components", about: "the app's own React icon component" },
  { id: "library", name: "Icon sets", about: "a component from a package such as Lucide" },
  { id: "file", name: "Files", about: "an imported SVG or an img source" },
  { id: "mask", name: "CSS masks", about: "a CSS mask or background, or a custom property one reads" },
  { id: "font", name: "Icon fonts", about: "a class from an icon font" },
  { id: "glyph", name: "Glyphs", about: "a symbol written as the control's text" },
  { id: "inline", name: "Inline SVG", about: "an svg drawn in the source" },
  { id: "script", name: "Script SVG", about: "an svg made with createElementNS" },
];
const kindName = (kind: IconKind) => kinds.find(option => option.id === kind)!.name;
const statusClass = { shared: "shared", differs: "unverified", local: "local" } as const;
const statusName: Record<IconStatus, string> = { shared: "DS1 drawing", differs: "Needs the DS1 drawing", local: "Local only" };
const severity: Record<IconStatus, number> = { shared: 0, local: 1, differs: 2 };
const copyText: Record<IconCell["copy"], string> = {
  same: "The app's copy of the icon map is today's DS1 drawing.",
  differs: "The app's copy of the icon map is not today's DS1 drawing. Refresh it from DS1, or bring the change back to DS1.",
  missing: "DS1 draws this icon, but the app's copy of the icon map does not have it.",
  local: "DS1 does not draw this icon; it exists only in this app.",
  none: "The app has no copy of the icon map and takes this drawing from DS1.",
};
/** Snapshots from before kinds were recorded hold ds-icon sites only. */
const siteKind = (site: IconSite): IconKind => site.kind ?? "element";
const siteStatus = (site: IconSite, cell?: IconCell): IconStatus => site.status ?? cell?.status ?? "local";
const extras: { id: Extra; name: string; className: string; about: string }[] = [
  { id: "dynamic", name: "Dynamic names", className: "unverified", about: "Their icon is an expression, so it is not named." },
  { id: "inline", name: "Inline SVG", className: "local", about: "Drawings made in the source, or in a data address, that are not a DS1 drawing." },
  { id: "script", name: "Script SVG", className: "local", about: "SVG made with createElementNS that is not a DS1 drawing." },
  { id: "fonts", name: "Icon font sheets", className: "local", about: "Each loads an icon font." },
];
const extraSites = (icons: AppIcons, extra: Extra): IconSite[] =>
  extra === "dynamic" ? icons.dynamic : extra === "fonts" ? icons.fonts ?? [] : icons.inline.filter(site => (siteKind(site) === "script") === (extra === "script"));

/** One row per icon, one column per app: the icons each app names or draws, against today's DS1 drawings. */
export function IconMatrix({ report }: { report: AdoptionReport }) {
  const [view, setView] = useState<View>("all");
  const [kind, setKind] = useState<Kind>("all");
  const [selection, setSelection] = useState<{ app: string; icon?: string; extra?: Extra } | null>(null);
  const apps = report.apps.filter(app => app.status === "scanned" && app.icons);
  const ds1 = new Set(report.icons?.names ?? []);
  /** The sites a cell counts under the current filters; an unused copy has none. */
  const counted = (cell: IconCell | undefined) => cell?.sites.filter(site => (kind === "all" || siteKind(site) === kind) && (view === "all" || siteStatus(site, cell) === view)) ?? [];
  const shown = (cell: IconCell | undefined) => Boolean(cell) && (counted(cell).length > 0 || (kind === "all" && cell!.uses === 0 && (view === "all" || cell!.status === view)));
  const worst = (sites: IconSite[], cell: IconCell) => sites.length ? sites.reduce<IconStatus>((status, site) => severity[siteStatus(site, cell)] > severity[status] ? siteStatus(site, cell) : status, "shared") : cell.status;
  const extraCount = (icons: AppIcons, extra: Extra) => extraSites(icons, extra).filter(site => kind === "all" || siteKind(site) === kind).length;
  const present = (option: IconKind) => apps.some(app => Object.values(app.icons!.cells).some(cell => cell.sites.some(site => siteKind(site) === option)) || [...app.icons!.inline, ...app.icons!.dynamic, ...(app.icons!.fonts ?? [])].some(site => siteKind(site) === option));
  const presentKinds = kinds.filter(option => present(option.id));
  const rows = [...new Set(apps.flatMap(app => Object.keys(app.icons!.cells)))].sort((a, b) => a.localeCompare(b)).filter(name => apps.some(app => shown(app.icons!.cells[name])));
  const standsFor = (name: string) => apps.map(app => app.icons!.cells[name]?.ds1).find(Boolean);
  const groups = [
    { name: "In DS1", rows: rows.filter(name => ds1.has(name)) },
    { name: "Local, DS1 has the icon", rows: rows.filter(name => !ds1.has(name) && standsFor(name)) },
    { name: "Local only", rows: rows.filter(name => !ds1.has(name) && !standsFor(name)) },
  ].filter(group => group.rows.length);
  const extraRows = view === "differs" ? [] : extras.filter(extra => apps.some(app => extraCount(app.icons!, extra.id) > 0));
  const tally = (status: IconStatus) => apps.reduce((sum, app) => sum + Object.values(app.icons!.cells).reduce((n, cell) => n + cell.sites.filter(site => siteStatus(site, cell) === status).length, 0), 0);
  const selectedApp = apps.find(app => app.id === selection?.app);
  const selected = selection?.icon && selectedApp ? selectedApp.icons!.cells[selection.icon] : undefined;
  const selectedExtra = extras.find(extra => extra.id === selection?.extra);
  const selectedSites = selected ? (counted(selected).length ? counted(selected) : selected.sites) : selectedExtra && selectedApp ? extraSites(selectedApp.icons!, selectedExtra.id).filter(site => kind === "all" || siteKind(site) === kind) : [];
  const drawsThroughMap = selected ? !selected.uses || selected.sites.some(site => ["element", "component"].includes(siteKind(site))) : false;

  return <section className="adoption-icons" aria-labelledby="icon-adoption-title">
    <h2 id="icon-adoption-title">Icon adoption</h2>
    <p className="adoption-intro">One row per icon. One column per app. Numbers are places in the web source where an icon is named or drawn: {tally("shared")} draw the DS1 drawing, {tally("differs")} need it and {tally("local")} are local only.</p>
    <div className="adoption-controls">
      <div className="adoption-views" role="group" aria-label="Icons to show">
        {views.map(option => <ds-button key={option.id} control="host" choice active={view === option.id} aria-pressed={view === option.id} onClick={() => setView(option.id)}>{option.name}</ds-button>)}
      </div>
      <div className="adoption-views" role="group" aria-label="How the icon is drawn">
        {[{ id: "all" as Kind, name: "Every kind" }, ...presentKinds].map(option => <ds-button key={option.id} control="host" choice active={kind === option.id} aria-pressed={kind === option.id} onClick={() => setKind(option.id)}>{option.name}</ds-button>)}
      </div>
    </div>
    <div className="adoption-scroll" tabIndex={0} role="region" aria-label="Icon adoption matrix">
      <table className="adoption-matrix" style={{ width: `calc(${apps.length + 12} * var(--report-unit))` }}>
        <caption className="adoption-sr">Icons by app. Counts are source sites{kind === "all" ? "" : `, ${kindName(kind)} only`}.</caption>
        <colgroup><col style={{ width: "calc(8 * var(--report-unit))" }} />{apps.map(app => <col key={app.id} style={{ width: "var(--report-unit)" }} />)}<col style={{ width: "calc(4 * var(--report-unit))" }} /></colgroup>
        <thead><tr className="adoption-column-names"><th className="adoption-app-column" scope="col">Icon</th>{apps.map(app => <th key={app.id} scope="col"><span>{app.name}</span></th>)}<th className="adoption-total" scope="col">Total</th></tr></thead>
        <tbody>{groups.map(group => <Fragment key={group.name}>
          <tr className="adoption-app-group"><th colSpan={apps.length + 2} scope="rowgroup">{group.name}</th></tr>
          {group.rows.map(name => {
            const stands = ds1.has(name) ? undefined : standsFor(name);
            return <tr key={name}>
              <th className="adoption-app-column" scope="row"><span className="adoption-icon-name"><span>{name}</span>{ds1.has(name) && <ds-icon type={name} aria-hidden="true" />}{stands && <><span className="adoption-sr">, stands for DS1 {stands}</span><ds-icon className="adoption-icon-stands" type={stands} aria-hidden="true" /></>}</span></th>
              {apps.map(app => {
                const cell = app.icons!.cells[name];
                if (!cell || !shown(cell)) return <td key={app.id} className="empty">–</td>;
                const sites = counted(cell);
                const status = worst(sites, cell);
                return <td key={app.id} className={statusClass[status]}><button type="button" aria-label={`${app.name}, ${name}: ${sites.length} sites, ${statusName[status].toLowerCase()}`} aria-pressed={selection?.app === app.id && selection.icon === name} onClick={() => setSelection({ app: app.id, icon: name })}>{sites.length || (cell.status === "differs" ? "≠" : "+")}</button></td>;
              })}
              <td className="adoption-total">{apps.reduce((sum, app) => sum + counted(app.icons!.cells[name]).length, 0)}</td>
            </tr>;
          })}
        </Fragment>)}</tbody>
        {extraRows.length > 0 && <tfoot>{extraRows.map(extra => <tr key={extra.id}>
          <th className="adoption-app-column" scope="row">{extra.name}</th>
          {apps.map(app => { const n = extraCount(app.icons!, extra.id); return <td key={app.id} className={n ? extra.className : "empty"}>{n ? <button type="button" aria-label={`${app.name}, ${extra.name}: ${n} sites`} aria-pressed={selection?.app === app.id && selection.extra === extra.id} onClick={() => setSelection({ app: app.id, extra: extra.id })}>{n}</button> : "–"}</td>; })}
          <td className="adoption-total">{apps.reduce((sum, app) => sum + extraCount(app.icons!, extra.id), 0)}</td>
        </tr>)}</tfoot>}
      </table>
    </div>
    <div className="adoption-legend" aria-label="Icon matrix legend">
      <span><i className="shared" /> DS1 drawing</span><span><i className="unverified" /> Needs the DS1 drawing</span><span><i className="local" /> Local only</span><span>≠ Unused copy that differs</span><span>+ Unused local addition</span><span>– Not named</span>
    </div>
    <dl className="adoption-kinds" aria-label="Kinds of icon sites">
      {presentKinds.map(option => <div key={option.id}><dt>{option.name}</dt><dd>{option.about}</dd></div>)}
    </dl>
    {selectedApp && selection && (selected || selectedExtra) ? <section className="adoption-detail" aria-label="Selected icon" aria-live="polite">
      <div className="adoption-detail-heading"><h2>{selectedApp.name} · {selection.icon ?? selectedExtra!.name}</h2><ds-button onClick={() => setSelection(null)}>Close details</ds-button></div>
      {selected ? <p>{selected.uses} sites. {drawsThroughMap ? copyText[selected.copy] : `${statusName[selected.status]}.`}{selected.ds1 ? ` It stands for DS1's ${selected.ds1}.` : ""}{drawsThroughMap && selectedApp.icons!.copy ? ` Icon map copy: ${selectedApp.icons!.copy}.` : ""}</p>
        : <p>{selectedSites.length} sites. {selectedExtra!.about}</p>}
      {selectedSites.length ? <div className="adoption-evidence"><table><thead><tr><th>Source</th><th>Kind</th><th>Written as</th><th>Drawing</th><th>Status</th></tr></thead><tbody>{selectedSites.map((site, i) => <tr key={`${site.file}:${site.line}:${i}`}>
        <td><code>{site.file}:{site.line}</code></td><td>{kindName(siteKind(site))}</td><td><code>{site.name}</code></td><td>{site.drawing ? <code>{site.drawing}</code> : "–"}</td><td>{statusName[siteStatus(site, selected)]}</td>
      </tr>)}</tbody></table></div> : <p>Named in the app's copy only, not in its source.</p>}
    </section> : null}
    <p className="adoption-meta">Files, masks and pasted drawings are compared with DS1's drawings by their geometry. Glyphs are mapped to the DS1 icon they stand for; arrows in running text are not counted. Dynamic names, inline SVG and script SVG are review leads.</p>
  </section>;
}
