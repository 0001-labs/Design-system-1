import { useState } from 'react';
import codes from '../../../shared/component-codes.json';
import { ALL_LAYERS } from '../../../shared/component-directory';
import '../../../DS1/3-unit/ds-tabs';
import { Button } from '../../../DS1/react/button';
import '../../../DS1/1-root/controls.css';
import './component-adoption.css';

export function ComponentGlossary({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const [query, setQuery] = useState('');
  const [layer, setLayer] = useState(ALL_LAYERS[0].number);
  const selected = ALL_LAYERS.find(entry => entry.number === layer)!;
  const layerCodes = codes.filter(code => selected.entries.some(entry => code.url === `https://designsystem1.com${entry.href}`));
  const matches = layerCodes.filter(entry => `${entry.code} ${entry.label}`.toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => a.code.localeCompare(b.code));
  return <main className="adoption">
    <header className="adoption-heading">
      <div><p className="adoption-eyebrow"><a href="#adoption">Component adoption</a> · Private</p><h1>Component glossary</h1></div>
      <Button onClick={() => void onSignOut()}>Sign out</Button>
    </header>
    <ds-tabs aria-label="Component layers">
      {ALL_LAYERS.map(entry => <Button key={entry.number} id={`glossary-layer-${entry.number}`} role="tab" active={layer === entry.number} aria-selected={layer === entry.number} aria-controls="glossary-layer-panel" tabIndex={layer === entry.number ? 0 : -1} onClick={() => setLayer(entry.number)}>{entry.name}</Button>)}
    </ds-tabs>
    <section id="glossary-layer-panel" role="tabpanel" aria-labelledby={`glossary-layer-${layer}`} tabIndex={0}>
    <div className="adoption-controls">
      <label>Find a code or component <input className="ds-input" type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
    </div>
    <p role="status">{matches.length} of {layerCodes.length} {selected.name} codes</p>
    <table className="ds-table"><thead><tr><th scope="col">Code</th><th scope="col">Component</th></tr></thead>
      <tbody>{matches.map(entry => <tr key={entry.id}><td style={{ fontFamily: 'var(--ds-typeface-mono, var(--typeface-mono))' }}>{entry.code}</td><td><a href={entry.url}>{entry.label}</a></td></tr>)}</tbody>
    </table>
    </section>
  </main>;
}
