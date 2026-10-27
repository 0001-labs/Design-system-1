import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, expect, test } from 'vite-plus/test';
import config from '../sync.exports.mjs';

/*
 * The feedback export's files, written out as Sync 1 copies them, must type-check
 * on their own in a strict project with nothing but the DOM's types, and in the
 * Worker and backend projects products check shared code with: no `?inline` or
 * `?raw` import, no Vite types and no special types.
 */

const root = join(import.meta.dirname, '..');
const tsc = join(root, 'node_modules/typescript/bin/tsc');
const read = (path: string) => readFileSync(join(root, path), 'utf8');
type Exported = { files(context: { read: typeof read; options: Record<string, unknown> }): Map<string, string> };
const feedback = (config.exports as unknown as Record<string, Exported>).feedback;

const work = mkdtempSync(join(tmpdir(), 'ds1-feedback-types-'));
afterAll(() => rmSync(work, { recursive: true, force: true }));

/** The flags strict products add to `strict`. */
const strict = {
  strict: true,
  noEmit: true,
  module: 'ESNext',
  moduleResolution: 'Bundler',
  isolatedModules: true,
  verbatimModuleSyntax: true,
  noUnusedLocals: true,
  noUnusedParameters: true,
  noFallthroughCasesInSwitch: true,
  noUncheckedIndexedAccess: true,
  noImplicitOverride: true,
  noUncheckedSideEffectImports: true,
  skipLibCheck: true,
};

const projects: Record<string, Record<string, unknown>> = {
  /** A browser project with only the DOM's types. */
  browser: { ...strict, target: 'ES2020', lib: ['ES2020', 'DOM', 'DOM.Iterable'], types: [] },
  /** A Worker project that also checks the page's code, with the DOM beside the Workers types. */
  worker: { ...strict, target: 'ES2022', lib: ['ES2022', 'DOM', 'DOM.Iterable'], typeRoots: [join(root, 'services/node_modules/@cloudflare')], types: ['workers-types'] },
  /** A backend project as Convex sets one up, whose shared folder holds the copy. */
  backend: { ...strict, target: 'ESNext', lib: ['ES2021', 'dom'], allowJs: true, typeRoots: [join(root, 'node_modules/@types')], types: ['node'] },
};

function typeCheck(name: string, files: Map<string, string>, options: Record<string, unknown>): string {
  const dir = join(work, name);
  for (const [file, content] of files) {
    mkdirSync(dirname(join(dir, file)), { recursive: true });
    writeFileSync(join(dir, file), content);
  }
  writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({ compilerOptions: options, include: ['**/*.ts'] }));
  try {
    execFileSync(process.execPath, [tsc, '-p', dir], { encoding: 'utf8', stdio: 'pipe' });
    return '';
  } catch (error) {
    const { stdout, stderr } = error as { stdout?: string; stderr?: string };
    return `${stdout ?? ''}${stderr ?? ''}`.trim() || String(error);
  }
}

test('the feedback copy is plain TypeScript with no query imports and no language runtime', () => {
  const files = feedback.files({ read, options: {} });
  expect([...files.keys()].every((file) => file.endsWith('.ts'))).toBe(true);
  for (const [file, content] of files) expect(content, file).not.toMatch(/["'][^"']+\?(?:inline|raw|url)["']/);
  expect([...files.keys()]).not.toContain('0-face/i18n.ts');
  expect([...files.keys()].some((file) => file.includes('translations'))).toBe(false);
});

test.each(Object.keys(projects))('the feedback copy passes a strict type check in a %s project', (name) => {
  expect(existsSync(join(root, name === 'worker' ? 'services/node_modules/@cloudflare/workers-types' : 'node_modules/@types/node'))).toBe(true);
  expect(typeCheck(name, feedback.files({ read, options: {} }), projects[name]!)).toBe('');
}, 60_000);

test('with the language runtime, the copy passes the same browser check', () => {
  const files = feedback.files({ read, options: { languages: true } });
  expect(files.has('0-face/i18n.ts')).toBe(true);
  expect(files.has('0-face/translations/da.json')).toBe(true);
  expect(typeCheck('browser-languages', files, { ...projects.browser, resolveJsonModule: true })).toBe('');
}, 60_000);

test.each(['browser', 'worker'])('the constraint checker (root module `constraints`) passes a strict type check in a %s project', (name) => {
  const files = new Map(['constraint-panel.ts', 'constraint-site.ts', 'constraints.ts', 'fault-lines.ts', 'button-label.ts', 'text-contrast.ts', 'word-wrap.ts', 'scaling.ts'].map((file) => [`0-face/${file}`, read(`DS1/0-face/${file}`)]));
  expect(typeCheck(`constraints-${name}`, files, projects[name]!)).toBe('');
}, 60_000);
