// C9Y constraints: writes packages/consistency/C9Y-constraints.md from packages/consistency/src/c9y-constraints.ts,
// then runs the tests that hold every rule, so the document and the editor say the same thing.
//   vp run c9y-constraints
import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { constraintsDocument } from '../packages/consistency/src/c9y-constraints';

const path = new URL('../packages/consistency/C9Y-constraints.md', import.meta.url);
writeFileSync(path, constraintsDocument());
console.log(`Wrote ${path.pathname}`);
execSync('vp test run packages/consistency/src/c9y-constraints.test.ts packages/consistency/src/settle.test.ts', { stdio: 'inherit' });
