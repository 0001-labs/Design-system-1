import { rmSync } from 'node:fs';
// Prevent deleted internal modules from surviving in the npm build.
rmSync(new URL('../dist/', import.meta.url), { recursive: true, force: true });
