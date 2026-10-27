import { DOC_EXAMPLES } from '../../../shared/doc-examples';
import { LAYOUT_EXAMPLES } from '../../../website/src/lib/layout-examples';
import { HTML_EXAMPLES } from '../../../website/src/lib/html-examples';

/** One catalogue drives documentation, the picker and editable template documents. */
export const SITE_TEMPLATES = [
  { id: 'blank', label: 'Blank site', description: 'Start with an empty page.', href: '', html: '<ds-page layout="column"><article data-ds-prose><h1>Your site</h1><p>Start writing.</p></article></ds-page>', script: '', library: undefined },
  ...DOC_EXAMPLES.map(entry => {
    const layout = LAYOUT_EXAMPLES[entry.id];
    const file = HTML_EXAMPLES.find(sample => `html-${sample.id}` === entry.id);
    if (!layout && !file) throw new Error(`Missing editable DS1 example: ${entry.id}`);
    return { id: entry.id, label: entry.label, description: layout?.use ?? file!.description, href: entry.href,
      html: layout?.html ?? file!.body, script: layout?.script ?? (file && 'script' in file ? file.script : ''), library: layout?.library };
  }),
];
export const siteTemplate = (id: string) => SITE_TEMPLATES.find(template => template.id === id);
