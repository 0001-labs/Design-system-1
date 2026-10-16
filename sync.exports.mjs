/**
 * What products copy from Design system 1, with Sync 1 (`sync1`, in
 * /Users/joachim/0001/Sync 1). A product names the exports it takes in its
 * sync.json; never edit the copies, change them here and sync.
 */
import { createHash } from 'node:crypto';
import { join, posix } from 'node:path';
import { componentGraph } from './scripts/component-graph.mjs';

const rootStyles = ['one.css', 'grid.css', 'component-tokens.css', 'component-metrics.css', 'component-appearance.css'];
/** The faces one.css loads, by the file names its @font-face rules use. */
const rootFonts = ['GT-America-Standard-Regular.woff2', 'GT-America-Standard-Medium.woff2', 'GT-America-Compressed-Regular.woff2', 'GT-Canon-M-Standard-Medium-Trial.woff2', 'Inter-Arrows.woff2', 'Iosevka-Regular.woff2', 'Inter-LICENSE.md', 'Iosevka-LICENSE.md'];
/** Page scripts in 0-face/, each with the modules it imports. */
const rootModules = {
  grid: ['grid.ts', 'layout-inspector.ts', 'grid-fit.ts'],
  'grid-fit': ['grid-fit.ts'],
  'layout-inspector': ['layout-inspector.ts'],
  scaling: ['scaling.ts'],
  /** The classic head script that puts the theme on before the first paint; also a root `modules` choice. */
  'theme-bootstrap': ['theme-bootstrap.js'],
  tooltips: ['tooltips.ts'],
};
/** The component stylesheets in the order they import each other. */
const tokenStyles = ['component-appearance.css', 'component-metrics.css', 'component-tokens.css'];
const withoutImports = css => css.replace(/^@import\s+"\.\/[^"]+";\s*\n/gm, '');

const languageFiles = ['i18n.ts', 'languages.ts', 'language-routing.ts', 'translations-format.ts', 'language-validator.ts', 'shared-words.ts'];

/**
 * A module and everything it imports, keyed by their paths inside DS1/
 * (`0-face/feedback.ts`, `2-core/styles/ds-toast.css`, `x-icon/check.svg`), as
 * the components export lays them out.
 */
