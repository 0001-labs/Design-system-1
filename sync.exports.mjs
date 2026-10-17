/**
 * What products copy from Design system 1, with Sync 1 (`sync1`, in
 * /Users/joachim/0001/Sync 1). A product names the exports it takes in its
 * sync.json; never edit the copies, change them here and sync.
 */
import { createHash } from 'node:crypto';
import { join, posix } from 'node:path';
import { componentGraph } from './scripts/component-graph.mjs';
import { applePackage } from './scripts/native-apple.mjs';
import { androidPackage } from './scripts/native-android.mjs';

const rootStyles = ['one.css', 'grid.css', 'text.css', 'component-tokens.css', 'component-metrics.css', 'component-appearance.css', 'fonts.css', 'palette.css'];
/** one.css and controls.css both import the text classes. */
const importsText = ['one.css', 'controls.css'];
/** one.css also imports the faces with their typeface tokens, and the palette. */
const oneImports = ['fonts.css', 'palette.css'];
/** The sheets controls.css imports besides the text classes: tables, empty states and notices. */
const controlSheets = ['table.css', 'empty.css', 'notice.css'];
/** Sheets for writing that a product asks for by name, as a flag or in `styles`. */
const writingSheets = { prose: 'prose.css', classless: 'one.semantic.css', cjk: 'cjk.css' };
const askedSheets = options => Object.entries(writingSheets).filter(([flag]) => options[flag]).map(([, file]) => file);
/** The faces fonts.css (and so one.css) loads, by the file names its @font-face rules use, and their licences. */
const rootFonts = ['GT-America-Standard-Regular.woff2', 'GT-America-Standard-Medium.woff2', 'GT-America-Compressed-Regular.woff2', 'GT-Canon-M-Standard-Medium-Trial.woff2', 'Inter-Arrows.woff2', 'Iosevka-Regular.woff2', 'Inter-LICENSE.md', 'Iosevka-LICENSE.md'];
/** The faces every typeface token leads with or codes in, which travel with fonts.css whatever else a product names. */
const alwaysFonts = ['Inter-Arrows.woff2', 'Iosevka-Regular.woff2', 'Inter-LICENSE.md', 'Iosevka-LICENSE.md'];
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
/** Stylesheets fetched from another host (cjk.css's faces), which a bundle must import before any rule. */
const remoteImport = /^@import\s+url\([^)]*\)[^;]*;\s*\n/gm;

