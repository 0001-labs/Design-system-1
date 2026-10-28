import {expect,test} from 'vite-plus/test';
import {Window} from 'happy-dom';
import {importComponentPage} from './consistency-import';
import {importEarlierLayout} from './consistency-layout-import';
import {validateNativePage,renderNativePage} from './consistency-native-page';
test('placement migration retains unmanaged styles, reorders source blocks and places new writing exactly once',()=>{
 const window=new Window();window.document.body.innerHTML='<style data-template-node="style">p{color:red}</style><section data-template-node="section"><p data-template-node="a">Alpha</p> <p data-template-node="b">Beta</p></section>';
 const source=importComponentPage(window.document.body as never,{namespace:'test'});
 const result=importEarlierLayout(source.document,source.sourceIds,{schema:1,nodes:{b:{padding:60,hidden:true}},order:{section:['b','new','a']},insertions:[{id:'new',parent:'section',before:'a',kind:'region',source:'New **writing**'}]});
 const checked=validateNativePage(result,{components:source.components,images:[],collections:[],runtimes:{}});
 const output=renderNativePage(checked,{components:source.components});
 expect(output.indexOf('Beta')).toBeLessThan(output.indexOf('New'));expect(output.indexOf('New')).toBeLessThan(output.indexOf('Alpha'));
 expect(output.match(/New /g)).toHaveLength(1);expect(output).toContain('p{color:red}');expect(output).toContain('padding:calc(60px * var(--sf,1))!important');expect(output).toContain(' hidden=');
});
test('group and column imports use the canonical component tree, retaining every source child',()=>{
 const window=new Window();window.document.body.innerHTML='<p data-template-node="a">Alpha</p><p data-template-node="b">Beta</p>';
 const source=importComponentPage(window.document.body as never,{namespace:'test'});
 const result=importEarlierLayout(source.document,source.sourceIds,{schema:1,nodes:{},groups:[{id:'row',kind:'columns'},{id:'left',kind:'column'},{id:'right',kind:'column'}],order:{root:['row'],row:['left','right'],left:['a'],right:['b']}});
 const checked=validateNativePage(result,{components:source.components,images:[],collections:[],runtimes:{}});
 expect(checked.blocks).toHaveLength(1);expect(renderNativePage(checked,{components:source.components})).toContain('Alpha');expect(renderNativePage(checked,{components:source.components})).toContain('Beta');
});