function moduleGraph(read, entry) {
  const imports = /(?:\bfrom\s*|\bimport\s*\(\s*|^\s*import\s*|@import\s*)["'](\.[^"']+)["']/gm;
  const exists = path => { try { read(`DS1/${path}`); return true; } catch { return false; } };
  const files = new Map();
  const visit = file => {
    if (files.has(file)) return;
    const content = read(`DS1/${file}`);
    files.set(file, content);
    if (!/\.(ts|css)$/.test(file)) return;
    for (const match of String(content).matchAll(imports)) {
      const base = posix.normalize(posix.join(posix.dirname(file), match[1].split('?')[0]));
      if (base.startsWith('..')) throw new Error(`Dependency outside DS1: ${match[1]} in ${file}`);
      const dependency = [base, `${base}.ts`, `${base}.json`, `${base}/index.ts`].find(exists);
      if (!dependency) throw new Error(`Unresolved ${match[1]} in ${file}`);
      visit(dependency);
    }
  };
  visit(entry);
  return files;
}

export default {
  exports: {
    library: {
      files({ read }) { return { 'library-styles.ts': read('DS1/0-face/library-styles.ts') }; },
    },
    /** Optional display faces, copied as local assets by consumers. */
    fonts: {
      files({ read, options }) {
        const available = {
          'OlivettiDot-Regular.woff2': 'website/src/assets/fonts/OlivettiDot-Regular.woff2',
          ...Object.fromEntries(rootFonts.map(name => [name, `DS1/1-root/fonts/${name}`])),
        };
        if (!Array.isArray(options.fonts) || !options.fonts.length) throw new Error('Name the fonts to copy');
        return Object.fromEntries(options.fonts.map(name => {
          if (!Object.hasOwn(available, name)) throw new Error(`Unknown font: ${name}`);
          return [name, read(available[name])];
        }));
      },
    },
    /**
     * Component tokens for static stylesheets that import them by URL.
     * `nativeControls` adds controls.css and the table.css it imports; `bundle` writes them all as one
     * bundle.css with the imports resolved, for a page that can carry only one
     * stylesheet or inlines its styles.
     */
    tokens: {
      files({ read, options }) {
        const files = options.bundle ? [...tokenStyles] : ['component-tokens.css', 'component-metrics.css', 'component-appearance.css'];
        if (options.nativeControls) files.push('table.css', 'controls.css');
        if (options.bundle) return { 'bundle.css': `/* Generated from Design system 1/DS1/1-root: ${files.join(', ')}. Change Design system 1 and sync. */\n` + files.map(file => withoutImports(read(`DS1/1-root/${file}`))).join('\n') };
        return Object.fromEntries(files.map(file => [file, read(`DS1/1-root/${file}`)]));
      },
    },
    /**
     * The root stylesheet (one.css with grid.css and the component tokens) and
     * the faces it loads, in fonts/. `styles` names the stylesheets to copy
     * when a product loads only some (`["grid.css"]`, or `[]` for scripts
     * alone); `fonts: false` leaves the faces to the product; `nativeControls` adds controls.css and table.css; `modules` names page scripts
     * from 0-face/ (grid, grid-fit, layout-inspector, scaling, tooltips), copied
     * with what they import.
     */
    root: {
      files({ read, options }) {
        const files = {};
        const styles = options.styles ?? rootStyles;
        for (const file of styles) {
          if (!rootStyles.includes(file)) throw new Error(`Unknown root stylesheet: ${file}`);
          files[file] = read(`DS1/1-root/${file}`);
        }
        if (options.nativeControls) for (const file of ['table.css', 'controls.css']) files[file] = read(`DS1/1-root/${file}`);
        if (options.fonts !== false) for (const font of rootFonts) files[`fonts/${font}`] = read(`DS1/1-root/fonts/${font}`);
        for (const name of options.modules ?? []) {
          if (!Object.hasOwn(rootModules, name)) throw new Error(`Unknown page script: ${name}`);
          for (const file of rootModules[name]) files[`0-face/${file}`] = read(`DS1/0-face/${file}`);
        }
        return files;
      },
    },
    /** The language runtime, the shared words and the Convex validator, in 0-face/. `entries: true` adds a top-level re-export of each module. */
    languages: {
      files({ read, tree, options }) {
        const files = new Map();
        for (const file of languageFiles) {
          files.set(`0-face/${file}`, read(`DS1/0-face/${file}`));
          if (options.entries) files.set(file, `/** Generated language entry. Change Design system 1 and sync. */\nexport * from './0-face/${file.slice(0, -3)}';\n`);
        }
        for (const [file, content] of tree('DS1/0-face/translations', { only: /^[^/]+\.json$/ })) files.set(`0-face/translations/${file}`, content);
        return files;
      },
    },
    /**
     * The Lit components named in `components`, with everything they import and
     * their React adapters. components-manifest.json records them for the
     * component adoption report, at the last commit that changed them.
     */
    components: {
      files({ source, options, git }) {
        if (!Array.isArray(options.components) || !options.components.length) throw new Error('Name the components to copy: "components": ["button", …]');
        const { components, files } = componentGraph(join(source, 'DS1'), options.components);
        const hashes = Object.fromEntries([...files].sort(([a], [b]) => a.localeCompare(b)).map(([file, content]) => [file, createHash('sha256').update(content).digest('hex')]));
        const tracked = [...files.keys()].filter(file => file !== 'components.ts').map(file => `DS1/${file}`);
        const commit = git(['log', '-1', '--format=%H', '--', ...tracked]) || git(['rev-parse', 'HEAD']);
        files.set('components-manifest.json', JSON.stringify({ source: 'Design system 1/DS1', commit, components, files: hashes }, null, 2) + '\n');
        return files;
      },
    },
    /**
     * Feedback without Lit (`0-face/feedback.ts`): toasts drawn by the page
     * toaster, the promise dialogs and copyText, with everything they import
     * (the language module and shared words, the toast's stylesheet and icons),
     * by their paths inside DS1/. Copied to the same `to` as `languages` or
     * `components`, the page keeps one language runtime; the dialogs need
     * controls.css (`nativeControls` on `root` or `tokens`).
     */
    feedback: {
      files({ read }) { return moduleGraph(read, '0-face/feedback.ts'); },
    },
    /** The email renderer and its font: `email` and `font` say where they go, from "to". */
    email: {
      files({ read, options }) {
        return {
          [options.email ?? 'shared/design-system-1/email.ts']: read('DS1/4-page/email.ts'),
          [options.font ?? 'public/fonts/GT-America-Standard-Regular.woff2']: read('DS1/1-root/fonts/GT-America-Standard-Regular.woff2'),
        };
      },
    },
    /** Icon files from DS1/x-icon: `icons` lists their names, or maps each name to the file it becomes. */
    icons: {
      files({ read, options }) {
        const icons = Array.isArray(options.icons) ? Object.fromEntries(options.icons.map(name => [name, `${name}.svg`])) : options.icons;
        if (!icons || !Object.keys(icons).length) throw new Error('Name the icons to copy: "icons": ["duplicate", …]');
        return Object.fromEntries(Object.entries(icons).map(([name, file]) => [file, read(`DS1/x-icon/${name}.svg`)]));
      },
    },
  },
};
