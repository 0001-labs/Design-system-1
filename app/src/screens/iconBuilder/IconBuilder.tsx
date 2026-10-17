import { useEffect, useRef } from 'react';
import '../../../../DS1/1-root/controls.css';
import '../../../../DS1/0-face/tooltips';
import '../../../../DS1/2-core/ds-button';
import '../../../../DS1/2-core/ds-checkbox';
import '../../../../DS1/2-core/ds-color';
import '../../../../DS1/2-core/ds-file-picker';
import '../../../../DS1/2-core/ds-icon';
import '../../../../DS1/2-core/ds-input';
import '../../../../DS1/2-core/ds-notice';
import '../../../../DS1/2-core/ds-select';
import '../../../../DS1/2-core/ds-swatch';
import '../../../../DS1/3-unit/ds-tabs';
import { Button } from '../../../../DS1/react/button';
import { LoadingIndicator } from '../../../../DS1/react/loading';
import { Notice } from '../../../../DS1/react/notice';
import { useOwnerSession } from '../AdoptionDashboard';
import { SignIn } from '../SignIn';
import { builderMarkup } from './markup';
import './icon-builder.css';

/** The badge and favicon builder, for the owner alone on icon.designsystem1.com. */
export function IconBuilder() {
  const { isLoading, isAuthenticated, ready, error, leave } = useOwnerSession('Icon builder · Design system 1');
  if (isLoading) return <main className="icon-builder-status"><LoadingIndicator label="Checking your session" /></main>;
  if (!isAuthenticated) return <div className="app-shell"><SignIn privateTitle="Icon builder" redirectTo="/" /></div>;
  if (error) return <main className="icon-builder-status"><Notice tone="danger" actions={<Button secondary onClick={() => void leave()}>Sign out</Button>}>{error}</Notice></main>;
  if (!ready) return <main className="icon-builder-status"><LoadingIndicator label="Checking access" /></main>;
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
    <header className="icon-builder-bar"><h1 className="ds-text ds-text--heading">Icon builder</h1><Button onClick={() => void onSignOut()}>Sign out</Button></header>
    <div ref={host} />
  </main>;
}
