// Writes shared/consistency-vocabulary.ts as shared/generated/vocabulary.json: the one record of every
// native block kind, its fields, slots and examples, which the editor's insert menu, the renderer's
// documentation, the Ask prompt and the sites take through Sync 1's native-content export.
// Run with `vp exec tsx scripts/write-vocabulary.ts`; tests/consistency-vocabulary.test.ts fails while it is stale.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { vocabularyJson } from '../shared/consistency-vocabulary';

const path = join(import.meta.dirname, '../shared/generated/vocabulary.json');
mkdirSync(dirname(path), { recursive: true });
writeFileSync(path, vocabularyJson());
console.log(`Wrote ${path}`);
