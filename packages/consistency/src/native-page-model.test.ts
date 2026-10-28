import { describe, expect, it } from 'vite-plus/test';
import { PLACEHOLDER_PICTURE, addSectionItem, clampSectionMeasure, firstWordsId, itemsSlot, memberAt, moveSectionItem, nativeGridSpaces, nativeEntries, newSection, readAt, removeSectionItem, sectionItemIds, sectionKinds, sectionPath, sectionValue, updateNativeBlock, updateNativeChildren, writeAt } from './native-page-model';
import { SECTION_KINDS, sectionDefinition } from '../../../shared/consistency-vocabulary';
import { validateNativePage, type NativeCards, type NativeHero, type NativePageDocument, type NativeQuestions, type NativeSection } from '../../../shared/consistency-native-page';
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
  it('keeps sticky headers from creating gutters across scrolled content',()=>{
    const spaces=nativeGridSpaces([box(0,0,1000,60),box(160,-500,680,1400),box(0,920,1000,300)]);
    expect(spaces).toEqual([{axis:'vertical',box:{left:160,top:900,width:680,height:20}}]);
  });
  it('does not call overlapping content a gutter',()=>expect(nativeGridSpaces([box(0,0,200,200),box(100,0,200,200)])).toEqual([]));
  it('reorders one typed sibling list without changing bound content',()=>{
    const document:NativePageDocument={schema:1,kind:'native-page',layout:{gap:20,padding:20},blocks:[{id:'main',kind:'flow',direction:'column',gap:20,padding:20,children:[{id:'words',kind:'content',source:'Current title',binding:'home.title'},{id:'cart',kind:'runtime',name:'Cart',props:{}}]}]};
    const next=updateNativeChildren(document,'main',children=>[...children].reverse());
    expect(nativeEntries(next).get('words')?.index).toBe(1);expect(nativeEntries(next).get('words')?.block).toEqual(nativeEntries(document).get('words')?.block);
  });
});

const example=<T extends NativeSection>(kind:string,index=0)=>structuredClone(sectionDefinition(kind)!.examples[index]) as T;
const page=(blocks:NativeSection[]):NativePageDocument=>({schema:1,kind:'native-page',layout:{gap:40,padding:0},blocks});
const context={images:['/photos/harbour.jpg','/photos/logo.svg'],collections:['storefront'],runtimes:{},bindings:[]};
let counter=0;const newId=()=>`fresh_${++counter}`;

