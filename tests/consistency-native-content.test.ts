import { describe, expect, it } from 'vitest';
import { renderNativeRegion, validateNativeRegion, nativeRegionStyles } from '../shared/consistency-native-content';

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
