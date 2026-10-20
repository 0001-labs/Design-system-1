import type { ComponentExample } from './component-examples';
export const TOC_EXAMPLES: Record<string, ComponentExample> = {
  'table-of-contents': {
    title: 'Table of contents', hint: 'Follow the links or scroll the reading area. The current section updates in its own scroll container.', height: 420,
    html: `<style>
.toc-example { display:grid; grid-template-columns:calc(12 * var(--ds-unit)) minmax(0,1fr); gap:var(--ds-unit); width:100%; }
.toc-reading { height:calc(14 * var(--ds-unit)); overflow-y:auto; min-width:0; }
.toc-reading section { display:grid; gap:var(--ds-unit); padding:var(--ds-unit); min-height:calc(10 * var(--ds-unit)); box-sizing:border-box; }
@media(max-width:600px) { .toc-example { grid-template-columns:minmax(0,1fr); } }
</style>
<div class="toc-example">
  <ds-table-of-contents label="On this page" literal>
    <a href="#toc-overview">Overview</a>
    <a href="#toc-design">Design examples</a>
    <a href="#toc-try">Try it</a>
    <a href="#toc-size" data-depth="1">Choose a size</a>
  </ds-table-of-contents>
  <article class="toc-reading" tabindex="0" aria-label="Example article">
    <section><ds-text literal strong role="heading" aria-level="2" id="toc-overview">Overview</ds-text><ds-text literal wrap>A table of contents gives a longer page a clear structure. Each link takes you to a section.</ds-text></section>
    <section><ds-text literal strong role="heading" aria-level="2" id="toc-design">Design examples</ds-text><ds-text literal wrap>Use it beside a guide, a reference or a long article. The page chooses where the contents stand.</ds-text></section>
    <section><ds-text literal strong role="heading" aria-level="2" id="toc-try">Try it</ds-text><ds-text literal wrap>Scroll this article or follow a link. The current section is marked in the contents.</ds-text></section>
    <section><ds-text literal strong role="heading" aria-level="3" id="toc-size">Choose a size</ds-text><ds-text literal wrap>Nested sections stand one square further in. The rows, words and gaps follow the surface scale.</ds-text></section>
  </article>
</div>`,
  },
};
