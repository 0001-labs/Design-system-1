import type { NativeBlock, NativePageDocument } from '../../../shared/consistency-native-page';
export interface NativeEntry { block: NativeBlock; parent: string; index: number }
export function nativeEntries(document: NativePageDocument): Map<string, NativeEntry> {
  const entries = new Map<string, NativeEntry>();
  const visit = (blocks: NativeBlock[], parent: string) => blocks.forEach((block,index) => { entries.set(block.id,{block,parent,index}); if ('children' in block) visit(block.children,block.id); });
  visit(document.blocks,'page'); return entries;
}
export function updateNativeBlock(document: NativePageDocument, id: string, update: (block: NativeBlock) => NativeBlock): NativePageDocument {
  const visit = (blocks: NativeBlock[]): NativeBlock[] => blocks.map(block => block.id === id ? update(block) : 'children' in block ? {...block,children:visit(block.children)} : block);
  return {...document,blocks:visit(document.blocks)};
}
export function updateNativeChildren(document: NativePageDocument, id: string, update: (children: NativeBlock[]) => NativeBlock[]): NativePageDocument {
  if (id === 'page') return {...document,blocks:update(document.blocks)};
  return updateNativeBlock(document,id,block => 'children' in block ? {...block,children:update(block.children)} : block);
}
export interface SpaceBox {left:number;top:number;width:number;height:number}
interface Box extends SpaceBox {right:number;bottom:number}
/** Track rows from rendered native grid items. Only intersecting tracks form a gutter. */
export function nativeGridSpaces(boxes: readonly Box[]): Array<{axis:'horizontal'|'vertical';box:SpaceBox}> {
  const rows: Box[][] = [];
  for (const box of [...boxes].filter(box=>box.width>0&&box.height>0).sort((a,b)=>a.top-b.top||a.left-b.left)) {
    const row=rows.find(row=>Math.abs(row[0].top-box.top)<1); if(row)row.push(box);else rows.push([box]);
  }
  const spaces:Array<{axis:'horizontal'|'vertical';box:SpaceBox}>=[];
  for(const row of rows){row.sort((a,b)=>a.left-b.left);for(let index=1;index<row.length;index++){
    const a=row[index-1],b=row[index],top=Math.max(a.top,b.top),bottom=Math.min(a.bottom,b.bottom),width=b.left-a.right;
    if(width>=0&&bottom>top)spaces.push({axis:'horizontal',box:{left:a.right,top,width,height:bottom-top}});
  }}
  for(let index=1;index<rows.length;index++){
    const before=rows[index-1],after=rows[index],top=Math.max(...before.map(box=>box.bottom)),bottom=Math.min(...after.map(box=>box.top));
    const left=Math.max(Math.min(...before.map(box=>box.left)),Math.min(...after.map(box=>box.left))),right=Math.min(Math.max(...before.map(box=>box.right)),Math.max(...after.map(box=>box.right)));
    if(bottom>=top&&right>left)spaces.push({axis:'vertical',box:{left,top,width:right-left,height:bottom-top}});
  }
  return spaces;
}
