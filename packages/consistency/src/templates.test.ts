// @vitest-environment happy-dom
import { expect, it } from 'vite-plus/test';
import { DOC_EXAMPLES } from '../../../shared/doc-examples';
import { SITE_TEMPLATES, templateDocument } from './templates';
import { EXAMPLE_PAGES } from './examples';
it('offers every canonical DS1 example, including disabled listings and HTML files', () => {
 expect(SITE_TEMPLATES.map(template => template.id)).toEqual(['blank', ...DOC_EXAMPLES.map(example => example.id)]);
 for (const template of SITE_TEMPLATES) {
  expect(template.html).toBeTruthy(); expect(EXAMPLE_PAGES.some(page => page.id === template.id)).toBe(true);
  expect(template.html).not.toMatch(/<script\b/i);
  expect(templateDocument(template.id)).toMatchObject({ schema: 1, example: template.id, composition: { sections: { __authored: '1' } } });
 }
 const one = templateDocument('shop'), two = templateDocument('shop');
 (one.composition as { sections: Record<string,string> }).sections.changed = 'Mine';
 expect((two.composition as { sections: Record<string,string> }).sections.changed).toBeUndefined();
 expect(() => templateDocument('unknown')).toThrow('Choose a template.');
});
it('keeps script-produced initial content and library designs without running demos in the editor', () => {
 const issues = SITE_TEMPLATES.find(template => template.id === 'issues')!;
 expect(issues.html).toContain('issue'); expect(issues.library).toContain('--');
 const report = SITE_TEMPLATES.find(template => template.id === 'html-report')!;
 expect(Object.values(report.components).some(component => JSON.stringify(component.data).includes('April'))).toBe(true);
 const booking = SITE_TEMPLATES.find(template => template.id === 'booking')!;
 expect(booking.html).toContain('Get more from every work trip');
 expect(booking.library).toContain('--');
});
