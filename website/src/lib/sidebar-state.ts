/** The documentation sidebar uses one preference across every route. */
export function setSidebarCollapsed(collapsed: boolean): void {
  document.documentElement.toggleAttribute('data-sidebar-collapsed', collapsed);
  try { localStorage.setItem('ds1-docs-sidebar-collapsed', String(collapsed)); } catch {}
}
