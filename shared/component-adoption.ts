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
/** An icon an app names: DS1's drawing, a copy that is not today's DS1 drawing, or a name DS1 does not have. */
export type IconStatus = "shared" | "differs" | "local";
/**
 * How a site draws its icon: a `ds-icon` element, a React icon component, an
 * icon set package, an imported or linked SVG file, a CSS mask or background,
 * an icon font class, a text glyph, an inline `<svg>`, or SVG made in script.
 */
export type IconKind = "element" | "component" | "library" | "file" | "mask" | "font" | "glyph" | "inline" | "script";
export interface IconSite {
  file: string;
  line: number;
  /** The name as the source writes it: an icon name, a component, a class, a glyph, a file name. */
  name: string;
  /** Absent in snapshots made before kinds were recorded: those are `element` sites. */
  kind?: IconKind;
  status?: IconStatus;
  /** The drawing a mask, file or import resolves to, relative to the app. */
  drawing?: string;
}
export interface IconCell {
  uses: number;
  status: IconStatus;
  /** The app's copied drawing against today's DS1: none when the app has no copy and resolves from DS1. */
  copy: "same" | "differs" | "missing" | "local" | "none";
  sites: IconSite[];
  /** The DS1 icon a local icon stands for, where its name makes that obvious. */
  ds1?: string;
}
export interface IconAdoption {
  copy: string | null;
  cells: Record<string, IconCell>;
  dynamic: IconSite[];
  /** Drawings made in the source (inline SVG, SVG made in script, SVG data addresses) that are not a DS1 drawing. */
  inline: IconSite[];
  /** Stylesheets and links that load an icon font. */
  fonts?: IconSite[];
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
  /**
   * Custom elements copied from a shared studio part rather than authored by the product: their uses, the copied
   * file that defines them, and the sync.lock.json source that verifies that copy, when one does.
   */
  sharedParts?: Record<string, { uses: number; definition: string; lock?: string }>;
  /** Local sites with no DS1 column yet, kept out of the matrix so it holds only what DS1 can replace: `range`. */
  gaps?: Record<string, UsageSite[]>;
  error?: string;
  group?: "Products" | "Clients";
  migration?: "deferred";
  migrationReason?: string;
  icons?: IconAdoption;
}
export interface AdoptionReport {
  schema: 1;
  generatedAt: string;
  sourceCommit: string;
  sourceDirty: boolean;
  columns: ComponentColumn[];
  apps: AdoptionApp[];
  method: string[];
  /** Every icon name DS1 draws today. */
  icons?: { names: string[] };
}

/** Implementation IDs remain distinct for provenance checks and source drilldowns. */
const directoryColumns: ComponentColumn[] = ALL_LAYERS.flatMap(layer => layer.entries.map(entry => ({
  id: layer.number === 1 ? `root-${entry.name.toLowerCase()}` : entry.tag?.replace(/^ds-/, "") ?? (entry.href === "/3-unit/card/" ? "unit-card" : entry.href.split("/").filter(Boolean).at(-1)!),
  name: entry.name, group: layer.name,
})));
export const IMPLEMENTATION_COLUMNS: ComponentColumn[] = [
  ...directoryColumns,
  ...["button", "split", "checkbox", "radio", "switch", "text", "badge", "token", "avatar", "icon", "input", "file-picker", "color", "swatch", "select", "textarea", "composer", "tooltip", "cycle", "date", "language", "gap", "banner", "empty", "message", "notice", "kbd", "stat", "meter", "steps", "progress", "card", "pagedots", "chart", "toast", "toggle", "loading", "spacing-handle"].map(id => ({ id, name: id, group: "Core" })),
  ...["token-field", "avatar-group", "calendar", "calendar-large", "date-picker", "matrix", "carousel", "slide", "row", "list", "tabs", "menu", "accordion", "form", "table", "sidebar", "tree", "navigation", "unit-card"].map(id => ({ id, name: id, group: "Unit" })),
  ...["dialog", "panel", "container", "layout", "grid", "page", "header", "footer", "document"].map(id => ({ id, name: id, group: "Page" })),
].filter((column, index, columns) => columns.findIndex(other => other.id === column.id) === index);
/** Retired names fold into the component that took them over, so a product's older copy still counts there. */
const FAMILY: Record<string, string> = {
  split: "button", toggle: "switch", textarea: "input", language: "cycle", banner: "message", notice: "message", toast: "message",
  meter: "progress", steps: "progress", pagedots: "progress", slide: "carousel", tree: "sidebar", layout: "page",
};
/** Retired with nothing taking their place. */
const RETIRED = new Set(["date"]);
const family = (id: string) => FAMILY[id] ?? id;
const specialistNames: Record<string, string> = { "file-picker": "File picker", "token-field": "Token field", "avatar-group": "Avatar group", "spacing-handle": "Spacing handle" };
/** Names and layers come from the same catalogue as the documentation and editor. */
export const COMPONENT_COLUMNS: ComponentColumn[] = IMPLEMENTATION_COLUMNS.filter(column => family(column.id) === column.id && !RETIRED.has(column.id)).map(column => {
  const layer = ALL_LAYERS.find(layer => layer.number > 1 && layer.entries.some(entry => entry.tag === `ds-${column.id}` || (column.id === "unit-card" ? entry.href === "/3-unit/card/" : !entry.tag && entry.href.split("/").filter(Boolean).at(-1) === column.id)));
  const entry = layer?.entries.find(entry => entry.tag === `ds-${column.id}` || (column.id === "unit-card" ? entry.href === "/3-unit/card/" : !entry.tag && entry.href.split("/").filter(Boolean).at(-1) === column.id));
  return { id: column.id, name: directoryColumns.find(c => c.id === column.id)?.name ?? entry?.name ?? specialistNames[column.id] ?? column.id[0]!.toUpperCase() + column.id.slice(1), group: layer?.name ?? column.group };
}).sort((a, b) => ["Root", "Core", "Unit", "Page"].indexOf(a.group) - ["Root", "Core", "Unit", "Page"].indexOf(b.group) || a.name.localeCompare(b.name));

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
