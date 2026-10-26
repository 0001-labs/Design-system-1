import '../../DS1/1-root/prose.css';
import './src/bootstrap';
import '../../DS1/1-root/one.css';
import '../../DS1/1-root/grid.css';
import '../../website/src/vendor/aa/aa.css';
import './src/style.css';
import { ConsistencyEditor } from './src/index';
import '../../DS1/3-unit/ds-sidebar';
import { compositionWorkspace } from './src/vendor/site-engine/composition-workspace';
import './src/vendor/site-engine/composition-workspace.css';
import '../../DS1/0-face/grid';
import './src/home';
import { ConsistencySiteEditor } from './src/site-editor';

const workspace=document.getElementById('consistency-workspace');
if(workspace) compositionWorkspace(workspace,{
  create(document){const element=new ConsistencyEditor();if(document)element.loadDocument(document);return {element,read:()=>element.readDocument()};},
  // A site's words, edited on its real page and saved to the live site; its layout stays as published.
  openSite(site){const element=new ConsistencySiteEditor();element.site=site;return {element,flush:()=>element.flush(),destroy:()=>element.remove()};},
});
