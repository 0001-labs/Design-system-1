import { readFile } from 'node:fs/promises';
/** Existing canvas contracts mount the editor directly; workspace.mjs covers the CMS shell. */
export async function componentFixture(file) {
 const bytes=await readFile(file);
 return String(file).endsWith('/private-consistency/index.html') ? Buffer.from(bytes.toString().replace('<div id="consistency-workspace"></div>','<consistency-editor></consistency-editor>')) : bytes;
}
