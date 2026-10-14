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

export const COMPONENT_COLUMNS: ComponentColumn[] = [
  ...["button", "split", "checkbox", "radio", "switch", "text", "token", "avatar", "icon", "input", "file-picker", "color", "swatch", "select", "textarea", "composer", "tooltip", "cycle", "date", "language", "gap", "banner", "card", "pagedots"].map(id => ({ id, name: id === "file-picker" ? "File picker" : id === "textarea" ? "Text area" : id === "pagedots" ? "Page dots" : id[0]!.toUpperCase() + id.slice(1), group: "Core" })),
  ...["token-field", "avatar-group", "row", "list", "tabs", "menu", "accordion", "form", "table"].map(id => ({ id, name: id === "token-field" ? "Token field" : id === "avatar-group" ? "Avatar group" : id[0]!.toUpperCase() + id.slice(1), group: "Composites" })),
  ...["dialog", "panel", "container", "layout", "grid"].map(id => ({ id, name: id[0]!.toUpperCase() + id.slice(1), group: "Layout" })),
];

export const totalSites = (cell: ComponentCell): number => cell.shared + cell.styled + cell.local + cell.unverified;
