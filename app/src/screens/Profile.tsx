import { useAuthActions } from '@convex-dev/auth/react';
import { useMutation, useQuery } from 'convex/react';
import { useRef, useState } from 'react';
import { api } from '../../../convex/_generated/api';
import '../../../DS1/2-core/ds-input';
import '../../../DS1/2-core/ds-avatar';
import { Avatar } from '../../../DS1/react/avatar';
import { Input } from '../../../DS1/react/input';
import { Button } from '../../../DS1/react/button';
import { Notice } from '../../../DS1/react/notice';
import { LoadingIndicator } from '../../../packages/app/src/react/loading';
import { Link } from '../router';
import './profile.css';

export function Profile() {
  const user = useQuery(api.users.current);
  const profile = useQuery(api.users.profile);
  const saveCompany = useMutation(api.users.setCompanyName);
  const { signOut } = useAuthActions();
  const [company, setCompany] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const inFlight = useRef(false);
  if (user === undefined || profile === undefined) return <main className="profile-page"><LoadingIndicator label="Loading your profile" /></main>;
  const value = company ?? profile?.companyName ?? '';
  return <main className="profile-page" data-testid="profile-page">
    <Link to="/libraries">Your libraries</Link>
    <header className="profile-heading"><Avatar icon="avatar" aria-hidden="true" /><h1>Your profile</h1></header>
    <div className="profile-email"><span className="profile-label">Signed-in email</span><p>{user?.email ?? 'No email available'}</p></div>
    <form className="profile-form" onSubmit={async event => {
      event.preventDefault();
      if (inFlight.current || !profile || !value.trim()) return;
      inFlight.current = true; setSaving(true); setError(null); setSaved(false);
      try { await saveCompany({companyName: value}); setCompany(null); setSaved(true); }
      catch { setError('Could not save the company name. Try again.'); }
      finally { inFlight.current = false; setSaving(false); }
    }}>
      <label><span className="profile-label">Company name</span>
        <Input aria-label="Company name" value={value} required maxLength={80} disabled={saving || !profile}
          onChange={event => { setCompany(event.target.value); setSaved(false); }} />
      </label>
      <Button secondary type="submit" disabled={saving || !profile || !value.trim() || value === profile.companyName}>
        {saving ? 'Saving…' : 'Save company name'}
      </Button>
      <span className="profile-status" role="status">{saved ? 'Company name saved' : ''}</span>
    </form>
    {error ? <Notice tone="danger">{error}</Notice> : null}
    <div className="profile-session"><Button secondary disabled={saving || signingOut} onClick={async () => {
      if (inFlight.current) return;
      inFlight.current = true; setSigningOut(true); setError(null);
      try { await signOut(); }
      catch { setError('Could not sign out. Try again.'); }
      finally { inFlight.current = false; setSigningOut(false); }
    }}>{signingOut ? 'Signing out…' : 'Sign out'}</Button></div>
  </main>;
}
