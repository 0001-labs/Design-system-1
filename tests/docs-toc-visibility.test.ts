// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { afterEach, expect, test } from 'vite-plus/test';
const source=readFileSync('website/src/components/LibraryWorkspace.astro','utf8');
const globalStyles=[...source.matchAll(/<style is:global>([\s\S]*?)<\/style>/g)].map(match=>match[1]).join('\n');
afterEach(()=>{document.head.replaceChildren();document.body.replaceChildren();document.documentElement.removeAttribute('data-signed-in');document.documentElement.removeAttribute('data-library-workspace');});
test('signing in keeps the documentation right-hand contents visible',()=>{
 document.documentElement.setAttribute('data-signed-in','');
 const style=document.createElement('style');style.textContent=globalStyles;document.head.append(style);
 document.body.innerHTML='<main class="main-content"><aside class="right-sidebar-container"><ds-table-of-contents label="On this page"></ds-table-of-contents></aside></main>';
 const sidebar=document.querySelector<HTMLElement>('.right-sidebar-container')!;
 expect(getComputedStyle(sidebar).display).not.toBe('none');
});
test.each([true,false])('library chrome remains scoped to its workspace, signed in: %s',signedIn=>{
 if(signedIn)document.documentElement.setAttribute('data-signed-in','');
 const style=document.createElement('style');style.textContent=globalStyles;document.head.append(style);
 document.body.innerHTML='<section class="library-workspace"><header class="library-heading">Library</header><nav class="library-tabs">Tabs</nav></section><header class="library-heading" id="other-heading">Other page</header>';
 for(const element of document.querySelectorAll<HTMLElement>('.library-workspace :is(.library-heading,.library-tabs)')){
  expect(getComputedStyle(element).display==='none').toBe(signedIn);
 }
 expect(getComputedStyle(document.querySelector<HTMLElement>('#other-heading')!).display).not.toBe('none');
});
