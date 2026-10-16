import { useAuthActions, useAuthToken } from '@convex-dev/auth/react';
import { useConvexAuth } from 'convex/react';
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import '../../../DS1/2-core/ds-button';
import '../../../DS1/3-unit/ds-sidebar';
import '../../../DS1/4-page/ds-page';
import type { Sidebar, SidebarItem } from '../../../DS1/3-unit/ds-sidebar';
import { Button } from '../../../DS1/react/button';
import { Page } from '../../../DS1/react/page';
import '../../../DS1/1-root/controls.css';
import { SignIn } from './SignIn';
import './font-workspace.css';

type FontEntry = { id: string; name: string; detail: string; available: boolean; fileName?: string };
const sizes = [20, 40, 60, 80, 100, 120];
const alphabets = ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz', '0123456789', '.,:;!?—–“”‘’()[]{}@&', 'ÅÆØåæø'];
function Control({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return <Button secondary {...props}>{children}</Button>;
}

export function FontWorkspace() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  useEffect(() => {
    document.title = 'Fonts · Design system 1';
  }, []);
  if (isLoading) return <main className="fonts-status" role="status">Opening your fonts…</main>;
  if (!isAuthenticated) return <div className="app-shell fonts-sign-in"><SignIn fontsOnly redirectTo="/fonts" /></div>;
  return <PrivateFonts />;
}

