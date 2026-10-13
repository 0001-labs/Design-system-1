import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, expect, test } from 'vite-plus/test';

const targets: string[] = [];
afterEach(() => targets.splice(0).forEach(path => rmSync(path, { recursive: true, force: true })));

function sync(target: string, components: string, check = false) {
  return execFileSync(process.execPath, [resolve('scripts/sync-components.mjs'), '--target', target, '--components', components, ...(check ? ['--check'] : [])], { encoding: 'utf8', stdio: 'pipe' });
}

test('snapshots include dependencies, detect drift, and preserve consumer-owned files when reducing the selection', () => {
  const target = mkdtempSync(join(tmpdir(), 'shared-components-'));
  targets.push(target);
  writeFileSync(join(target, 'application.ts'), 'export const application = true;');
  sync(target, 'button,panel,input');
  expect(existsSync(join(target, '2-core/ds-text.ts'))).toBe(true);
  expect(existsSync(join(target, '0-face/translations/en.json'))).toBe(true);
  expect(existsSync(join(target, 'x-icon/ezo-password-visibility-see.svg'))).toBe(true);
  expect(sync(target, 'button,panel,input', true)).toContain('Verified');
  writeFileSync(join(target, '2-core/ds-button.ts'), 'changed');
  expect(() => sync(target, 'button,panel', true)).toThrow();
  sync(target, 'panel');
  expect(existsSync(join(target, '2-core/ds-button.ts'))).toBe(false);
  expect(readFileSync(join(target, 'application.ts'), 'utf8')).toBe('export const application = true;');
  expect(sync(target, 'panel', true)).toContain('Verified');
});

test('sync refuses to write into or over its own source', () => {
  for (const target of ['.', 'DS1', 'DS1/snapshot']) {
    expect(() => sync(resolve(target), 'button')).toThrow(/consumer snapshot/);
  }
});
