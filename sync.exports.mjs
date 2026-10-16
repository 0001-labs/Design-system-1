/**
 * What products copy from Design system 1, with Sync 1 (`sync1`, in
 * /Users/joachim/0001/Sync 1). A product names the exports it takes in its
 * sync.json; never edit the copies, change them here and sync.
 */
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { componentGraph } from './scripts/component-graph.mjs';

const languageFiles = ['i18n.ts', 'languages.ts', 'language-routing.ts', 'translations-format.ts', 'language-validator.ts', 'shared-words.ts'];

export default {
  exports: {
    library: {
      files({ read }) { return { 'library-styles.ts': read('DS1/0-face/library-styles.ts') }; },
    },
    /** Optional display faces, copied as local assets by consumers. */
    fonts: {
      files({ read, options }) {
        const available = { 'OlivettiDot-Regular.woff2': 'website/src/assets/fonts/OlivettiDot-Regular.woff2' };
        if (!Array.isArray(options.fonts) || !options.fonts.length) throw new Error('Name the fonts to copy');
        return Object.fromEntries(options.fonts.map(name => {
          if (!Object.hasOwn(available, name)) throw new Error(`Unknown font: ${name}`);
          return [name, read(available[name])];
        }));
      },
    },
    /** Component tokens for static stylesheets that import them by URL. */
    tokens: {
      files({ read, options }) {
        const files = ['component-tokens.css', 'component-metrics.css', 'component-appearance.css'];
        if (options.nativeControls) files.push('controls.css');
        return Object.fromEntries(files.map(file => [file, read(`DS1/1-root/${file}`)]));
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
