import { useState } from 'react';
import codes from '../../../shared/component-codes.json';
import { Button } from '../../../DS1/react/button';
import '../../../DS1/1-root/controls.css';
import './component-adoption.css';

export function ComponentGlossary({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const [query, setQuery] = useState('');
  const matches = codes.filter(entry => `${entry.code} ${entry.label}`.toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => a.code.localeCompare(b.code));
  return <main className="adoption">
    <header className="adoption-heading">
      <div><p className="adoption-eyebrow"><a href="#adoption">Component adoption</a> · Private</p><h1>Component glossary</h1></div>
      <Button onClick={() => void onSignOut()}>Sign out</Button>
    </header>
    <div className="adoption-controls">
      <label>Find a code or component <input className="ds-input" type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
    </div>
    <p role="status">{matches.length} of {codes.length} codes</p>
    <table className="ds-table"><thead><tr><th scope="col">Code</th><th scope="col">Component</th></tr></thead>
      <tbody>{matches.map(entry => <tr key={entry.id}><td style={{ fontFamily: 'var(--ds-typeface-mono, var(--typeface-mono))' }}>{entry.code}</td><td><a href={entry.url}>{entry.label}</a></td></tr>)}</tbody>
    </table>
  </main>;
}
