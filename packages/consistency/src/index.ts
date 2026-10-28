import {LitElement,html,render} from 'lit';
import {WorkspacePageEditor} from './workspace-page';
import {migrateWorkspacePage,studioSeed} from '../../../shared/consistency-workspace-migration';
import {workspaceSeed} from './workspace-seed';
import {SITE_TEMPLATES,templateDocument} from './templates';
import {LIBRARY_PRESETS} from './libraries';
import {GOOGLE_FONT_FAMILIES,isGoogleFont} from './fonts';
import type {WorkspacePage} from '../../../shared/consistency-workspace-page';
import '../../../DS1/3-unit/ds-select';
import '../../../DS1/2-core/ds-device-bezel';
/** The lab owns navigation and presentation choices. Every page is edited by the shared host. */
export class ConsistencyEditor extends LitElement {
 static properties={example:{state:true},mobile:{state:true},problem:{state:true}};
 controlsHost?:HTMLElement;siteMode=false;
 private example='editor';private mobile=false;private problem='';
 private value:WorkspacePage=workspaceSeed();private editor?:WorkspacePageEditor;
 private drafts=new Map<string,WorkspacePage>();
 createRenderRoot(){return this;}
 loadDocument(value:unknown){if(this.isConnected)throw Error('Load a page before mounting.');this.value=migrateWorkspacePage(value);this.example=this.value.example;}
 readDocument():Record<string,unknown>{return this.editor?.readDocument()??this.value as unknown as Record<string,unknown>;}
 async flush(){return await this.editor?.flush()??true;}
 connectedCallback(){super.connectedCallback();this.open(this.value);}
 private open(value:WorkspacePage){this.value=value;const editor=new WorkspacePageEditor();editor.loadDocument(value);this.editor=editor;this.requestUpdate();}
 private async choose(id:string){if(!await this.flush())return;this.drafts.set(this.example,migrateWorkspacePage(this.readDocument()));this.example=id;this.open(this.drafts.get(id)??(id==='editor'?workspaceSeed():id==='studio'?studioSeed():migrateWorkspacePage(templateDocument(id))));this.dispatchEvent(new CustomEvent('consistency-change',{bubbles:true}));}
 private async presentation(key:'library'|'heading'|'text',value:string){if(!await this.flush())return;const page=migrateWorkspacePage(this.readDocument());if(key==='library')page.library=value;else{delete page.fonts[key];if(isGoogleFont(value))page.fonts[key]=value;}this.open(page);this.dispatchEvent(new CustomEvent('consistency-change',{bubbles:true}));}
 private controls(){return html`<div class="consistency-inspector"><label class="consistency-select-label">Example page<ds-select><select aria-label="Example page" .value=${this.example} @change=${(e:Event)=>void this.choose((e.target as HTMLSelectElement).value)}>${[{id:'editor',label:'Consistency editor'},{id:'studio',label:'Studio'},...SITE_TEMPLATES].map(item=>html`<option value=${item.id}>${item.label}</option>`)}</select></ds-select></label><ds-button @click=${()=>this.mobile=!this.mobile}>${this.mobile?'Desktop preview':'Mobile preview'}</ds-button><label class="consistency-select-label">Library preset<ds-select><select aria-label="Library preset" .value=${this.value.library} @change=${(e:Event)=>void this.presentation('library',(e.target as HTMLSelectElement).value)}>${LIBRARY_PRESETS.map(item=>html`<option value=${item.id}>${item.label}</option>`)}</select></ds-select></label>${(['heading','text']as const).map(role=>html`<label class="consistency-select-label">${role==='heading'?'Heading face':'Text face'}<ds-select><select aria-label=${role==='heading'?'Heading face':'Text face'} .value=${this.value.fonts[role]??''} @change=${(e:Event)=>void this.presentation(role,(e.target as HTMLSelectElement).value)}><option value="">The library’s own</option>${GOOGLE_FONT_FAMILIES.map(family=>html`<option value=${family}>${family}</option>`)}</select></ds-select></label>`)}${this.problem?html`<ds-text role="alert" literal tone="danger" .text=${this.problem}></ds-text>`:''}</div>`;}
 protected updated(){if(this.controlsHost)render(this.controls(),this.controlsHost);}
 render(){return html`<div class="consistency-shared-lab">${!this.controlsHost&&!this.siteMode?this.controls():''}<ds-device-bezel class="consistency-shared-device" .frameless=${!this.mobile} responsive asset-base="/examples/visual-kit/" browser="safari" address="preview.example" time="00:01"><div class="consistency-shared-canvas">${this.editor}</div></ds-device-bezel></div>`;}
}
customElements.define('consistency-editor',ConsistencyEditor);
