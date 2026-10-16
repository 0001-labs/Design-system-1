import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { LAYERS } from '../../shared/component-directory';
import { EXAMPLES, PAGE_EXAMPLES } from '../../website/src/lib/component-examples';
import { libraryTokenValues, setLibraryToken } from './lib/libraryTokens';
import componentTokens from '../../DS1/1-root/component-tokens.css?raw';
import componentMetrics from '../../DS1/1-root/component-metrics.css?raw';
import './system-workbench.css';

export type LibraryWorkbenchConfig = { schema: number; [key: string]: unknown };
export const libraryTemplate = `/* Design system 1 component library */\n${componentMetrics}\n${componentTokens.replace(/^@import[^;]+;\s*/gm, '')}`;
const sources = import.meta.glob<string>('../../DS1/{2-core,3-unit,4-page}/**/*.css', { query: '?raw', import: 'default', eager: true });
const properties = (text: string) => [...new Set([...text.matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g)].map(match => match[1]!))].sort();
const sharedTokens = properties(libraryTemplate);
const defaults = libraryTokenValues(libraryTemplate);
const aliases: Record<string, string> = { '--ds-accent-color': '--one-accent-color', '--ds-radius': '--one-radius', '--ds-text-color': '--one-text', '--ds-typeface-regular': '--one-font', '--ds-type-size-default': '--one-font-size' };

function Preview({ example, css }: { example: string; css: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const send = () => frame.current?.contentWindow?.postMessage({ type: 'ds1-example-styles', css }, location.origin);
  useEffect(send, [css]);
  return <iframe ref={frame} src={`/examples/${example}/`} title={EXAMPLES[example]!.title} onLoad={send} style={{ height: EXAMPLES[example]!.height ?? 200 }} />;
}

export function SystemWorkbench({ initialCss, initialConfig, onDirty, headerSlot }: {
  initialCss?: string;
  initialConfig?: LibraryWorkbenchConfig;
  onDirty?: (state: { css: string; config: LibraryWorkbenchConfig }) => void;
  headerSlot?: ReactNode;
}) {
  const [selected, setSelected] = useState('/2-core/button/');
  const [css, setCss] = useState(initialCss ?? libraryTemplate);
  const [search, setSearch] = useState('');
  const values = useMemo(() => libraryTokenValues(css), [css]);
  const config = useRef(initialConfig ?? { schema: 2 });
  const entry = LAYERS.flatMap(layer => layer.entries).find(item => item.href === selected)!;
  const examples = PAGE_EXAMPLES[selected.replace(/^\/|\/$/g, '')] ?? [];
  const tokens = useMemo(() => {
    const own = Object.entries(sources).filter(([path]) => entry.tag && path.includes(entry.tag)).map(([, source]) => source).join('\n');
    const used = [...own.matchAll(/var\((--ds-[a-zA-Z0-9_-]+)/g)].map(match => match[1]!);
    return [...new Set([...sharedTokens, ...used, ...properties(css)])].filter(name => !search || name.toLowerCase().includes(search.toLowerCase())).sort();
  }, [entry.tag, css, search]);
  const update = (value: string) => { setCss(value); onDirty?.({ css: value, config: config.current }); };
  const setToken = (name: string, value: string) => {
    // Preserve older native-element libraries while exposing the canonical component tokens.
    let next = setLibraryToken(css, name, value);
    const alias = aliases[name];
    if (alias && values.get(alias) !== undefined) next = setLibraryToken(next, alias, value);
    update(next);
  };
  return <div className="workbench system-workbench" data-testid="workbench">
    {headerSlot}
    <div className="system-workbench-panes">
      <aside className="library-panel">
        <h2 className="app-panel-label">Components</h2>
        <nav className="component-tree" aria-label="Component library">
          {LAYERS.map(layer => <div key={layer.number}>
            <h3 className="component-tree__group-label">{layer.number} {layer.name}</h3>
            {layer.entries.map(item => <button key={item.href} type="button" className={selected === item.href ? 'is-selected' : ''} aria-current={selected === item.href ? 'page' : undefined} onClick={() => setSelected(item.href)}>{item.name}<small>{item.tag}</small></button>)}
          </div>)}
        </nav>
      </aside>
      <main className="system-workbench-preview">
        <div className="app-panel-heading"><h1>{entry.name}</h1><a href={entry.href} target="_blank" rel="noreferrer">Documentation ↗</a></div>
        {examples.length ? examples.map(example => <section key={example}><h2>{EXAMPLES[example]!.title}</h2><Preview example={example} css={css} /></section>) : <p>This composition is described in the <a href={entry.href} target="_blank" rel="noreferrer">documentation</a>.</p>}
      </main>
      <aside className="system-workbench-tokens">
        <h2 className="app-panel-label">Tokens</h2>
        <input aria-label="Filter tokens" placeholder="Filter tokens" value={search} onChange={event => setSearch(event.target.value)} />
        {tokens.map(name => <label key={name}><span>{name}</span><input aria-label={name} placeholder={defaults.get(name) ?? 'Inherited'} value={values.get(name) ?? ''} onChange={event => setToken(name, event.target.value)} /></label>)}
      </aside>
    </div>
    <section aria-label="Live CSS file" className="css-file-panel">
      <div className="app-panel-heading"><h2>Stylesheet</h2><span>Editable CSS</span></div>
      <div className="css-editor-shell"><textarea aria-label="Editable CSS source" data-testid="live-css-source" spellCheck={false} value={css} onChange={event => update(event.target.value)} /></div>
    </section>
  </div>;
}
