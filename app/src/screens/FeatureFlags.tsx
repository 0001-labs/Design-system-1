import { useAuthToken } from '@convex-dev/auth/react';
import { useConvexAuth } from 'convex/react';
import { useEffect, useRef } from 'react';
import { mountFlags } from '../../../shared/feature-flags-runtime/manage';
import { SignIn } from './SignIn';

export function FeatureFlags() {
  const token = useAuthToken();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!token || !host.current) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    async function request(init: RequestInit = {}) {
      const response = await fetch('/api/flags', {...init,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},cache:'no-store'});
      if (!response.ok) throw new Error('Feature flags are private to the owner.');
      return response.json();
    }
    void mountFlags(host.current,{manage:()=>request(),set:async rule=>{await request({method:'PUT',body:JSON.stringify(rule)});}})
      .then(stop=>{if(disposed) stop(); else cleanup=stop;});
    return ()=>{disposed=true;cleanup?.();};
  },[token,isAuthenticated]);
  if (isLoading) return <p className="ds-text">Loading…</p>;
  if (!isAuthenticated) return <SignIn redirectTo="/flags" />;
  return <main><h1 className="ds-text">Feature flags</h1><div ref={host}/></main>;
}