const languageFiles = ['i18n.ts', 'languages.ts', 'language-routing.ts', 'translations-format.ts', 'language-validator.ts', 'shared-words.ts', 'format.ts', 'pricing.ts'];

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
    /**
     * Faces copied as local assets by consumers: `fonts` names them by file. `stylesheet: true`
     * adds fonts.css, the @font-face rules and typeface tokens one.css imports, pointed at the
     * faces beside it, for a page that does not load one.css: with every face it loads, or with
     * the faces `fonts` names and always Inter Arrows and Iosevka (a face left out is fetched
     * only by a page that uses it, and then not found).
     */
    fonts: {
      files({ read, options }) {
        const available = {
          'OlivettiDot-Regular.woff2': 'website/src/assets/fonts/OlivettiDot-Regular.woff2',
          ...Object.fromEntries(rootFonts.map(name => [name, `DS1/1-root/fonts/${name}`])),
        };
        if (options.fonts !== undefined && !Array.isArray(options.fonts)) throw new Error('Name the fonts to copy: "fonts": ["Iosevka-Regular.woff2", …]');
        const names = [...(options.fonts ?? [])];
        if (options.stylesheet) for (const name of options.fonts ? alwaysFonts : rootFonts) if (!names.includes(name)) names.push(name);
        if (!names.length) throw new Error('Name the fonts to copy, or ask for the stylesheet');
        const files = Object.fromEntries(names.map(name => {
          if (!Object.hasOwn(available, name)) throw new Error(`Unknown font: ${name}`);
          return [name, read(available[name])];
        }));
        if (options.stylesheet) files['fonts.css'] = String(read('DS1/1-root/fonts.css')).replaceAll('url("./fonts/', 'url("./');
        return files;
      },
    },
    /**
     * Component tokens for static stylesheets that import them by URL, with
     * the named palette colours (palette.css, the --one-* tokens).
     * `nativeControls` adds controls.css with the table, text, empty-state and
     * notice classes it imports (table.css, text.css, empty.css, notice.css);
     * `prose` adds the prose sheet (prose.css, for writing marked data-ds-prose) and `classless` the classless sheet
     * (one.semantic.css, which styles a whole page of plain HTML) and `cjk` Noto Sans
     * for Japanese and Chinese (cjk.css); `bundle` writes them all as one
     * bundle.css with the imports resolved, for a page that can carry only one
     * stylesheet or inlines its styles.
     */
    tokens: {
      files({ read, options }) {
        const files = options.bundle ? [...tokenStyles] : ['component-tokens.css', 'component-metrics.css', 'component-appearance.css'];
        files.push('palette.css');
        if (options.nativeControls) files.push('table.css', 'text.css', 'empty.css', 'notice.css', 'controls.css');
        files.push(...askedSheets(options));
        if (options.bundle) {
          const sheets = files.map(file => withoutImports(read(`DS1/1-root/${file}`)));
          const remote = sheets.flatMap(css => css.match(remoteImport) ?? []).join('');
          return { 'bundle.css': `/* Generated from Design system 1/DS1/1-root: ${files.join(', ')}. Change Design system 1 and sync. */\n` + remote + sheets.map(css => css.replace(remoteImport, '')).join('\n') };
        }
        return Object.fromEntries(files.map(file => [file, read(`DS1/1-root/${file}`)]));
      },
    },
    /**
     * The root stylesheet (one.css with grid.css, the text classes, the
     * component tokens, the faces and typeface tokens in fonts.css and the
     * palette in palette.css) and the faces it loads, in fonts/. `styles` names the
     * stylesheets to copy when a product loads only some (`["grid.css"]`,
     * `["fonts.css"]` for the faces alone, or `[]` for scripts alone); `fonts:
     * false` leaves the faces to the product;
     * `nativeControls` adds controls.css and the table.css, empty.css and
     * notice.css it imports; `prose`
     * adds the prose sheet (prose.css) and `classless` the classless sheet
     * (one.semantic.css) and `cjk` Noto Sans for Japanese and Chinese (cjk.css,
     * from Google Fonts), which `styles` may also name; `modules` names page scripts
     * from 0-face/ (grid, grid-fit, layout-inspector, scaling, tooltips), copied
     * with what they import. one.css and controls.css bring text.css, and
     * one.css fonts.css and palette.css, which they import.
     */
    root: {
      files({ read, options }) {
        const files = {};
        const styles = [...(options.styles ?? rootStyles), ...askedSheets(options)];
        for (const file of styles) {
          if (!rootStyles.includes(file) && !Object.values(writingSheets).includes(file)) throw new Error(`Unknown root stylesheet: ${file}`);
          files[file] = read(`DS1/1-root/${file}`);
        }
        if (options.nativeControls) for (const file of [...controlSheets, 'controls.css']) files[file] = read(`DS1/1-root/${file}`);
        if (Object.keys(files).some(file => importsText.includes(file))) files['text.css'] = read('DS1/1-root/text.css');
        if (files['one.css']) for (const file of oneImports) files[file] ??= read(`DS1/1-root/${file}`);
        if (options.fonts !== false) for (const font of rootFonts) files[`fonts/${font}`] = read(`DS1/1-root/fonts/${font}`);
        for (const name of options.modules ?? []) {
          if (!Object.hasOwn(rootModules, name)) throw new Error(`Unknown page script: ${name}`);
          for (const file of rootModules[name]) files[`0-face/${file}`] = read(`DS1/0-face/${file}`);
        }
        return files;
      },
    },
    /** The language runtime, the shared words, the Convex validator and formatting in the language (format.ts, pricing.ts), in 0-face/. `entries: true` adds a top-level re-export of each module. */
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
     * their React adapters (`empty` brings react/empty.ts, `notice`
     * react/notice.ts). controls.css always travels with them, and with it the
     * native classes it imports, `.ds-empty` and `.ds-notice` among them.
     * components-manifest.json records them for the component adoption report,
     * at the last commit that changed them.
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
    /**
     * The Swift package (native/apple, module DS1) as one folder the copy owns whole: its
     * sources with the generated palette, measures and icon names, every icon in an asset
     * catalogue and the typefaces as the woff2 files the web loads. Inter Arrows and Iosevka
     * always travel; `fonts` names the others (`GT-America-Standard-Regular.woff2`,
     * `OlivettiDot-Regular.woff2`, …). The product adds the folder as a local package.
     */
    swift: {
      owned: true,
      files({ read, tree, options }) { return applePackage({ read, tree, fonts: options.fonts ?? [] }); },
    },
    /**
     * The Kotlin package (native/android, a Gradle build with the `ds1` library) as one folder
     * the copy owns whole: its sources with the generated palette, measures, icons, languages
     * and words, every icon as a vector drawable and the typefaces as font resources. Inter
     * Arrows and Iosevka always travel; `fonts` names the others by their web file names. The
     * product includes the folder with `includeBuild` and depends on `com.designsystem1:ds1`.
     */
    kotlin: {
      owned: true,
      files({ read, tree, options }) { return androidPackage({ read, tree, fonts: options.fonts ?? [] }); },
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
