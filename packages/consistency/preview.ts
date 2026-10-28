import '../../DS1/1-root/prose.css';
import './src/bootstrap';
import '../../DS1/1-root/one.css';
import '../../DS1/1-root/grid.css';
import '../../website/src/vendor/aa/aa.css';
import './src/style.css';
import { ConsistencyEditor } from './src/index';
import { WorkspacePageEditor } from './src/workspace-page';
import { importWritingPage } from './src/workspace-migration';
import { workspaceSeed } from './src/workspace-seed';
import { render } from 'lit';
import { editorBrand } from './src/editor-brand';
import '../../DS1/3-unit/ds-sidebar';
import { compositionWorkspace } from './src/vendor/site-engine/composition-workspace';
import './src/vendor/site-engine/composition-workspace.css';
import '../../DS1/0-face/grid';
import './src/home';
import { ConsistencySiteEditor } from './src/site-editor';

const workspace=document.getElementById('consistency-workspace');
if(workspace) compositionWorkspace(workspace,{
  shell(navigation,bar,stage,controls){
    const page=document.createElement('ds-page');page.layout='sidebar';page.fill=true;page.className='consistency-editor-workspace';
    const nav=document.createElement('div');nav.slot='nav';nav.className='consistency-editor-nav';
    const brand=document.createElement('div');render(editorBrand,brand);
    nav.append(brand,bar,controls,navigation);page.append(nav,stage);workspace.replaceChildren(page);
  },
  create(draft){
    const source = draft ?? workspaceSeed() as unknown as Record<string, unknown>;
    const page = importWritingPage(source);
    if (page) { const element = new WorkspacePageEditor(); element.loadDocument(page); return {element,read:()=>element.readDocument(),flush:()=>element.flush(),destroy:()=>element.remove()}; }
    const element=new ConsistencyEditor();element.loadDocument(source);const controls=document.createElement('div');element.controlsHost=controls;return {element,controls,read:()=>element.readDocument(),flush:()=>element.flush(),destroy:()=>element.remove()};
  },
  // A site's words, edited on its real page and saved to the live site; its layout stays as published.
  openSite(site){const element=new ConsistencySiteEditor();element.site=site;element.picker=false;return {element,flush:()=>element.flush(),destroy:()=>element.remove()};},
});
