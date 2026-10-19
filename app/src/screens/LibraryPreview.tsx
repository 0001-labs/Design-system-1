import { useMemo, type CSSProperties } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { libraryTemplate } from '../lib/libraryTemplate';
import { previewColours } from '../lib/libraryPreview';

export function LibraryPreview({ id }: { id?: Id<'libraries'> }) {
  const library = useQuery(api.libraries.get, id ? { id } : 'skip');
  const css = id ? library?.draftCss : libraryTemplate;
  const style = useMemo(() => {
    if (!css) return {};
    return Object.fromEntries(Object.entries(previewColours(css, libraryTemplate))
      .filter(([, value]) => CSS.supports('color', value))
      .map(([role, value]) => [`--preview-${role}`, value])) as CSSProperties;
  }, [css]);
  return <div className="library-specimen" style={style} aria-hidden="true" data-loading={id && !library || undefined}>
    <div className="library-specimen__page">
      <div className="library-specimen__heading"><span>Aa</span><span className="library-specimen__mark" /></div>
      <span className="library-specimen__line" />
      <span className="library-specimen__line library-specimen__line--short" />
      <span className="library-specimen__button">Button <span>→</span></span>
    </div>
    <div className="library-specimen__palette">
      {['accent', 'paper', 'ink', 'surface'].map(role => <span key={role} style={{background: `var(--preview-${role})`}} />)}
    </div>
  </div>;
}
