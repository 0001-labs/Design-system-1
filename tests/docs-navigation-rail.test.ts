// @vitest-environment happy-dom
import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const layout = readFileSync('website/src/layouts/Layout.astro', 'utf8');
const rail = readFileSync('website/src/components/NavigationRail.astro', 'utf8');
const bootstrap = layout.match(/<script is:inline>([\s\S]*?)<\/script>/)![1];

it('shows the rail on every documentation page, with nothing to collapse or expand', () => {
  for (const pathname of ['/', '/2-core/button/', '/start-here/examples/']) {
    document.documentElement.removeAttribute('data-sidebar-collapsed');
    new Function('location', bootstrap)({ pathname });
    expect(document.documentElement.hasAttribute('data-sidebar-collapsed'), pathname).toBe(true);
  }
  expect(rail).not.toMatch(/Expand sidebar|rail-open/);
  expect(layout).not.toMatch(/Hide sidebar|setSidebarCollapsed/);
});
