/** Pure context presentation shared by the real-site canvas and public renderer. */
export interface SiteSurfaceDesign {
  tone?: string; variant?: 'filled' | 'outlined'; color?: string;
  appearance?: 'plain' | 'primary' | 'secondary';
  action?: { kind: 'link' | 'page'; target: string };
  gaps?: Record<string, number>;
}
export interface SiteDesignPatch {
  attributes: Record<string, string | null>;
  classes: Record<string, boolean>;
  /** All declarations use important priority; consumers restore authored values before applying. */
  styles: Record<string, string>;
}
export const SITE_SURFACE_ATTRIBUTES = ['tone','data-tone','variant','primary','secondary','href'] as const;
export const SITE_SURFACE_CLASSES = ['ds-card--outlined','ds-button--primary','ds-button--secondary'] as const;
export const SITE_SURFACE_STYLES = ['--ds-text-color','--ds-text-color-muted','--ds-card-label-gap','--ds-card-title-gap','--ds-card-footer-gap','--ds-stat-label-gap','--ds-stat-figure-gap'] as const;
export const SITE_PAGE_STYLES = ['background-color','--ds-text-color','--ds-text-color-muted','color-scheme'] as const;
// Canonical token fallbacks keep contexts usable on client pages without global DS1 CSS.
const PASTELS: Record<string,string> = {
  'sharp-blue':'light-dark(#ccccff, #1d1a4c)', 'apple-green':'light-dark(#daffcc, #284c1a)',
  pink:'light-dark(#fad1e6, #471f34)', orange:'light-dark(#fff2cc, #4c3f1a)',
  yellow:'light-dark(#fbffcc, #484c1a)', purple:'light-dark(#f9d2ed, #46203a)',
};
const COLORS: Record<string,string> = { 'sharp-blue':'#594dff','apple-green':'#99ff73',pink:'#f5aad1',orange:'#fec20d',yellow:'#eaff00',purple:'#e63aaf' };
const black='var(--ds-black, #2a2a2a)',white='var(--ds-white, #ffffff)';
const empty=():SiteDesignPatch=>({attributes:{},classes:{},styles:{}});

export function siteSurfacePatch(kind:string,tag:string,design:SiteSurfaceDesign):SiteDesignPatch {
  const patch=empty();
  if(kind==='card'){
    if(design.tone!==undefined)patch.attributes[tag==='ds-card'?'tone':'data-tone']=design.tone;
    if(design.variant!==undefined){if(tag==='ds-card')patch.attributes.variant=design.variant;else patch.classes['ds-card--outlined']=design.variant==='outlined';}
  }
  if(kind==='button'){
    if(design.appearance!==undefined)for(const appearance of ['primary','secondary']){
      patch.attributes[appearance]=design.appearance===appearance?'':null;
      patch.classes[`ds-button--${appearance}`]=design.appearance===appearance;
    }
    if(design.action)patch.attributes.href=design.action.target;
  }
  if(kind==='stat'&&design.color){
    const accent=`var(--ds-${design.color}, ${COLORS[design.color] ?? COLORS['sharp-blue']})`;
    const color=design.color==='ink'?`light-dark(${black}, ${white})`:`light-dark(color-mix(in srgb, ${accent} 50%, ${black}), color-mix(in srgb, ${accent} 50%, ${white}))`;
    patch.styles['--ds-text-color']=color;patch.styles['--ds-text-color-muted']=color;
  }
  for(const [key,value] of Object.entries(design.gaps ?? {}))patch.styles[`--ds-${kind}-${key}-gap`]=`calc(${value}px * var(--sf, 1))`;
  return patch;
}

export function sitePagePatch(tone:string):SiteDesignPatch {
  const patch=empty();if(!tone)return patch;
  patch.styles['background-color']=tone==='ink'?black:`var(--one-${tone}-pastel, ${PASTELS[tone] ?? PASTELS['sharp-blue']})`;
  patch.styles['--ds-text-color']=tone==='ink'?white:black;
  patch.styles['--ds-text-color-muted']=tone==='ink'?'var(--ds-slate-light, #e6e6e6)':'var(--ds-grey, #797979)';
  patch.styles['color-scheme']=tone==='ink'?'dark':'light';
  return patch;
}
