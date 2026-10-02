/** Isolate inline SVG IDs without changing its path geometry or source file. */
export function scopedSvg(source: string, prefix: string): string {
  const ids = new Map<string,string>();
  const safe = prefix.replace(/[^a-zA-Z0-9_-]/g,'');
  let count = 0;
  let result = source.replace(/\bid="([^"]+)"/g,(_all,id)=>{
    if(!ids.has(id))ids.set(id,`${safe}-${count++}`);
    return `id="${ids.get(id)}"`;
  });
  result = result.replace(/url\((['"]?)#([^)'"]+)\1\)/g,(all,_quote,id)=>ids.has(id)?`url(#${ids.get(id)})`:all);
  return result;
}
