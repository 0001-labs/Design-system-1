import {expect,test} from 'vite-plus/test';
import {Window} from 'happy-dom';
import {importComponentPage} from './consistency-import';
import {renderNativePage,validateNativePage} from './consistency-native-page';
const source='<style>.cards{display:grid;gap:40px}</style><section class="cards" style="padding:20px"><h1>Keep <em>every</em> word &amp; mark.</h1><ds-card tone="sharp-blue"><span slot="title">A title</span><p>A body.</p></ds-card><svg viewBox="0 0 20 20"><path d="M0 0h20v20z"></path></svg></section>';
test('an imported page round trips content, DOM structure, slots and library styles through the common renderer',()=>{
 const window=new Window();window.document.body.innerHTML=source;
 const imported=importComponentPage(window.document.body as never,{namespace:'test'});
 const checked=validateNativePage(imported.document,{images:[],collections:[],runtimes:{},components:imported.components});
 const result=renderNativePage(checked,{components:imported.components});
 window.document.body.innerHTML=result;
 window.document.body.querySelectorAll('[data-native-block]').forEach(element=>element.removeAttribute('data-native-block'));
 expect(window.document.body.innerHTML).toBe(source);
});
test('component documents cannot introduce HTML, CSS, unknown presentations or executable attributes',()=>{
 const window=new Window();window.document.body.innerHTML='<p>Hello</p>';
 const imported=importComponentPage(window.document.body as never,{namespace:'test'}),context={images:[],collections:[],runtimes:{},components:imported.components};
 for(const patch of [{name:'unregistered'},{values:{onclick:'alert(1)'}},{values:{style:'display:none'}},{values:{href:'javascript:alert(1)'}}]){
  const candidate=structuredClone(imported.document);Object.assign(candidate.blocks[0],patch);expect(()=>validateNativePage(candidate,context)).toThrow();
 }
});

test('card geometry changes its shared inner surface instead of adding a second outer inset',()=>{
 const window=new Window();window.document.body.innerHTML='<ds-card><p>Keep the content</p></ds-card>';const imported=importComponentPage(window.document.body as never,{namespace:'card'});Object.assign(imported.document.blocks[0],{padding:60});const html=renderNativePage(imported.document,{components:imported.components});expect(html).toContain('--ds-card-padding-override:calc(60px');expect(html).not.toContain(';padding:');
});
