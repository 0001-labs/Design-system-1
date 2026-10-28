import type { NativeBlock, NativeContent } from '../../../shared/consistency-native-page';
import { validateWorkspacePage, type WorkspacePage } from '../../../shared/consistency-workspace-page';
import type { Composition } from './model';

/** Import writing-only lab drafts once. Authored templates and the studio need dedicated importers:
 * their component properties and source placement graph must not disappear in a text conversion. */
export function importWritingPage(value: Record<string, unknown>): WorkspacePage | null {
  if (value.schema === 2) return validateWorkspacePage(value);
  const c = value.composition as Composition | undefined;
  if (value.schema !== 1 || !c || value.example === 'studio' || c.sections.__authored === '1' || value.example === 'booking') return null;
  if (!c.wrap || [c.text,...Object.values(c.sections)].some(source => /(?:^|\n)```diagram(?:\s|$)/.test(source))) return null;
  if (c.order.length > 10 || !c.order.length || new Set(c.order).size !== c.order.length) return null;
  if (c.linkedCardDesign || c.pageTone || ['sizes','cardDesigns','cardGaps','buttonDesigns','statDesigns'].some(key => Object.keys(c[key as keyof Composition] as object ?? {}).length)) return null;
  const used = new Set<string>();
  const content: NativeContent[] = c.order.map(id => {
    const gaps = Object.fromEntries(Object.entries(c.gaps).filter(([key]) => key.startsWith(`${id}-text-`) || key.startsWith(`${id}-nested-`) || key.startsWith(`columns:${id}:`)));
    Object.keys(gaps).forEach(key => used.add(key));
    return {id,kind:'content',source:id === 'intro' ? c.text : c.sections[id] ?? '',...(Object.keys(gaps).length ? {gaps} : {}),...(c.hidden.includes(id) || c.hidden.includes(`group-${id}`) ? {hidden:true} : {})};
  });
  let blocks: NativeBlock[] = [{id:'trailing_space',kind:'flow',direction:'column',gap:0,padding:0,children:[]}];
  for (let index = content.length - 1; index >= 0; index--) {
    const key = `section-${content[index].id}`; used.add(key);
    blocks = [{id:`sequence_${index}`,kind:'flow',direction:'column',gap:c.gaps[key] ?? 20,padding:0,children:[content[index],...blocks]}];
  }
  // Unaccounted overrides stay on the legacy document until their importer covers them.
  if (Object.keys(c.gaps).some(key => !used.has(key))) return null;
  if (Object.keys(c.sections).some(key => !c.order.includes(key) && c.sections[key])) return null;
  if (c.hidden.some(id => !c.order.includes(id.replace(/^group-/,'')))) return null;
  try {
    return validateWorkspacePage({schema:2,kind:'page',example:value.example,library:value.library,fonts:value.fonts ?? {},page:{schema:1,kind:'native-page',layout:{maxWidth:c.width,padding:c.padding,gap:0},blocks}});
  } catch { return null; }
}
