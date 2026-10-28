/** Stable text slots of a registered DS1 component. The public client and editor use the same keys. */
export function componentWords(element: HTMLElement, visit: (text: Text,key: string)=>void) {
  const walk=(root:ShadowRoot,prefix:string)=>{
    const walker=root.ownerDocument.createTreeWalker(root,NodeFilter.SHOW_TEXT),texts:Text[]=[];
    while(walker.nextNode()){const text=walker.currentNode as Text;if(text.textContent?.trim()&&!text.parentElement?.closest('style,script,svg,option,textarea,[contenteditable],.aa-plain'))texts.push(text);}
    const nested=[...root.querySelectorAll<HTMLElement>('*')].map((child,index)=>({child,index:index+2*texts.filter(text=>Boolean(text.compareDocumentPosition(child)&4)).length}));
    texts.forEach((text,index)=>visit(text,`${prefix}:${index}`));
    nested.forEach(({child,index})=>{if(child.shadowRoot)walk(child.shadowRoot,child.dataset.templateNode??`${prefix}-${index}`);});
  };
  if(element.shadowRoot)walk(element.shadowRoot,element.dataset.templateNode??element.dataset.nativeBlock!);
}
