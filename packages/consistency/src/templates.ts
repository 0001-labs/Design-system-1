import snapshots from '../generated/templates.json';
import { initialComposition } from './model';
export interface SiteTemplate { id: string; label: string; description: string; href: string; html: string; library: string; components: Record<string, Record<string, unknown>> }
export const SITE_TEMPLATES = Object.values(snapshots) as SiteTemplate[];
export const siteTemplate = (id: string) => SITE_TEMPLATES.find(template => template.id === id);
/** Only bounded editor data is saved; HTML, scripts and styles always come from the trusted catalogue. */
export function templateDocument(id: string): Record<string, unknown> {
  if (!siteTemplate(id)) throw new Error('Choose a template.');
  return { schema: 1, example: id, library: 'original', fonts: {}, composition: { ...structuredClone(initialComposition), text: '', sections: { __authored: '1' }, order: ['intro'], gaps: {}, hidden: [], sizes: {}, cardDesigns: {}, cardGaps: {}, buttonDesigns: {}, statDesigns: {} } };
}
