import { useEffect, useRef } from 'react';
import { useOwnerSession } from '../AdoptionDashboard';
import { SignIn } from '../SignIn';
import { builderMarkup } from './markup';
import './icon-builder.css';

/** The badge and favicon builder, for the owner alone on icon.designsystem1.com. */
export function IconBuilder() {
  const { isLoading, isAuthenticated, ready, error, leave } = useOwnerSession('Icon builder · Design system 1');
  if (isLoading) return <main className="icon-builder-status" role="status">Checking your session…</main>;
  if (!isAuthenticated) return <div className="app-shell"><SignIn privateTitle="Icon builder" redirectTo="/" /></div>;
  if (error) return <main className="icon-builder-status" role="alert"><p>{error}</p><button type="button" onClick={() => void leave()}>Sign out</button></main>;
  if (!ready) return <main className="icon-builder-status" role="status">Checking access…</main>;
  return <Builder onSignOut={leave} />;
}

function Builder({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current) return;
    host.current.innerHTML = builderMarkup();
    // The editor wires the markup by ID as it loads, once per page.
    void import('./editor');
  }, []);
  return <main className="icon-builder">
    <header className="icon-builder-bar"><h1>Icon builder</h1><button type="button" onClick={() => void onSignOut()}>Sign out</button></header>
    <div ref={host} />
  </main>;
}
