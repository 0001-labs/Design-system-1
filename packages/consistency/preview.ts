import '../../DS1/1-root/prose.css';
import './src/bootstrap';
import '../../DS1/1-root/one.css';
import '../../DS1/1-root/grid.css';
import '../../website/src/vendor/aa/aa.css';
import './src/style.css';
import { ConsistencyEditor } from './src/index';
import '../../DS1/3-unit/ds-sidebar';
import { compositionWorkspace } from './src/vendor/cms/composition-workspace';
import './src/vendor/cms/composition-workspace.css';
import '../../DS1/0-face/grid';
import './src/home';

const workspace=document.getElementById('consistency-workspace');
if(workspace) compositionWorkspace(workspace,{create(document){const element=new ConsistencyEditor();if(document)element.loadDocument(document);return {element,read:()=>element.readDocument()};}});
