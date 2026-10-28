import {expect,test} from 'vite-plus/test';
import pages from './consistency-template-pages.json';
import {validateNativePage} from './consistency-native-page';
for(const[id,value]of Object.entries(pages))test(`${id}: the template is a complete validated native block document`,()=>{
 const page=value as unknown as {document:unknown;components:Record<string,never>};
 const valid=validateNativePage(page.document,{components:page.components,images:[],collections:[],runtimes:{}});
 expect(valid.kind).toBe('native-page');expect(valid.layout.mode).toBe('document');
});
