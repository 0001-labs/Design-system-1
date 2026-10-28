import {expect,test} from 'vite-plus/test';
import {importWritingPage} from './workspace-migration';
const draft=()=>({schema:1,example:'editor',library:'original',fonts:{},composition:{text:'# My introduction',sections:{next:'Saved words'},width:800,padding:40,gap:20,wrap:true,consistency:true,order:['next','intro'],hidden:['intro'],gaps:{'next-text-1':60,'section-next':80},sizes:{},cardDesigns:{},cardGaps:{},statDesigns:{},buttonDesigns:{}}});
test('imports saved writing, ordering, hiding and both kinds of spacing without changing the source',()=>{
 const value=draft(),before=structuredClone(value),result=importWritingPage(value)!;
 expect(value).toEqual(before);expect(result.page.layout).toEqual({maxWidth:800,padding:40,gap:0});
 expect(result.page.blocks).toEqual([{id:'sequence_0',kind:'flow',direction:'column',gap:80,padding:0,children:[{id:'next',kind:'content',source:'Saved words',gaps:{'next-text-1':60}},{id:'sequence_1',kind:'flow',direction:'column',gap:20,padding:0,children:[{id:'intro',kind:'content',source:'# My introduction',hidden:true},{id:'trailing_space',kind:'flow',direction:'column',gap:0,padding:0,children:[]}]}]}]);
 expect(importWritingPage(result as unknown as Record<string,unknown>)).toEqual(result);
});
test('does not discard authored layout, hidden content or unsupported component design',()=>{
 for(const patch of [{text:'```diagram\n[Keep my drawing]\n```'},{sections:{__authored:'1',__layout:'saved'}},{cardDesigns:{card:{tone:'red'}}},{sections:{next:'Saved words',orphan:'Keep me'}},{gaps:{unknown:40}}]) {
   const value=draft();Object.assign(value.composition,patch);expect(importWritingPage(value)).toBeNull();
 }
});
