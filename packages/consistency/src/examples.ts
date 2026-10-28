import {SITE_TEMPLATES,templateDocument} from './templates';
import {studioSeed} from '../../../shared/consistency-workspace-migration';
import {workspaceSeed} from './workspace-seed';
export const DEFAULT_EXAMPLE='editor';
export const EXAMPLE_PAGES=[{id:'editor',label:'Consistency editor'},{id:'studio',label:'Studio'},...SITE_TEMPLATES.map(({id,label})=>({id,label}))];
export const exampleDocument=(id:string)=>id==='studio'?studioSeed():SITE_TEMPLATES.some(template=>template.id===id)?templateDocument(id):workspaceSeed();
