import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vite-plus/test';
import { composeRegionStyles, nativeIcon, renderNativeRegion, validateNativeRegion, nativeRegionStyles } from '../shared/consistency-native-content';

// The test runner gives every ?raw import an empty string, so the region sheet is composed here from the same files Vite inlines.
const read = (path: string) => readFileSync(join(import.meta.dirname, '..', path), 'utf8');
const regionStyles = () => composeRegionStyles({ tokens: read('DS1/1-root/component-tokens.css'), palette: read('DS1/1-root/palette.css'), metrics: read('DS1/1-root/component-metrics.css'), appearance: read('DS1/1-root/component-appearance.css'), controls: read('DS1/1-root/controls.css'), card: read('DS1/1-root/card.css'), prose: read('DS1/1-root/prose.css'), native: read('shared/consistency-native-content.css') });
/** A site's library as the libraries app publishes one: its tokens on the root, a display face on the prose headings. */
const library = `:root {\n  --ds-typeface-medium: "Poppins", sans-serif;\n  --ds-text-color: light-dark(#141414, #f2f2ef);\n  --ds-paper: light-dark(#ffffff, #151715);\n  --ds-accent-color: #17672b;\n  --ds-font-features: normal;\n  --c9y-tone-cream: #faf7e8;\n}\n[data-ds-prose] :where(h1, h2):not(:where([data-ds-not-prose] *)) {\n  font-family: var(--brand-display);\n  font-weight: 200;\n}\n`;
const declared = (css: string) => [...css.matchAll(/(--[a-z0-9-]+)\s*:/g)].map(match => match[1]!);

describe('a library sheet above the page reaches the words in every region', () => {
  const styles = regionStyles();
  const [defaults, rest] = styles.split('@scope (.c9y-native-region) {') as [string, string];
  // What the region draws for itself ends where the native sheet begins, after the scope.
  const scoped = rest.slice(0, rest.indexOf(read('shared/consistency-native-content.css').slice(0, 80)));
  const base = declared(read('DS1/1-root/component-tokens.css'));
  it('declares the design system\'s tokens as the page\'s defaults with no specificity, so a library\'s :root tokens win', () => {
    expect(defaults).toContain(':where(:root) {'); expect(defaults).toContain(':where(:root:lang(ja)) {');
    expect(defaults).not.toMatch(/(^|[\s,}])(?::root|:scope)\b/); expect(defaults).toContain('--ds-text-color:'); expect(defaults).toContain('--one-apple-green:');
    for (const token of declared(library)) if (token.startsWith('--ds-')) expect(defaults, token).toContain(`${token}:`);
  });
  it('re-declares only the component metrics in a region, so every other token is inherited from the page', () => {
    const atScope = /:scope,[^{]*\{([^}]*)\}/.exec(scoped);
    expect(atScope).not.toBeNull(); expect(atScope![1]).toContain('--ds-unit: calc(var(--ds-1, 20px) * var(--ds-sf, 1));');
    expect(declared(atScope![1]!)).toEqual(declared(read('DS1/1-root/component-metrics.css')));
    for (const token of declared(scoped)) expect(base, `${token} is a base token declared inside a region`).not.toContain(token);
    for (const token of declared(library)) expect(scoped, token).not.toContain(`${token}:`);
    expect(scoped).not.toContain(':root');
  });
  it('lets the library\'s heading face through: every prose rule in a region has no specificity', () => {
    expect(scoped).toContain(':where([data-ds-prose] :where(h1, h2, h3, h4, h5, h6):not(:where([data-ds-not-prose] *))) {');
    expect(scoped).toContain(':where([data-ds-prose]) {');
    const prose = scoped.slice(scoped.indexOf(':where([data-ds-prose]) {'));
    const selectors = [...prose.matchAll(/(?:^|\})\s*([^@{}]+?)\s*\{/g)].map(match => match[1]!.trim());
    expect(selectors.length).toBeGreaterThan(20);
    for (const selector of selectors) expect(selector, selector).toMatch(/^:where\(.*\)$/);
    expect(prose).not.toContain('/*');
    expect(nativeRegionStyles).toContain('@scope (.c9y-native-region)');
  });
  it('names the library\'s icons, and nothing an object carries of its own', () => {
    expect(nativeIcon('instagram')).toMatch(/^<svg/); expect(nativeIcon('facebook')).toContain('currentColor');
    expect(nativeIcon('not-an-icon')).toBeUndefined(); expect(nativeIcon('constructor')).toBeUndefined(); expect(nativeIcon('__proto__')).toBeUndefined();
  });
});