function PrivateFonts() {
  const token = useAuthToken();
  const { signOut } = useAuthActions();
  const [fonts, setFonts] = useState<FontEntry[] | null>(null);
  const [selected, setSelected] = useState('supernatural');
  const [mode, setMode] = useState<'specimen' | 'glyphs'>('specimen');
  const [text, setText] = useState('a little of the natural.\nevery letter a little different.');
  const [size, setSize] = useState(40);
  const [spacing, setSpacing] = useState(0);
  const [dark, setDark] = useState(false);
  const [family, setFamily] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState<File | null>(null);
  const [retry, setRetry] = useState(0);
  const picker = useRef<HTMLInputElement>(null);
  const list = useRef<Sidebar>(null);
  const choosing = useRef({ busy, choose: (_id: string) => {} });
  const generation = useRef(0);
  const loaded = useRef<FontFace | null>(null);
  const active = fonts?.find(font => font.id === selected);

  async function request(path: string, init: RequestInit = {}, session = token) {
    const response = await fetch(path, { ...init, headers: { ...init.headers, Authorization: `Bearer ${session}` }, cache: 'no-store' });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (response.status === 401 || response.status === 403) setFonts(null);
      throw new Error(body.error || 'The font workspace could not be opened. Try again.');
    }
    return response;
  }

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setError('');
    request('/api/fonts', { signal: controller.signal }, token).then(response => response.json()).then((data: { fonts: FontEntry[] }) => {
      if (!controller.signal.aborted) setFonts(data.fonts);
    }).catch(problem => { if (!controller.signal.aborted) setError(problem instanceof Error ? problem.message : 'Could not open fonts.'); });
    return () => controller.abort();
  }, [token, retry]);

  useEffect(() => {
    const current = ++generation.current;
    const controller = new AbortController();
    setFamily(null); setError(''); setLocal(null);
    if (!active?.available || !token) { setBusy(false); return; }
    setBusy(true);
    request(`/api/fonts/file/${selected}`, { signal: controller.signal }, token).then(response => response.arrayBuffer()).then(async bytes => {
      const face = await new FontFace(`WorkspaceFont${current}`, bytes).load();
      if (current !== generation.current || controller.signal.aborted) return;
      if (loaded.current) document.fonts.delete(loaded.current);
      document.fonts.add(face); loaded.current = face; setFamily(face.family);
    }).catch(problem => { if (!controller.signal.aborted) setError(problem instanceof Error ? problem.message : 'The font could not load.'); })
      .finally(() => { if (current === generation.current) setBusy(false); });
    return () => controller.abort();
  }, [selected, active?.available, token, retry]);

  useEffect(() => () => { generation.current++; if (loaded.current) document.fonts.delete(loaded.current); }, []);

  async function openFont(file: File | undefined) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Choose a font smaller than 10 MB.'); return; }
    const current = ++generation.current;
    setBusy(true); setError(''); setMessage('');
    try {
      const face = await new FontFace(`LocalFont${current}`, await file.arrayBuffer()).load();
      if (current !== generation.current) return;
      if (loaded.current) document.fonts.delete(loaded.current);
      document.fonts.add(face); loaded.current = face; setFamily(face.family); setLocal(file);
      setMessage('Local preview. Save when you want to keep this version.');
    } catch { if (current === generation.current) setError('This file could not be opened as a font. Choose a WOFF2, WOFF, OTF or TTF file.'); }
    finally { if (current === generation.current) setBusy(false); if (picker.current) picker.current.value = ''; }
  }

  async function saveFont() {
    if (!local || selected !== 'supernatural') return;
    setBusy(true); setError('');
    try {
      await request('/api/fonts/supernatural', { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream', 'X-Font-Name': local.name.replace(/[^\x20-\x7e]/g, '_') }, body: local });
      // Keep the loaded preview and text in place; the next visit reads the saved version.
      setMessage('Saved privately. Previous font versions are retained.');
      setFonts(values => values?.map(font => font.id === 'supernatural' ? { ...font, available: true, fileName: local.name } : font) ?? null);
      setLocal(null);
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'The font could not be saved.'); }
    finally { setBusy(false); }
  }

  // The shared sidebar owns rows, focus and arrow keys; the workspace owns which font is open.
  choosing.current = { busy, choose: id => { setMessage(''); setSelected(id); } };
  const listItems: SidebarItem[] | null = fonts && fonts.map(font => ({ id: font.id, label: font.name, current: selected === font.id, disabled: busy }));
  useEffect(() => { if (list.current && listItems) list.current.items = listItems; }, [fonts, selected, busy]);
  useEffect(() => {
    const element = list.current;
    if (!element) return;
    const activate = (event: Event) => {
      const { id } = (event as CustomEvent<{ id: string }>).detail;
      if (!choosing.current.busy) choosing.current.choose(id);
    };
    element.addEventListener('sidebar-activate', activate);
    return () => element.removeEventListener('sidebar-activate', activate);
  }, [fonts === null]);

  if (!fonts) return <main className="fonts-status"><h1>Fonts</h1><p role={error ? 'alert' : 'status'}>{error || 'Checking access…'}</p>{error && <Control onClick={() => setRetry(n => n + 1)}>Try again</Control>}<Control onClick={() => void signOut()}>Sign out</Control></main>;

  return <main className={`font-workspace${dark ? ' font-workspace-dark' : ''}`} data-ds-surface>
    <header className="fonts-header"><h1>Fonts</h1><span>Private workspace</span><Control onClick={() => void signOut()}>Sign out</Control></header>
    <Page layout="sidebar" divided fill className="fonts-body">
      <ds-sidebar slot="nav" label="Fonts" ref={list} />
      <header slot="header" className="font-heading"><h2>{active?.name}</h2><span>{active?.detail}</span></header>
      <section className="font-desk" aria-label={active?.name}>
        <div className="font-toolbar">
          <div role="group" aria-label="View"><Control aria-pressed={mode === 'specimen'} onClick={() => setMode('specimen')}>Specimen</Control><Control aria-pressed={mode === 'glyphs'} onClick={() => setMode('glyphs')}>Glyphs</Control></div>
          <Control aria-label={`Size: ${size} pixels. Change size`} onClick={() => setSize(sizes[(sizes.indexOf(size) + 1) % sizes.length]!)}>{size} px</Control>
          <Control aria-label={`Letter spacing: ${spacing} pixels. Change spacing`} onClick={() => setSpacing(n => n === 4 ? 0 : n + 1)}>Spacing {spacing}</Control>
          <Control aria-pressed={dark} onClick={() => setDark(value => !value)}>Dark paper</Control>
          {selected === 'supernatural' && <><input ref={picker} className="font-file" type="file" accept=".woff2,.woff,.ttf,.otf" onChange={event => void openFont(event.target.files?.[0])} /><Control disabled={busy} onClick={() => picker.current?.click()}>Open font</Control>{local && <Control disabled={busy} onClick={() => void saveFont()}>Save font</Control>}</>}
        </div>
        <div className="font-stage" aria-busy={busy}>
          {family ? mode === 'specimen' ? <textarea aria-label={`${active?.name} specimen text`} spellCheck={false} value={text} onChange={event => setText(event.target.value)} style={{ fontFamily: `"${family}"`, fontSize: `calc(${size}px * var(--sf, 1))`, letterSpacing: `calc(${spacing}px * var(--sf, 1))` }} />
            : <div className="font-glyphs" style={{ fontFamily: `"${family}"`, fontSize: `calc(${size}px * var(--sf, 1))` }}>{alphabets.flatMap(line => [...line]).map((letter, index) => <div key={`${letter}-${index}`}><span>{letter}</span><small>U+{letter.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}</small></div>)}</div>
          : <div className="font-empty"><h3>{busy ? 'Loading the font…' : selected === 'supernatural' ? 'Supernatural starts with your handwriting.' : 'No specimen loaded.'}</h3><p>{selected === 'supernatural' ? 'Open a font build to try it here. Handwriting scans and original letterforms are still needed to create the first version.' : 'Select a font to view it, or try again if it could not load.'}</p>{selected === 'supernatural' && <p>English first. About ten forms per letter, with variation in shape, spacing and rhythm.</p>}</div>}
        </div>
      </section>
      <footer slot="footer" className="font-footer"><p role={error ? 'alert' : 'status'}>{error || message || (family ? selected === 'supernatural' ? 'Development study. Missing characters use a fallback.' : mode === 'glyphs' ? 'Unsupported characters use a fallback.' : 'Edit the specimen text. Size changes stay inside the specimen.' : 'No substitute handwriting font is shown.')}</p>{error && <Control onClick={() => setRetry(n => n + 1)}>Try again</Control>}</footer>
    </Page>
  </main>;
}
