import type { WorkspacePage } from '../../../shared/consistency-workspace-page';
/** The lab starts with the same blocks and controls that published pages use. */
export function workspaceSeed(): WorkspacePage {
  return {schema:2,kind:'page',example:'editor',library:'original',fonts:{},page:{schema:1,kind:'native-page',layout:{maxWidth:800,padding:40,gap:20},blocks:[
    {id:'sequence_0',kind:'flow',direction:'column',padding:0,gap:20,children:[
      {id:'intro',kind:'content',source:'# Make the page your own.\n\nWrite and arrange directly on the page. These are the same blocks and editing controls used by published Consistency sites.\n\nClick this sentence and try a few words. Select text to format it, or type / on a new line to add content.'},
      {id:'cards',kind:'cards',columns:2,height:12,items:[{label:'Try editing me',title:'Words stay yours.',text:'Edit this card’s title or body directly on the page.'},{label:'Try the space between us',title:'One page model.',text:'Drag a spacing handle to increase or decrease a gap. The page saves that measure with its blocks.'}]},
      {id:'writing',kind:'content',source:'## Give each piece its place.\n\nDrag a block to move it. Use its edges to resize it. Right-click for the block’s design and layout options. Undo with Command Z on Mac or Control Z on Windows.\n\n| Try this | What it does |\n| --- | --- |\n| Spacing handle | Adjust the gap between blocks |\n| Block edge | Resize a supported block |\n| Page context menu | Add a shared section |\n| New page | Create another private draft |'},
    ]},
  ]}};
}
