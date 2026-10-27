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
import { libraryPin, pinnedFiles, pinnedLibrary } from './scripts/library-pin.mjs';

const rootStyles = ['one.css', 'grid.css', 'text.css', 'component-tokens.css', 'component-metrics.css', 'component-appearance.css', 'fonts.css', 'palette.css'];
/** one.css and controls.css both import the text classes. */
const importsText = ['one.css', 'controls.css'];
/** one.css also imports the faces with their typeface tokens, and the palette. */
const oneImports = ['fonts.css', 'palette.css'];
/** The sheets controls.css imports besides the text classes: tables, empty states, notices, shortcut hints, the dialog's placements, the site chrome (header with its drawer, footer, document), carousels, cards, stats, progress, and rows. */
const controlSheets = ['table.css', 'empty.css', 'notice.css', 'overlay.css', 'header.css', 'footer.css', 'document.css', 'bento.css', 'carousel.css', 'card.css', 'figures.css', 'progress.css', 'row.css', 'context.css'];
/** Sheets for writing that a product asks for by name, as a flag or in `styles`. */
const writingSheets = { prose: 'prose.css', cjk: 'cjk.css', material: 'material.css' };
const askedSheets = options => Object.entries(writingSheets).filter(([flag]) => options[flag]).map(([, file]) => file);
/** The faces fonts.css (and so one.css) loads, by the file names its @font-face rules use, and their licences. */
const rootFonts = ['GT-America-Standard-Regular.woff2', 'GT-America-Standard-Medium.woff2', 'GT-America-Compressed-Regular.woff2', 'GT-Canon-M-Standard-Medium-Trial.woff2', 'Inter-Arrows.woff2', 'Iosevka-Regular.woff2', 'Inter-LICENSE.md', 'Iosevka-LICENSE.md'];
/** The faces every typeface token leads with or codes in, which travel with fonts.css whatever else a product names. */
const alwaysFonts = ['Inter-Arrows.woff2', 'Iosevka-Regular.woff2', 'Inter-LICENSE.md', 'Iosevka-LICENSE.md'];
/** Page scripts in 0-face/, each with the modules it imports. */
const rootModules = {
  grid: ['grid.ts', 'layout-inspector.ts', 'grid-fit.ts', 'constraint-panel.ts', 'constraint-site.ts', 'constraints.ts', 'fault-lines.ts', 'button-label.ts', 'text-contrast.ts', 'word-wrap.ts', 'scaling.ts'],
  'grid-fit': ['grid-fit.ts'],
  'layout-inspector': ['layout-inspector.ts'],
  /** The constraint checker alone, five presses of C or ?constraints=1, for a product that takes no grid; `grid` brings it too. */
  constraints: ['constraint-panel.ts', 'constraint-site.ts', 'constraints.ts', 'fault-lines.ts', 'button-label.ts', 'text-contrast.ts', 'word-wrap.ts', 'scaling.ts'],
  scaling: ['scaling.ts'],
  /** The classic head script that puts the theme on before the first paint; also a root `modules` choice. */
  'theme-bootstrap': ['theme-bootstrap.js'],
  tooltips: ['tooltips.ts'],
  /** Keyboard shortcuts: the command key, the typing guard, labels and onShortcut; its key names read the shared words where `languages` is copied beside it. */
  keys: ['keys.ts'],
  /** Swiping a native sheet or drawer (dialog.ds-overlay--sheet, --end, --start) away; its look is controls.css's. */
  'overlay-swipe': ['overlay-swipe.ts'],
  /** The site header's menu for pages without Lit, and the drawer it opens. */
  header: ['header.ts', 'attach-overlay.ts'],
  /** The banner leading to a site's iPhone app on native markup (.ds-notice--app): where it shows, Apple's meta tag, Open and the remembered close. */
  'app-banner': ['app-banner.ts', 'scaling.ts'],
  /** Bentos on whole squares on native markup (.ds-bento[data-squares], placeBentos). */
  bento: ['bento.ts'],
  /** Image focus: where a photo's subject is, for a cover crop that keeps it (focusOf, objectPosition, startFocus for data-ds-focus). */
  focus: ['focus.ts', 'focus-vision.swift'],
  /** Carousels and their dots on native markup (.ds-carousel, .ds-progress--dots). */
  carousel: ['carousel.ts'],
  /** The keyboard and pointer of a native sidebar tree (`connectSidebar`, for `.ds-sidebar` in row.css). */
  sidebar: ['sidebar.ts'],
  /** Cut words fading over their last square on native markup (`startCutFades`, marking `.ds-row__name`, `.ds-menu__item` … `data-cut="end"`). */
  'cut-fade': ['cut-fade.ts'],
  /** A face Design system 1 did not draw, corrected in its @font-face to stand on the sixteen (faceCorrection, correctFaces, correctedGoogleFonts, readFaceMetrics), with the metrics of the Google faces 0001's products offer. */
  'face-correction': ['face-correction.ts', 'google-face-metrics.json'],
  /** The theme module (light, dark, system in signals) with the head script it runs and its options' type; needs @lit-labs/signals. */
  theme: ['theme.ts', 'theme-bootstrap.js', 'preference-options.ts'],
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
    /** Native page publication: the editor's Aa parser and closed content atoms, without DOM. */
    'native-content': {
      files({ read, tree }) {
        let source = String(read('shared/consistency-native-content.ts'))
          .replace('../website/src/vendor/aa/parse.js', './aa/parse.js')
          .replace('../DS1/2-core/generated/icons-immediate', './icons-immediate')
          .replace('../DS1/2-core/generated/icons-extra', './icons-extra');
        source = source.replace(/^import (\w+) from '([^']+)\?raw';$/gm, (_, name, path) =>
          `const ${name} = ${JSON.stringify(String(read(posix.normalize(posix.join('shared', path)))))};`);
        return {
          'native-content.ts': source,
          'native-page.ts': String(read('shared/consistency-native-page.ts'))
            .replace('./consistency-native-content', './native-content')
            .replace(/^import pageStyles from '.\/consistency-native-page.css\?raw';$/m, `const pageStyles = ${JSON.stringify(String(read('shared/consistency-native-page.css')))};`),
          'site-design.ts': read('shared/consistency-site-design.ts'),
          'consistency-content.ts': read('shared/consistency-content.ts'),
          'consistency-carousel.ts': read('shared/consistency-carousel.ts'),
          'icons-immediate.ts': read('DS1/2-core/generated/icons-immediate.ts'),
          'icons-extra.ts': read('DS1/2-core/generated/icons-extra.ts'),
          'aa/parse.js': read('website/src/vendor/aa/parse.js'),
          ...Object.fromEntries([...tree('website/src/vendor/aa', { only: /^[^/]+\.d\.ts$/ })].map(([path, content]) => [`aa/${path}`, content])),
        };
      },
    },
    /** Approved documentation artwork; components are selected separately through components. */
    'device-artwork': {
      files({ read }) {
        return Object.fromEntries(['iphone-17-pro-max-deep-blue.png','status-wifi.svg','status-battery.svg'].map(file=>[file,read(`packages/visual-kit/private-assets/${file}`)]));
      },
    },
    /** Internal on-page Ask face and speech input; hosts supply their own authorized data. */
    ask: {
      files({ read }) {
        return Object.fromEntries(['2-core/ds-ask.ts', '2-core/styles/ds-ask.css', '0-face/ask-listen.ts']
          .map(file => [file, read(`packages/app/src/${file}`)]));
      },
    },
    /**
     * Published design libraries. `library-styles.ts` connects one by address at run time. `id` and
     * `version` pin a published version instead: its stylesheet as
     * `ds1-library/<id>/v/<version>.css`, unchanged, and `ds1-library/library-manifest.json` with
     * its address, the DS1 library revision it was prepared by and its sha256, all hashed in
     * sync.lock.json (scripts/library-pin.mjs verifies it first). `sha256` also checks it against
     * a hash the product names; `styles: false` leaves library-styles.ts out, as for a `to` in
     * `public/`.
     */
    library: {
      async files({ read, options }) {
        const files = options.styles === false ? {} : { 'library-styles.ts': read('DS1/0-face/library-styles.ts') };
        const pin = libraryPin(options);
        if (!pin) {
          if (options.styles === false) throw new Error('Name the library to pin ("id" and "version"), or copy library-styles.ts');
          return files;
        }
        return { ...files, ...pinnedFiles(pin, await pinnedLibrary(pin)) };
      },
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
     * `nativeControls` adds controls.css with the table, text, empty-state,
     * notice, shortcut, dialog placement, site chrome, carousel, figure and row
     * classes it imports (table.css, text.css, empty.css, notice.css, kbd.css,
     * overlay.css, header.css, footer.css, document.css,
     * carousel.css, figures.css, progress.css, row.css);
     * `prose` adds the prose sheet (prose.css, for writing marked data-ds-prose) and `cjk` Noto Sans
     * for Japanese and Chinese (cjk.css); `bundle` writes them all as one
     * bundle.css with the imports resolved, for a page that can carry only one
     * stylesheet or inlines its styles.
     */
    tokens: {
      files({ read, options }) {
        const files = options.bundle ? [...tokenStyles] : ['component-tokens.css', 'component-metrics.css', 'component-appearance.css'];
        files.push('palette.css');
        if (options.nativeControls) files.push('table.css', 'text.css', ...controlSheets.slice(1), 'controls.css');
        files.push(...askedSheets(options));
        if (options.bundle) {
          // Sync 1 reads files as buffers: the bundle joins their text.
          const sheets = files.map(file => withoutImports(String(read(`DS1/1-root/${file}`))));
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
     * `nativeControls` adds controls.css and the table.css, empty.css,
     * notice.css, kbd.css, overlay.css, header.css,
     * footer.css, document.css, carousel.css, figures.css, progress.css and row.css it imports; `prose`
     * adds the prose sheet (prose.css) and `cjk` Noto Sans for Japanese and Chinese (cjk.css,
     * from Google Fonts), which `styles` may also name; `modules` names page scripts
     * from 0-face/ (app-banner, carousel, face-correction, grid (with the owner's constraint panel), constraints (that panel alone), grid-fit, layout-inspector, scaling, theme,
     * theme-bootstrap, tooltips, tree, header, keys, overlay-swipe, cut-fade), copied with what they import, into 0-face/;
     * `scriptsTo` puts that 0-face/ folder elsewhere, a path from `to`
     * (`"../../src/ds1"` puts the stylesheets in `public/ds1` and the scripts
     * in `src/ds1/0-face`). one.css and controls.css bring text.css, and
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
          for (const file of rootModules[name]) files[posix.join(options.scriptsTo ?? '.', '0-face', file)] = read(`DS1/0-face/${file}`);
        }
        return files;
      },
    },
    /**
     * Native sheets a library draws a face with on a page that may not load
     * the root stylesheet: `sheets` names them (`["context.css"]`), each with
     * the root sheets it imports (context.css brings component-metrics.css and
     * component-appearance.css), beside it as it imports them.
     */
    sheets: {
      files({ read, options }) {
        if (!Array.isArray(options.sheets) || !options.sheets.length) throw new Error('Name the sheets to copy: "sheets": ["context.css"]');
        const files = {};
        const visit = file => {
          if (Object.hasOwn(files, file)) return;
          files[file] = read(`DS1/1-root/${file}`);
          for (const [, imported] of String(files[file]).matchAll(/^@import\s+"\.\/([^"]+)";/gm)) visit(imported);
        };
        for (const file of options.sheets) {
          if (![...controlSheets, 'guide.css'].includes(file)) throw new Error(`Unknown sheet: ${file}; the sheets are ${controlSheets.join(', ')}`);
          visit(file);
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
     * react/notice.ts, `carousel` react/carousel.ts, `stat` and `progress`
     * theirs, `sidebar` react/sidebar.ts, `table` react/table.ts); `react:
     * false` leaves every adapter out, for a product on the Lit elements alone
     * (`{ "components": ["button", …], "react": false }`). controls.css always travels with them, and
     * with it the native classes it imports, `.ds-empty`, `.ds-notice`,
     * `.ds-carousel`, `.ds-stat`, `.ds-progress` and `.ds-row` among them.
     * components-manifest.json records them for the component adoption report,
     * at the last commit that changed them.
     */
    components: {
      files({ source, options, git }) {
        if (!Array.isArray(options.components) || !options.components.length) throw new Error('Name the components to copy: "components": ["button", …]');
        if (options.react !== undefined && typeof options.react !== 'boolean') throw new Error('"react" is true (the default, with the React adapters) or false (the Lit elements alone)');
        const { components, files } = componentGraph(join(source, 'DS1'), options.components, { react: options.react !== false });
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
     * (the toast's stylesheet and icons as a generated module), by their paths
     * inside DS1/: plain TypeScript, with no language runtime. Its words are
     * English unless the page loads the language module, so copy it to the
     * same `to` as `languages` or `components` for words in the page's
     * language; `languages: true` brings the runtime with it instead. The
     * dialogs need controls.css (`nativeControls` on `root` or `tokens`).
     */
    feedback: {
      files({ read, options }) {
        const files = moduleGraph(read, '0-face/feedback.ts');
        if (options.languages) for (const [file, content] of moduleGraph(read, '0-face/i18n.ts')) files.set(file, content);
        return files;
      },
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
    /**
     * Country flags from DS1/x-flag, drawn with `.ds-flag`: `flags` lists their codes in lower
     * case (`["jp", "dk"]`), or is `true` for every one, for a page that shows where people are
     * from and cannot know which. Their licence comes with them.
     */
    flags: {
      files({ read, tree, options }) {
        const all = [...tree('DS1/x-flag', { only: /^[^/]+\.svg$/ }).keys()];
        const files = options.flags === true ? all : Array.isArray(options.flags) ? options.flags.map(code => `${code}.svg`) : [];
        if (!files.length) throw new Error('Name the flags to copy: "flags": ["jp", …], or true for every one');
        for (const file of files) if (!all.includes(file)) throw new Error(`Unknown flag: ${file.slice(0, -4)}`);
        return { 'LICENSE.md': read('DS1/x-flag/LICENSE.md'), ...Object.fromEntries(files.map(file => [file, read(`DS1/x-flag/${file}`)])) };
      },
    },
  },
};
