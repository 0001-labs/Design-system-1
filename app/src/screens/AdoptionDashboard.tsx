import { useAuthActions, useAuthToken } from '@convex-dev/auth/react';
import { useConvexAuth } from 'convex/react';
import { useEffect, useState } from 'react';
import '../../../DS1/2-core/ds-button';
import '../../../DS1/2-core/ds-notice';
import { Button } from '../../../DS1/react/button';
import { LoadingIndicator } from '../../../packages/app/src/react/loading';
import { Notice } from '../../../DS1/react/notice';
import { SignIn } from './SignIn';
import { ComponentAdoption } from './ComponentAdoption';
import { ComponentGlossary } from './ComponentGlossary';

/**
 * The owner's session on a private host: the Worker gates the page, this
 * session bridge and every read on its own; this only bridges the sign-in
 * token into the host's cookie, then reloads the protected page.
 */
export function useOwnerSession(title: string) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const token = useAuthToken();
  const { signOut } = useAuthActions();
  const [destination] = useState(() => new URLSearchParams(window.location.search).get('next') === '/private-app/' ? '/private-app/' + (['#keyboard-shortcut', '#spacing-handle', '#loading-indicator'].includes(window.location.hash) ? window.location.hash : '') : '/');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    document.title = title;
  }, [title]);
  useEffect(() => {
    setReady(false); setError('');
    if (!token) return;
    const controller = new AbortController();
    void fetch('/api/dashboard/session', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error((await response.json()).error || 'This page is private.');
        if (!controller.signal.aborted) {
          setReady(true);
          // Prove the protected HTML route before showing anything after sign-in.
          if (window.location.pathname !== '/') window.location.replace(destination);
        }
      }).catch(caught => { if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : 'Could not check access.'); });
    return () => controller.abort();
  }, [token, destination]);
  async function leave() {
    await fetch('/api/dashboard/session', { method: 'DELETE' });
    await signOut();
    window.location.replace('/app/signin');
  }
  return { isLoading, isAuthenticated, ready, error, leave };
}

/** The Worker independently gates the page, session bridge and every report read. */
export function AdoptionDashboard() {
  const [glossary, setGlossary] = useState(() => window.location.hash === '#glossary');
  useEffect(() => {
    const update = () => setGlossary(window.location.hash === '#glossary');
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  const { isLoading, isAuthenticated, ready, error, leave } = useOwnerSession('Component adoption · Design system 1');
  if (isLoading) return <main className="adoption"><LoadingIndicator label="Checking your session" /></main>;
  if (!isAuthenticated) return <div className="app-shell"><SignIn dashboardOnly redirectTo="/reports/components" /></div>;
  if (error) return <main className="adoption"><Notice tone="danger" actions={<Button secondary onClick={() => void leave()}>Sign out</Button>}>{error}</Notice></main>;
  if (!ready) return <main className="adoption"><LoadingIndicator label="Checking dashboard access" /></main>;
  return glossary ? <ComponentGlossary onSignOut={leave} /> : <ComponentAdoption onSignOut={leave} />;
}
