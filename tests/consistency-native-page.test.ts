import { describe, expect, test } from 'vite-plus/test';
import { nativeBlockStyles, nativeCollectionTracks, renderNativePage, validateNativePage, type NativeCollection, type NativePageDocument } from '../shared/consistency-native-page';

const collection:NativeCollection={id:'products',kind:'collection',binding:'storefront',layout:'gallery',columns:3,featured:2,columnGap:40,rowGap:120,imageHeight:400,fit:'contain'};
const document=():NativePageDocument=>({schema:1,kind:'native-page',layout:{padding:40,gap:80,maxWidth:1400},blocks:[{id:'header',kind:'flow',role:'header',direction:'row',padding:0,gap:40,children:[{id:'title',kind:'content',source:'# A flower studio',binding:'home.title'}]},structuredClone(collection)]});
const context={images:['/flowers.png'],collections:['storefront'],runtimes:{Cart:['label']},bindings:['home.title']};
describe('native page boundary',()=>{
  test('keeps a stable native tree and independent collection tracks/gaps',()=>{
    expect(validateNativePage(document(),context)).toEqual(document());
    expect(nativeCollectionTracks(collection)).toEqual({columns:6,ordinarySpan:2,featuredSpan:3});
    expect(nativeBlockStyles(collection)).toMatchObject({'--c9y-columns':'6','--c9y-column-gap':'calc(40px * var(--sf,1))','--c9y-row-gap':'calc(120px * var(--sf,1))'});
    expect(nativeBlockStyles({id:'logo',kind:'image',src:'/flowers.png',alt:'',width:160})).toMatchObject({width:'calc(160px * var(--sf,1))',flex:'0 1 auto'});
    const items=Array.from({length:5},(_,index)=>({id:String(index),href:`/product/${index}`,title:`Flower ${index}`,image:{src:'/flowers.png',alt:''}}));
    const html=renderNativePage(document(),{collections:{storefront:{items}},images:context.images});
    expect(html.match(/data-featured/g)).toHaveLength(2);
    expect(html).toContain('<header ');expect(html).toContain('data-native-block="products"');expect(html).not.toContain('data-c9y-block');
    const editor=renderNativePage(document(),{editor:true,collections:{storefront:{items}},images:context.images});
    expect(editor).toContain('data-c9y-native-root');expect(editor).toContain('data-c9y-block="products"');
  });
  test('refuses duplicate identities, cycles, arbitrary styles and unregistered data access',()=>{
    const duplicate=document();duplicate.blocks.push(duplicate.blocks[0]);expect(()=>validateNativePage(duplicate,context)).toThrow();
    const cyclic=document();(cyclic.blocks[0] as {children:unknown[]}).children.push(cyclic.blocks[0]);expect(()=>validateNativePage(cyclic,context)).toThrow();
    const arbitrary=document();Object.assign(arbitrary.blocks[0],{style:'position:fixed'});expect(()=>validateNativePage(arbitrary,context)).toThrow();
    const binding=document();(binding.blocks[1] as NativeCollection).binding='private.accounts';expect(()=>validateNativePage(binding,context)).toThrow();
    const runtime=document();runtime.blocks.push({id:'runtime',kind:'runtime',name:'Cart',props:{query:'private'}});expect(()=>validateNativePage(runtime,context)).toThrow();
  });
  test('preserves native disclosures/locales and refuses unsafe URLs',()=>{
    const page=document();page.blocks.push({id:'question',kind:'flow',direction:'column',gap:20,padding:0,locale:'da',disclosure:{label:'Et spørgsmål?'},children:[{id:'answer',kind:'content',source:'Et svar.'}]});
    const html=renderNativePage(validateNativePage(page,context));expect(html).toContain('<details ');expect(html).toContain('<summary>Et spørgsmål?</summary>');expect(html).toContain('data-native-locale="da"');
    page.blocks.push({id:'japanese',kind:'content',source:'花',locale:'ja'});expect(validateNativePage(page,context).blocks.at(-1)?.locale).toBe('ja');
    page.blocks.push({id:'bad',kind:'image',src:'javascript:alert(1)',alt:''});expect(()=>validateNativePage(page,context)).toThrow();
  });
});
