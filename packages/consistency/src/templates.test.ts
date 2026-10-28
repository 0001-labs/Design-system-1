import {expect,test} from 'vite-plus/test';
import {DOC_EXAMPLES} from '../../../shared/doc-examples';
import {SITE_TEMPLATES,templateDocument,templatePage} from './templates';
import {renderNativePage} from '../../../shared/consistency-native-page';
test('every canonical template is a native document with its trusted presentation library',()=>{
 expect(SITE_TEMPLATES.map(template=>template.id)).toEqual(['blank',...DOC_EXAMPLES.map(example=>example.id)]);
 for(const template of SITE_TEMPLATES){expect(templateDocument(template.id)).toMatchObject({schema:2,page:{kind:'native-page'}});expect(Object.keys(template.components).length).toBeGreaterThan(0);}
 const one=templateDocument('shop')as any,two=templateDocument('shop')as any;one.page.blocks.pop();expect(one.page.blocks).not.toEqual(two.page.blocks);expect(()=>templateDocument('unknown')).toThrow('Choose a template.');
});
test('demo data, words, SVG artwork and libraries remain available to the common renderer',()=>{
 const report=templatePage('html-report');expect(Object.values(report.components).some(component=>String(JSON.stringify(component.properties?.data)).includes('April'))).toBe(true);
 const booking=templatePage('booking');expect(renderNativePage(booking.document,{components:booking.components})).toContain('Get more from every work trip');expect(booking.library).toContain('--');
});
