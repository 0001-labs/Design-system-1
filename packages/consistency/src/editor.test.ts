// @vitest-environment happy-dom
import {expect,test,vi} from 'vite-plus/test';
vi.hoisted(()=>{globalThis.fetch=async()=>new Response('{}');});
import {ConsistencyEditor} from './index';
import {workspaceSeed} from './workspace-seed';
import {templateDocument} from './templates';
import templates from '../../../shared/consistency-template-pages.json';
test('the lab document boundary uses the same page model as hosted sites',()=>{
 const editor=new ConsistencyEditor();editor.loadDocument(workspaceSeed());expect(editor.readDocument()).toEqual(workspaceSeed());
 expect(editor.readDocument()).not.toHaveProperty('composition');
});
test('every template opens through that same document boundary',()=>{
 for(const id of Object.keys(templates).filter(id=>id!=='studio')){const editor=new ConsistencyEditor();editor.loadDocument(templateDocument(id));expect(editor.readDocument()).toMatchObject({schema:2,example:id,page:{kind:'native-page'}});}
});
test('stored studio drafts migrate before any editor is mounted',()=>{
 const seed=(templates.studio as any).seed,editor=new ConsistencyEditor();editor.loadDocument({schema:1,example:'studio',library:'original',fonts:{text:'Inter'},composition:{...seed,text:'# Saved words'}});
 expect(JSON.stringify(editor.readDocument())).toContain('Saved words');expect(editor.readDocument().fonts).toEqual({text:'Inter'});expect(editor.readDocument()).not.toHaveProperty('composition');
});
