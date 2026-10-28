import nativeTemplates from '../../../shared/consistency-template-pages.json';
import type {ImportedPage} from '../../../shared/consistency-import';
export interface SiteTemplate extends ImportedPage {id:string;label:string;description:string;href:string;library:string}
export const templatePage=(id:string)=>(nativeTemplates as unknown as Record<string,SiteTemplate>)[id];
export const SITE_TEMPLATES=Object.values(nativeTemplates).filter(value=>'id'in value) as unknown as SiteTemplate[];
export const siteTemplate=(id:string)=>SITE_TEMPLATES.find(template=>template.id===id);
export function templateDocument(id:string):Record<string,unknown>{
 if(!siteTemplate(id))throw Error('Choose a template.');
 if(id==='blank')return{schema:2,kind:'page',example:id,library:'original',fonts:{},page:{schema:1,kind:'native-page',layout:{maxWidth:800,padding:40,gap:20},blocks:[{id:'intro',kind:'content',source:'# Your site\n\nStart writing.'}]}};
 return{schema:2,kind:'page',example:id,library:'original',fonts:{},page:structuredClone(templatePage(id).document)};
}
