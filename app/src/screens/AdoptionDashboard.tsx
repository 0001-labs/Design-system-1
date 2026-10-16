import { useAuthActions, useAuthToken } from '@convex-dev/auth/react';
import { useConvexAuth } from 'convex/react';
import { useEffect, useState } from 'react';
import { calculateScalingFactor } from '../../../DS1/0-face/scaling';
import '../../../DS1/2-core/ds-button';
import { Button } from '../../../DS1/react/button';
import { SignIn } from './SignIn';
import { ComponentAdoption } from './ComponentAdoption';

/**
 * The owner's session on a private host: the Worker gates the page, this
 * session bridge and every read on its own; this only bridges the sign-in
 * token into the host's cookie, then reloads the protected page.
 */
export function useOwnerSession(title: string) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const token = useAuthToken();
  const { signOut } = useAuthActions();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    document.title = title;
    const scale = () => document.documentElement.style.setProperty('--sf', String(window.innerWidth <= 768 ? calculateScalingFactor(window.innerWidth) : 1));
    scale(); window.addEventListener('resize', scale);
    return () => window.removeEventListener('resize', scale);
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
          if (window.location.pathname !== '/') window.location.replace('/');
        }
      }).catch(caught => { if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : 'Could not check access.'); });
    return () => controller.abort();
  }, [token]);
  async function leave() {
    await fetch('/api/dashboard/session', { method: 'DELETE' });
    await signOut();
    window.location.replace('/app/signin');
  }
  return { isLoading, isAuthenticated, ready, error, leave };
}

/** The Worker independently gates the page, session bridge and every report read. */
export function AdoptionDashboard() {
  const { isLoading, isAuthenticated, ready, error, leave } = useOwnerSession('Component adoption · Design system 1');
  if (isLoading) return <main className="adoption" role="status">Checking your session…</main>;
  if (!isAuthenticated) return <div className="app-shell"><SignIn dashboardOnly redirectTo="/reports/components" /></div>;
  if (error) return <main className="adoption" role="alert"><p>{error}</p><Button secondary onClick={() => void leave()}>Sign out</Button></main>;
  if (!ready) return <main className="adoption" role="status">Checking dashboard access…</main>;
  return <ComponentAdoption onSignOut={leave} />;
}
