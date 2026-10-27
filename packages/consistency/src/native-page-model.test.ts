import { describe, expect, it } from 'vite-plus/test';
import { nativeGridSpaces, nativeEntries, updateNativeChildren } from './native-page-model';
import type { NativePageDocument } from '../../../shared/consistency-native-page';
const box=(left:number,top:number,width:number,height:number)=>({left,top,width,height,right:left+width,bottom:top+height});
describe('native page model',()=>{
  it('maps two featured and three ordinary gallery items to actual whitespace',()=>{
    const items=[box(20,100,460,300),box(520,100,460,300),box(20,460,280,260),box(340,460,280,260),box(660,460,280,260)];
    const spaces=nativeGridSpaces(items);
    expect(spaces.filter(space=>space.axis==='horizontal').map(space=>space.box)).toEqual([box(480,100,40,300),box(300,460,40,260),box(620,460,40,260)].map(({left,top,width,height})=>({left,top,width,height})));
    expect(spaces.find(space=>space.axis==='vertical')?.box).toEqual({left:20,top:400,width:920,height:60});
    for(const space of spaces)for(const item of items)expect(Math.min(space.box.left+space.box.width,item.right)-Math.max(space.box.left,item.left)>0&&Math.min(space.box.top+space.box.height,item.bottom)-Math.max(space.box.top,item.top)>0).toBe(false);
    expect(nativeGridSpaces(items.map(item=>({...item,top:item.top-180,bottom:item.bottom-180})))).toEqual(spaces.map(space=>({...space,box:{...space.box,top:space.box.top-180}})));
  });
  it('does not call overlapping content a gutter',()=>expect(nativeGridSpaces([box(0,0,200,200),box(100,0,200,200)])).toEqual([]));
  it('reorders one typed sibling list without changing bound content',()=>{
    const document:NativePageDocument={schema:1,kind:'native-page',layout:{gap:20,padding:20},blocks:[{id:'main',kind:'flow',direction:'column',gap:20,padding:20,children:[{id:'words',kind:'content',source:'Current title',binding:'home.title'},{id:'cart',kind:'runtime',name:'Cart',props:{}}]}]};
    const next=updateNativeChildren(document,'main',children=>[...children].reverse());
    expect(nativeEntries(next).get('words')?.index).toBe(1);expect(nativeEntries(next).get('words')?.block).toEqual(nativeEntries(document).get('words')?.block);
  });
});
