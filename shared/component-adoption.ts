import { ALL_LAYERS } from "./component-directory";
/** Source evidence only. A site in a loop still counts once. */
export type AdoptionKind = "shared" | "styled" | "local" | "unverified";
export interface ComponentColumn { id: string; name: string; group: string }
export interface UsageSite { file: string; line: number; tag: string; kind: AdoptionKind }
export interface ComponentCell {
  shared: number;
  styled: number;
  local: number;
  unverified: number;
  sites: UsageSite[];
  snapshot: "verified" | "modified" | "unverified" | "none";
  current: boolean | null;
  issues: string[];
}
export interface AdoptionApp {
  id: string;
  name: string;
  status: "scanned" | "unavailable";
  commit: string | null;
  dirty: boolean;
  files: number;
  scope: string[];
  snapshotCommit: string | null;
  cells: Record<string, ComponentCell>;
  otherCustomElements: Record<string, number>;
  error?: string;
  group?: "Products" | "Clients";
  migration?: "deferred";
  migrationReason?: string;
}
export interface AdoptionReport {
  schema: 1;
  generatedAt: string;
  sourceCommit: string;
  sourceDirty: boolean;
  columns: ComponentColumn[];
  apps: AdoptionApp[];
  method: string[];
}

/** Implementation IDs remain distinct for provenance checks and source drilldowns. */
export const IMPLEMENTATION_COLUMNS: ComponentColumn[] = [
  ...["button", "split", "checkbox", "radio", "switch", "text", "badge", "token", "avatar", "icon", "input", "file-picker", "color", "swatch", "select", "textarea", "composer", "tooltip", "cycle", "date", "language", "gap", "banner", "card", "pagedots", "chart", "toggle", "loading", "spacing-handle"].map(id => ({ id, name: id, group: "Core" })),
  ...["token-field", "avatar-group", "row", "list", "tabs", "menu", "accordion", "form", "table", "sidebar", "navigation", "unit-card"].map(id => ({ id, name: id, group: "Unit" })),
  ...["dialog", "panel", "container", "layout", "grid"].map(id => ({ id, name: id, group: "Page" })),
];
const family = (id: string) => id === "split" ? "button" : id === "switch" ? "toggle" : id;
const specialistNames: Record<string, string> = { "file-picker": "File picker", textarea: "Text area", pagedots: "Page dots", "token-field": "Token field", "avatar-group": "Avatar group", "spacing-handle": "Spacing handle" };
/** Names and layers come from the same catalogue as the documentation and editor. */
export const COMPONENT_COLUMNS: ComponentColumn[] = IMPLEMENTATION_COLUMNS.filter(column => family(column.id) === column.id).map(column => {
  const layer = ALL_LAYERS.find(layer => layer.number > 1 && layer.entries.some(entry => entry.tag === `ds-${column.id}` || (column.id === "unit-card" ? entry.href === "/3-unit/card/" : !entry.tag && entry.href.split("/").filter(Boolean).at(-1) === column.id)));
  const entry = layer?.entries.find(entry => entry.tag === `ds-${column.id}` || (column.id === "unit-card" ? entry.href === "/3-unit/card/" : !entry.tag && entry.href.split("/").filter(Boolean).at(-1) === column.id));
  return { id: column.id, name: entry?.name ?? specialistNames[column.id] ?? column.id[0]!.toUpperCase() + column.id.slice(1), group: layer?.name ?? column.group };
}).sort((a, b) => ["Core", "Unit", "Page"].indexOf(a.group) - ["Core", "Unit", "Page"].indexOf(b.group) || a.name.localeCompare(b.name));

/** Compatibility modes share a column without changing any authored-site evidence. */
export function catalogueApp(app: AdoptionApp): AdoptionApp {
  if (app.status !== "scanned") return app;
  const cells: Record<string, ComponentCell> = {};
  for (const column of COMPONENT_COLUMNS) {
    const sources = IMPLEMENTATION_COLUMNS.filter(c => family(c.id) === column.id).map(c => app.cells[c.id]).filter((cell): cell is ComponentCell => Boolean(cell));
    const used = sources.filter(cell => totalSites(cell) > 0);
    const evidence = used.length ? used : sources;
    cells[column.id] = {
      shared: sources.reduce((n,c) => n+c.shared,0), styled: sources.reduce((n,c) => n+c.styled,0), local: sources.reduce((n,c) => n+c.local,0), unverified: sources.reduce((n,c) => n+c.unverified,0),
      sites: sources.flatMap(c => c.sites), issues: [...new Set(evidence.flatMap(c => c.issues))],
      snapshot: evidence.some(c => c.snapshot === "modified") ? "modified" : evidence.some(c => c.snapshot === "unverified") ? "unverified" : evidence.every(c => c.snapshot === "verified") ? "verified" : "none",
      current: evidence.every(c => c.current === true) ? true : evidence.some(c => c.current === false) ? false : null,
    };
  }
  return { ...app, cells };
}

export const totalSites = (cell: ComponentCell): number => cell.shared + cell.styled + cell.local + cell.unverified;
