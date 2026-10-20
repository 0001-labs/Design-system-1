// @vitest-environment happy-dom
import { beforeEach, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { setSidebarCollapsed } from '../website/src/lib/sidebar-state';
const layout = readFileSync('website/src/layouts/Layout.astro', 'utf8');
const bootstrap = layout.match(/<script is:inline>([\s\S]*?)<\/script>/)![1];
beforeEach(() => { localStorage.clear(); document.documentElement.removeAttribute('data-sidebar-collapsed'); });
function open(pathname: string) {
  document.documentElement.removeAttribute('data-sidebar-collapsed');
  new Function('location', bootstrap)({ pathname });
}
it('keeps a collapsed rail when navigating from Examples to a component page', () => {
  open('/start-here/examples/');
  expect(document.documentElement.hasAttribute('data-sidebar-collapsed')).toBe(true);
  open('/2-core/button/');
  expect(document.documentElement.hasAttribute('data-sidebar-collapsed')).toBe(true);
});
it('remembers expanding the sidebar on subsequent documentation pages', () => {
  setSidebarCollapsed(true);
  setSidebarCollapsed(false);
  open('/3-unit/table/');
  expect(document.documentElement.hasAttribute('data-sidebar-collapsed')).toBe(false);
  expect(localStorage.getItem('ds1-docs-sidebar-collapsed')).toBe('false');
});
it('starts ordinary documentation expanded until a collapse is selected', () => {
  open('/1-root/fonts/');
  expect(document.documentElement.hasAttribute('data-sidebar-collapsed')).toBe(false);
  setSidebarCollapsed(true);
  open('/4-page/page/');
  expect(document.documentElement.hasAttribute('data-sidebar-collapsed')).toBe(true);
});
