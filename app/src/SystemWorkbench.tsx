import { Button as ModeButton } from '../../DS1/react/button';
import '../../DS1/2-core/ds-button';
import { BoxModel, type BoxRegion, type BoxModelConfig } from './BoxModel';
import { defaultButtonBox, writeButtonBox, type ButtonBox } from './lib/buttonBoxModel';
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

type ButtonMetrics = { box: ButtonBox; contentSize: { width: number; height: number } };
function Preview({ example, css, hoverRegion, onMetrics }: { example: string; css: string; hoverRegion: BoxRegion | null; onMetrics?: (metrics: ButtonMetrics) => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const requestId = useRef(0);
  const latest = useRef(onMetrics); latest.current = onMetrics;
  const send = () => frame.current?.contentWindow?.postMessage({ type: 'ds1-example-styles', css, hoverRegion, requestId: ++requestId.current }, location.origin);
  useEffect(send, [css, hoverRegion]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow || event.data?.type !== 'ds1-example-button-metrics' || event.data.requestId !== requestId.current) return;
      const { box, contentSize } = event.data;
      if (!box || !contentSize || !Object.values({ ...box, ...contentSize }).every(value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100000)) return;
      latest.current?.({ box, contentSize });
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, []);
  return <iframe ref={frame} src={`/examples/${example}/`} title={EXAMPLES[example]!.title} onLoad={send} style={{ height: EXAMPLES[example]!.height ?? 200 }} />;
}

export function SystemWorkbench({ initialCss, initialConfig, onDirty, headerSlot }: {
  initialCss?: string;
  initialConfig?: LibraryWorkbenchConfig;
  onDirty?: (state: { css: string; config: LibraryWorkbenchConfig }) => void;
  headerSlot?: ReactNode;
}) {
  const [selected, setSelected] = useState('/2-core/button/');
  const [buttonMode, setButtonMode] = useState<'single' | 'split'>('single');
  const [css, setCss] = useState(initialCss ?? libraryTemplate);
  const [search, setSearch] = useState('');
  const [buttonMetrics, setButtonMetrics] = useState<ButtonMetrics>({ box: defaultButtonBox, contentSize: { width: 0, height: 0 } });
  const [boxPreview, setBoxPreview] = useState<Partial<ButtonBox> | null>(null);
  const [hoverRegion, setHoverRegion] = useState<BoxRegion | null>(null);
  const values = useMemo(() => libraryTokenValues(css), [css]);
  const config = useRef(initialConfig ?? { schema: 2 });
  const entry = LAYERS.flatMap(layer => layer.entries).find(item => item.href === selected)!;
  const examples = (PAGE_EXAMPLES[selected.replace(/^\/|\/$/g, '')] ?? []).filter(example => entry.tag !== 'ds-button' || (buttonMode === 'split' ? example === 'split' : example !== 'split'));
  const tokens = useMemo(() => {
    const own = Object.entries(sources).filter(([path]) => entry.tag && path.includes(entry.tag)).map(([, source]) => source).join('\n');
    const used = [...own.matchAll(/var\((--ds-[a-zA-Z0-9_-]+)/g)].map(match => match[1]!);
    return [...new Set([...sharedTokens, ...used, ...properties(css)])].filter(name => !search || name.toLowerCase().includes(search.toLowerCase())).sort();
  }, [entry.tag, css, search]);
  const update = (value: string) => { setBoxPreview(null); setCss(value); onDirty?.({ css: value, config: config.current }); };
  const setToken = (name: string, value: string) => {
    // Preserve older native-element libraries while exposing the canonical component tokens.
    let next = setLibraryToken(css, name, value);
    const alias = aliases[name];
    if (alias && values.get(alias) !== undefined) next = setLibraryToken(next, alias, value);
    update(next);
  };
  const buttonSelected = entry.tag === 'ds-button';
  const shownBox = { ...buttonMetrics.box, ...boxPreview };
  const previewCss = boxPreview ? writeButtonBox(css, shownBox, buttonMode) : css;
  const commitBox = (patch: Partial<BoxModelConfig> & { gap?: number }) => update(writeButtonBox(css, { ...shownBox, ...patch }, buttonMode));
  return <div className="workbench system-workbench" data-testid="workbench">
    {headerSlot}
    <div className="system-workbench-panes">
      <aside className="library-panel system-library-panel">
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
        {examples.length ? examples.map((example, index) => <section key={example}><h2>{EXAMPLES[example]!.title}</h2><Preview example={example} css={previewCss} hoverRegion={buttonSelected ? hoverRegion : null} onMetrics={buttonSelected && index === 0 ? metrics => setButtonMetrics(previous => JSON.stringify(previous) === JSON.stringify(metrics) ? previous : metrics) : undefined} /></section>) : <p>This composition is described in the <a href={entry.href} target="_blank" rel="noreferrer">documentation</a>.</p>}
      </main>
      <aside className="system-workbench-tokens">
        {buttonSelected && <div className="library-button-mode"><ModeButton split label="Button mode" value={buttonMode} onPress={mode => { setButtonMode(mode); setBoxPreview(null); }} segments={[{ value: 'single', label: 'Single' }, { value: 'split', label: 'Split' }]} /></div>}
        {buttonSelected && <section className="controls-section controls-section--box-model library-button-properties" aria-label="Button properties">
          <h2 onMouseEnter={() => setHoverRegion('all')} onMouseLeave={() => setHoverRegion(null)}>Box model</h2>
          <BoxModel config={shownBox} contentSize={buttonMetrics.contentSize} hoverRegion={hoverRegion} onChange={commitBox} onPreview={patch => setBoxPreview(patch)} onHoverRegion={setHoverRegion} supportsSpacing />
          <label className="library-button-gap">Content gap <input aria-label="Content gap px" type="number" min="0" max="48" step="4" value={shownBox.gap} onChange={event => commitBox({ gap: Math.min(48, Math.max(0, Number(event.target.value))) })} /></label>
        </section>}
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