describe('native page content publication', () => {
  it('keeps the editor Markdown and publishes native columns, tabs, table and inline formatting', () => {
    const source = '<columns>\n<column>\n## Hello **there**\n</column>\n<column>\n<tabs>\n<tab name="One">\n| A | B |\n| --- | --- |\n| x | y |\n</tab>\n<tab name="Two">\n- Second\n</tab>\n</tabs>\n</column>\n</columns>';
    expect(validateNativeRegion(source, [])).toBe(source);
    const html = renderNativeRegion(source, { id: 'new_abcdefgh' });
    expect(html).toContain('c9y-native-columns'); expect(html).toContain('<strong>there</strong>');
    expect(html).toContain('type="radio"'); expect(html).toContain('<th>A</th>'); expect(html).toContain('<li>Second</li>');
    expect(nativeRegionStyles).toContain('@scope (.c9y-native-region)');
  });
  it('publishes canonical closed cards, buttons, carousel and icons without custom elements or page scripts', () => {
    const source = '```c9y-card\n{"label":"Label","title":"Title","body":"Body","tone":"pink","variant":"filled","height":200,"gaps":{"label":20}}\n```\n\n```c9y-button\n{"label":"Go","secondary":true,"action":{"kind":"page","target":"/about"}}\n```\n\n```c9y-carousel\n{"slides":[{"id":"first","src":"/image.jpg","alt":"Image","fit":"contain"}],"height":280}\n```\n\n:icon[star]';
    const html = renderNativeRegion(validateNativeRegion(source, ['/image.jpg']));
    expect(html).toContain('data-tone="pink"'); expect(html).toContain('--ds-card-label-gap:calc(20px');
    expect(html).toContain('href="/about"'); expect(html).toContain('object-fit:contain'); expect(html).toContain('<svg');
    expect(html).not.toMatch(/<(?:script|ds-card|ds-carousel)\b/);
  });
  it('escapes authored text and rejects unsafe links and unapproved local media', () => {
    expect(renderNativeRegion('<img src=x onerror=alert(1)>')).toContain('&lt;img');
    for (const source of ['[click](javascript:alert)', '![x](data:image/png;base64,AAAA)', '![x](/other.jpg)', '```c9y-card\n{}\n```', ':icon[not-a-real-icon]']) {
      expect(() => validateNativeRegion(source, ['/image.jpg'])).toThrow();
    }
    expect(renderNativeRegion('![x](https://example.com/image.jpg)')).toContain('src="https://example.com/image.jpg"');
  });
  it('bounds input before parsing and keeps per-region tab IDs separate', () => {
    expect(() => validateNativeRegion('x'.repeat(24_001), [])).toThrow();
    const source = '<tabs>\n<tab name="A">\nA\n</tab>\n</tabs>';
    expect(renderNativeRegion(source, { id: 'first' })).toContain('first-tabs-1');
    expect(renderNativeRegion(source, { id: 'second' })).toContain('second-tabs-1');
  });
  it('publishes canonical text and column gap keys and rejects foreign or executable styles', () => {
    const source = 'First\n\nSecond\n\n<columns>\n<column>\nA\n\nB\n</column>\n<column>\nC\n</column>\n</columns>';
    const gaps = { 'new_abcdefgh-text-1': 60, 'new_abcdefgh-nested-1-text-1': 40, 'columns:new_abcdefgh:0:0': 80 };
    expect(validateNativeRegion(source, [], gaps, 'new_abcdefgh')).toBe(source);
    const html = renderNativeRegion(source, { id: 'new_abcdefgh', gaps });
    expect(html).toContain('margin-block-start:calc(60px'); expect(html).toContain('margin-block-start:calc(40px');
    expect(html).toContain('--c9y-column-gap:calc(80px');
    expect(() => renderNativeRegion(source, { id: 'new_abcdefgh', gaps: { 'other-text-1': 20 } })).toThrow();
    expect(() => renderNativeRegion(source, { id: 'new_abcdefgh', gaps: { 'new_abcdefgh-text-1': -20 } })).toThrow();
  });
});
