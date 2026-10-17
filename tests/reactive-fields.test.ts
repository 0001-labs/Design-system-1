import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vite-plus/test';

// A reactive property written as a class field (`text = ""` or `align?: string`) defines an own
// property that hides Lit's accessor: the element throws in development and stops updating in
// production. Reactive properties are declared (`declare text: string`) and given defaults in the constructor.
const root = join(import.meta.dirname, '../DS1');
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : path.endsWith('.ts') ? [path] : [];
  });

test('no element declares a reactive property as a class field', () => {
  const shadowed: string[] = [];
  for (const file of files(root)) {
    const source = readFileSync(file, 'utf8');
    // Only the element's class body: exported interfaces above it have their own fields.
    const start = source.search(/\bclass \w+ extends /);
    if (start < 0) continue;
    const body = source.slice(start);
    const block = body.match(/static (?:override )?properties\s*=\s*\{([\s\S]*?)\n\s*\};/);
    if (!block) continue;
    const keys = [...block[1]!.matchAll(/^\s*(\w+)\s*:/gm)].map(match => match[1]!);
    for (const key of keys) {
      // A class member sits two spaces in and ends with a semicolon: `  key = value;` or `  key?: Type;`.
      if (new RegExp(`^ {2}(?:public |protected |private |override )*${key}\\??(?:\\s*:[^=;]+)?(?:\\s*=[^;]+)?;\\s*(?://.*)?$`, 'm').test(body.replace(block[0], ''))) {
        shadowed.push(`${file.slice(root.length + 1)}: ${key}`);
      }
    }
  }
  expect(shadowed).toEqual([]);
});
