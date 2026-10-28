import {expect,test} from 'vite-plus/test';
import {EXAMPLE_PAGES,exampleDocument} from './examples';
test('all lab examples seed the common native document and keep independent drafts',()=>{
 expect(EXAMPLE_PAGES).toHaveLength(32);expect(EXAMPLE_PAGES.slice(0,2).map(page=>page.id)).toEqual(['editor','studio']);
 for(const example of EXAMPLE_PAGES)expect(exampleDocument(example.id)).toMatchObject({schema:2,page:{kind:'native-page'}});
 const a=exampleDocument('shop')as any,b=exampleDocument('shop')as any;a.page.blocks.length=0;expect(b.page.blocks.length).toBeGreaterThan(0);expect(exampleDocument('unknown')).toEqual(exampleDocument('editor'));
});
