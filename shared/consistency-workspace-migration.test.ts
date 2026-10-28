import {expect,test} from 'vite-plus/test';
import templates from './consistency-template-pages.json';
import {migrateWorkspacePage,studioSeed} from './consistency-workspace-migration';
const legacy=(example:string,composition:Record<string,unknown>)=>({schema:1,example,library:'original',fonts:{heading:'Lora'},composition:{text:'',sections:{},order:['intro'],hidden:[],gaps:{},width:800,padding:40,gap:20,wrap:true,sizes:{},cardDesigns:{},cardGaps:{},statDesigns:{},buttonDesigns:{},...composition}});
const walk=(blocks:any[]):any[]=>blocks.flatMap(block=>[block,...(block.children?walk(block.children):[])]);
test('authored drafts retain light and shadow text edits and their layout overrides in native blocks',()=>{
 const template=templates.booking as any,key=Object.keys(template.textKeys)[0],sourceId=Object.keys(template.sourceIds).find(id=>template.components[walk(template.document.blocks).find(block=>block.id===template.sourceIds[id])?.name]?.tag==='ds-text')!;
 const result=migrateWorkspacePage(legacy('booking',{sections:{__authored:'1',[key]:'Saved heading',[`template:${sourceId}:0`]:'Saved component words',__layout:JSON.stringify({schema:1,nodes:{[sourceId]:{padding:60}},order:{}})}}));
 const blocks=walk(result.page.blocks);expect(blocks.find(block=>block.id===template.textKeys[key]).text).toBe('Saved heading');expect(blocks.find(block=>block.id===template.sourceIds[sourceId])).toMatchObject({padding:60,words:{[sourceId+':0']:'Saved component words'}});expect(result.fonts.heading).toBe('Lora');
});
test('studio drafts preserve writing, diagrams, card designs, dimensions, gaps, actions and hidden content',()=>{
 const seed=(templates.studio as any).seed,source=legacy('studio',{...seed,text:'# Saved intro\n\n```diagram\n[Keep the drawing]\n```',sections:{...seed.sections,work:'## Saved work'},order:['contact','intro','work','approach'],hidden:['kitchen'],sizes:{bookshop:{width:320,height:360}},cardDesigns:{bookshop:{tone:'pink',variant:'outlined'}},cardGaps:{bookshop:{title:60}},buttonDesigns:{'explore-action':{appearance:'primary'}},statDesigns:{'starting-point':{color:'orange'}},gaps:{...seed.gaps,'intro-actions':80,'stat:starting-point:label':40}});
 const result=migrateWorkspacePage(source),blocks=walk(result.page.blocks),ids=(templates.studio as any).sourceIds;
 expect(blocks.find(block=>block.id==='intro').source).toContain('[Keep the drawing]');expect(blocks.find(block=>block.id==='work').source).toBe('## Saved work');
 expect(blocks.find(block=>block.id===ids.bookshop)).toMatchObject({width:320,height:360,design:{tone:'pink',variant:'outlined',gaps:{title:60}}});expect(blocks.find(block=>block.id===ids.kitchen).hidden).toBe(true);expect(blocks.find(block=>block.id===ids['gap:intro-actions']).gap).toBe(80);expect(blocks.find(block=>block.id===ids['starting-point']).design).toEqual({color:'orange',gaps:{label:40}});
 expect(studioSeed().page.blocks.length).toBeGreaterThan(0);
});
test('writing drafts retain diagrams, wrapping, hidden sections and text spacing without a legacy editor',()=>{
 const result=migrateWorkspacePage(legacy('editor',{text:'```diagram wrap\n[Hello]\n```',sections:{next:'Other words'},order:['intro','next'],hidden:['next'],gaps:{'intro-text-1':60},wrap:false}));
 const blocks=walk(result.page.blocks);expect(blocks.find(block=>block.id==='intro')).toMatchObject({wrap:false,gaps:{'intro-text-1':60}});expect(blocks.find(block=>block.id==='section_next').hidden).toBe(true);
 expect(migrateWorkspacePage(result)).toEqual(result);
});
