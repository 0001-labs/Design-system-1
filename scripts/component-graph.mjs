/** The shared component dependency graph a product copies: each selected component and everything it imports. */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

/** Components folded into another, named so a product's sync.json says what to take instead (never resolved for it). */
const RENAMED = { dialog: 'overlay', 'date-picker': 'calendar' };

/**
 * Collects the files under DS1/ that the named components need, keyed by their
 * path inside DS1, with a generated `components.ts` that exports them all.
 * `react: false` leaves the React adapters (`react/*.ts`) out, for a product
 * that uses the Lit elements alone; by default they travel with their components.
 */
export function componentGraph(ds1, names, { react = true } = {}) {
  const source = resolve(ds1) + '/';
  // Internal App controls are opt-in Sync 1 inputs, never public package files.
  const appSource = resolve(ds1, '../packages/app/src');
  const actualPath = file => existsSync(resolve(source, file)) ? resolve(source, file) : resolve(appSource, file);
  const exists = path => existsSync(path) || (path.startsWith(source) && existsSync(resolve(appSource, relative(source, path))));
  const components = [...new Set(names)].sort();
  const files = new Map();

  function visit(file) {
    const path = resolve(source, file);
    if (!path.startsWith(source)) throw new Error(`Dependency outside DS1: ${file}`);
    if (files.has(file)) return;
    if (!react && file.startsWith('react/')) throw new Error(`${file} is a React adapter, left out by "react": false`);
    const actual = actualPath(file);
    let content = readFileSync(actual, 'utf8');
    if (actual.startsWith(appSource + '/')) {
      content = content.replace(/((?:from\s*|import\s*\(\s*|import\s*|@import\s*)["'])(\.[^"']+)(["'])/g, (_match, before, specifier, after) => {
        const [specifierPath, query] = specifier.split('?');
        const target = resolve(dirname(actual), specifierPath);
        const virtual = target.startsWith(appSource + '/') ? resolve(source, relative(appSource, target)) : target;
        if (!virtual.startsWith(source)) throw new Error(`App dependency outside design source: ${specifier}`);
        const local = relative(dirname(path), virtual);
        return before + (local.startsWith('.') ? local : './' + local) + (query ? '?' + query : '') + after;
      });
    }
    files.set(file, content);
    if (!/\.(ts|css)$/.test(file)) return;
    const imports = /(?:\bfrom\s*|\bimport\s*\(\s*|^\s*import\s*|@import\s*)["'](\.[^"']+)["']/gm;
    for (const match of content.matchAll(imports)) {
      const base = resolve(dirname(path), match[1].split('?')[0]);
      // TypeScript's own spelling names a source by its output: `./ds-text.js`
      // is `./ds-text.ts` when no such script sits beside it.
      const compiled = base.endsWith('.js') ? [base.slice(0, -3) + '.ts'] : [];
      const dependency = [base, ...compiled, `${base}.ts`, `${base}.json`, join(base, 'index.ts')].find(exists);
      if (!dependency) throw new Error(`Unresolved ${match[1]} in ${file}`);
      visit(relative(source, dependency));
    }
  }

  const entries = components.map(name => {
    if (!/^[a-z][a-z-]*$/.test(name)) throw new Error(`Invalid component: ${name}`);
    const file = ['2-core', '3-unit', '4-page'].map(layer => `${layer}/ds-${name}.ts`).find(file => exists(join(source, file)));
    if (!file && RENAMED[name]) throw new Error(`Component ${name} is now ${RENAMED[name]}: rename it in sync.json`);
    if (!file) throw new Error(`Unknown component: ${name}`);
    visit(file);
    return file;
  });
  // React consumers may import the optional, source-owned state adapter.
  const adapter = file => { if (react) visit(file); };
  if (components.includes('spacing-handle')) adapter('react/spacing-handle.ts');
  if (components.includes('loading')) adapter('react/loading.ts');
  if (components.includes('button')) adapter('react/button.ts');
  if (components.includes('badge')) adapter('react/badge.ts');
  if (components.includes('empty')) adapter('react/empty.ts');
  if (components.includes('message')) adapter('react/message.ts');
  if (components.includes('notice')) adapter('react/notice.ts');
  if (components.includes('kbd')) adapter('react/kbd.ts');
  if (components.includes('carousel')) adapter('react/carousel.ts');
  for (const name of ['stat', 'progress']) if (components.includes(name)) adapter(`react/${name}.ts`);
  if (components.includes('sidebar')) adapter('react/sidebar.ts');
  if (components.includes('table')) adapter('react/table.ts');
  if (components.includes('table-of-contents')) adapter('react/table-of-contents.ts');
  if (components.includes('toast')) adapter('react/toast.ts');
  if (components.includes('file-picker')) adapter('react/file-picker.ts');
  if (components.includes('token-field') || components.includes('token')) adapter('react/token-field.ts');
  if (components.includes('composer')) adapter('react/composer.ts');
  if (components.includes('menu')) adapter('react/menu-engine.ts');
  if (components.includes('select')) adapter('react/select.ts');
  if (components.includes('context')) adapter('react/context.ts');
  if (components.includes('accordion')) adapter('react/accordion.ts');
  if (components.includes('avatar')) adapter('react/avatar.ts');
  if (components.includes('avatar-group')) adapter('react/avatar-group.ts');
  if (['checkbox', 'radio', 'switch', 'color'].some(name => components.includes(name))) adapter('react/choice.ts');
  if (components.includes('overlay')) adapter('react/overlay.ts');
  if (components.includes('page')) adapter('react/page.ts');
  if (components.includes('header')) adapter('react/header.ts');
  if (components.includes('footer')) adapter('react/footer.ts');
  if (components.includes('document')) adapter('react/document.ts');
  if (components.includes('swatch')) visit('0-face/tooltips.ts');
  if (components.includes('input')) adapter('react/input.ts');
  if (components.includes('number')) adapter('react/number.ts');
  visit('1-root/component-tokens.css');
  visit('1-root/controls.css');
  files.set('components.ts', '/** Generated by Design system 1. Change the source and sync. */\n' + entries.map(file => `export * from './${file.slice(0, -3)}';\n`).join(''));
  return { components, files };
}
