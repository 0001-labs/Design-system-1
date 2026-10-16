import { useAuthActions, useAuthToken } from '@convex-dev/auth/react';
import { useConvexAuth } from 'convex/react';
import { useEffect, useState } from 'react';
import { calculateScalingFactor } from '../../../DS1/0-face/scaling';
import { SignIn } from './SignIn';
import { ComponentAdoption } from './ComponentAdoption';

/** The Worker independently gates the page, session bridge and every report read. */
export function AdoptionDashboard() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const token = useAuthToken();
  const { signOut } = useAuthActions();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    document.title = 'Component adoption · Design system 1';
    const scale = () => document.documentElement.style.setProperty('--sf', String(window.innerWidth <= 768 ? calculateScalingFactor(window.innerWidth) : 1));
    scale(); window.addEventListener('resize', scale);
    return () => window.removeEventListener('resize', scale);
  }, []);
  useEffect(() => {
    setReady(false); setError('');
    if (!token) return;
    const controller = new AbortController();
    void fetch('/api/dashboard/session', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error((await response.json()).error || 'This dashboard is private.');
        if (!controller.signal.aborted) {
          setReady(true);
          // Prove the protected HTML route before showing the report after sign-in.
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
  if (isLoading) return <main className="adoption" role="status">Checking your session…</main>;
  if (!isAuthenticated) return <div className="app-shell"><SignIn redirectTo="/reports/components" /></div>;
  if (error) return <main className="adoption" role="alert"><p>{error}</p><button type="button" onClick={() => void leave()}>Sign out</button></main>;
  if (!ready) return <main className="adoption" role="status">Checking dashboard access…</main>;
  return <ComponentAdoption onSignOut={leave} />;
}