describe('edits a section as one block: slots, items and ranges from the vocabulary',()=>{
  it('lists a section once, its slots and items reached by their derived ids',()=>{
    const document=page([example<NativeHero>('hero'),example<NativeCards>('cards')]);
    expect([...nativeEntries(document).keys()]).toEqual(['top','tours']);
    expect(sectionItemIds(example('cards'))).toEqual(['tours.items.0','tours.items.1','tours.items.2']);
    expect(sectionItemIds(example('panels'))).toEqual(['rafts-green','rafts-blue']);
    expect(sectionItemIds(example('gallery'))).toEqual(['photos.pictures.0','photos.pictures.1','photos.pictures.2','photos.pictures.3']);
    expect(sectionItemIds(example('hero'))).toEqual([]);
    expect(sectionPath('tours','tours.items.1.title')).toEqual(['items','1','title']);
    expect(sectionPath('site-footer','site-footer.mark')).toEqual(['brand']);
    expect(sectionPath('top','other.title')).toBeUndefined();
    expect(memberAt('cards',['items','1','title'])?.type).toBe('words');expect(memberAt('questions',['items','0','question'])?.type).toBe('text');
    expect(memberAt('footer',['columns','0','lines','1'])?.type).toBe('links');expect(memberAt('hero',['actions','0'])?.type).toBe('actions');expect(memberAt('hero',['nothing'])).toBeUndefined();
  });
  it('writes a slot through its path and leaves the rest of the section as it was',()=>{
    const cards=example<NativeCards>('cards');
    const next=writeAt(cards,['items','1','title'],'Evening sailing') as NativeCards;
    expect(next.items[1]!.title).toBe('Evening sailing');expect(next.items[0]).toBe(cards.items[0]);expect(readAt(next,['items','1','title'])).toBe('Evening sailing');
    const hero=writeAt(example<NativeHero>('hero'),['actions','0','text'],'Reserve') as NativeHero;
    expect(hero.actions![0]!.text).toBe('Reserve');expect(hero.actions![0]!.href).toBe('/book/');
    const document=updateNativeBlock(page([cards]),'tours',block=>writeAt(block as NativeCards,['items','0','picture'],{src:'/photos/logo.svg',alt:'Mark'}));
    expect(validateNativePage(document,context).blocks[0]).toEqual(document.blocks[0]);
  });
  it('reorders and removes items inside the section, never below the kind\'s minimum, and adds one from the example',()=>{
    const document=page([example('cards'),example('questions')]);
    const moved=moveSectionItem(document,'tours',2,0) as NativePageDocument;
    expect((moved.blocks[0] as NativeCards).items.map(item=>item.title)).toEqual(['Quiz tour','Private green raft','Sunset sailing']);
    expect(moveSectionItem(document,'tours',1,1)).toEqual(document);
    const removed=removeSectionItem(document,'faq',0);
    expect((removed.blocks[1] as NativeQuestions).items.map(item=>item.question)).toEqual(['What if it rains?']);
    expect(removeSectionItem(removed,'faq',0)).toEqual(removed);
    const added=addSectionItem(document,'tours',['/photos/logo.svg'],newId);
    const items=(added.blocks[0] as NativeCards).items;expect(items).toHaveLength(4);
    expect(items[3]).toEqual({label:'Label',title:'Title',text:'Text',picture:{src:'/photos/logo.svg',alt:''},action:{text:'Button',href:'/book/green/',appearance:'primary',face:'outlined',size:'medium'}});
    expect(validateNativePage(added,context).blocks[0]).toEqual(added.blocks[0]);
    const panels=addSectionItem(page([example('panels')]),'rafts',context.images,newId);
    const heroes=(panels.blocks[0] as {items:NativeHero[]}).items;expect(heroes).toHaveLength(3);expect(heroes[2]!.id).toMatch(/^fresh_/);expect(heroes[2]!.title).toBe('Title');
    expect(addSectionItem(panels,'rafts',context.images,newId)).toEqual(panels);
  });
  it('keeps a measure on the square inside the kind\'s range and on its step',()=>{
    expect(clampSectionMeasure('hero','height',23.4)).toBe(23);expect(clampSectionMeasure('hero','height',11)).toBe(12);expect(clampSectionMeasure('hero','height',41)).toBe(40);
    expect(clampSectionMeasure('header','fold',26)).toBe(30);expect(clampSectionMeasure('header','fold',20)).toBe(20);
    expect(clampSectionMeasure('cards','columns',9)).toBe(4);expect(clampSectionMeasure('cards','columns',0.4)).toBe(1);
    expect(sectionValue<number>(example('hero'),'height')).toBe(24);expect(sectionValue<number>({id:'x',kind:'hero',picture:{src:'/photos/harbour.jpg',alt:''},title:'T'},'height')).toBe(24);
    expect(itemsSlot('cards')?.definition.min).toBe(1);expect(itemsSlot('panels')?.definition.type).toBe('heroes');expect(itemsSlot('hero')).toBeUndefined();
  });
  it('makes every kind from its example: fresh ids, placeholder words, the site\'s picture, valid on the page',()=>{
    expect(sectionKinds().map(kind=>kind.kind)).toEqual([...SECTION_KINDS]);
    for(const kind of SECTION_KINDS){
      const block=newSection(kind,['/photos/harbour.jpg'],newId)!;
      expect(block.id,kind).toMatch(/^fresh_/);
      const checked=validateNativePage(page([block]),context).blocks[0];
      expect(checked,kind).toEqual(block);
      expect(JSON.stringify(block),kind).not.toContain('harbour.jpg","alt":"Three');
      expect(JSON.stringify(block),kind).not.toMatch(/"(?:title|heading|text|answer|term|question|name)":"(?!Title|Heading|Text|Answer|Term|Question|Name|Button|Link|Policy|Follow|Line|Legal line|Tagline|Kicker|Label|Value)/);
    }
    const hero=newSection('hero',[],newId) as NativeHero;expect(hero.picture.src).toBe(PLACEHOLDER_PICTURE);expect(hero.title).toBe('Title');expect(hero.actions![0]).toEqual({text:'Button',href:'/book/',appearance:'primary',face:'outlined',size:'medium'});
    expect(firstWordsId(hero)).toBe(`${hero.id}.title`);expect(firstWordsId(newSection('cards',[],newId) as NativeCards)).toMatch(/\.items\.0\.label$/);expect(firstWordsId(newSection('gallery',[],newId)!)).toBeUndefined();
    const header=newSection('header',[],newId) as NativeSection&{languages?:unknown;menu?:unknown;links:{text:string}[]};expect(header.languages).toBeUndefined();expect(header.menu).toBeUndefined();expect(header.links.map(link=>link.text)).toEqual(['Link','Link','Link','Link']);
    const panels=newSection('panels',[],newId) as NativeSection&{items:NativeHero[]};expect(new Set(panels.items.map(hero=>hero.id)).size).toBe(2);expect(panels.items[0]!.id).not.toBe(panels.id);
  });
});
