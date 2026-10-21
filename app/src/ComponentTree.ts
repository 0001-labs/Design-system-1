import { html } from "lit";
import "../../DS1/3-unit/ds-sidebar";
import type { Sidebar, SidebarItem } from "../../DS1/3-unit/ds-sidebar";
import { AppElement, defineElement } from "./lib/element";

/** A component, or a group of them that opens and closes. */
export type TreeNode = { id: string; label: string; meta?: string; children?: TreeNode[] };

/**
 * The workbench's component trees, drawn by Design system 1's sidebar: one
 * square a row, its arrow keys, focus and cut-label tooltips. The workbench
 * owns which component is open (`current`, and `tree-select` when one is
 * chosen); this element keeps which groups are closed.
 */
export class ComponentTree extends AppElement {
  static properties = {
    label: { type: String },
    nodes: { attribute: false },
    current: { type: String },
    treeClass: { type: String, attribute: "tree-class" },
    closed: { state: true },
  };
  declare label: string;
  declare nodes: TreeNode[];
  declare current: string;
  declare treeClass: string;
  declare closed: ReadonlySet<string>;

  constructor() {
    super();
    this.label = "";
    this.nodes = [];
    this.current = "";
    this.treeClass = "";
    this.closed = new Set();
  }

  #items(): SidebarItem[] {
    const rows = (list: TreeNode[], depth: number): SidebarItem[] => list.flatMap(node => {
      const item: SidebarItem = { id: node.id, label: node.label, depth, meta: node.meta, current: node.id === this.current };
      if (!node.children) return [item];
      item.expanded = !this.closed.has(node.id);
      return [item, ...(item.expanded ? rows(node.children, depth + 1) : [])];
    });
    return rows(this.nodes, 0);
  }

  #activate = (event: Event) => this.emit("tree-select", (event as CustomEvent<{ id: string }>).detail.id);

  #toggle = (event: Event) => {
    const { id, expanded } = (event as CustomEvent<{ id: string; expanded: boolean }>).detail;
    const next = new Set(this.closed);
    if (expanded) next.delete(id); else next.add(id);
    this.closed = next;
    const sidebar = event.currentTarget as Sidebar;
    void this.updateComplete.then(() => sidebar.updateComplete).then(() => sidebar.focusItem(id));
  };

  override render() {
    return html`<ds-sidebar label=${this.label} class=${`component-tree${this.treeClass ? ` ${this.treeClass}` : ""}`}
      .items=${this.#items()} @sidebar-activate=${this.#activate} @sidebar-toggle=${this.#toggle}></ds-sidebar>`;
  }
}
defineElement("ds1-component-tree", ComponentTree);
