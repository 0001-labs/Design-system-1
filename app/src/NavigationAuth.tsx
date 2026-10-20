import { useAuthToken } from '@convex-dev/auth/react';
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import { libraryTemplate, templateVersion } from "./lib/libraryTemplate";

// Only the same-origin parent receives the signed-in workspace summary.
export function NavigationAuth() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const token = useAuthToken();
  const [appNavigation, setAppNavigation] = useState<{ token: string; components: { name: string; href: string; layer: number }[] } | null>(null);
  const ready = !isLoading && isAuthenticated;
  useEffect(() => {
    setAppNavigation(null);
    if (!ready || !token) {
      void fetch('/api/dashboard/session', { method: 'DELETE', cache: 'no-store' }).catch(() => {});
      return;
    }
    const controller = new AbortController();
    void fetch('/api/app-navigation', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: controller.signal })
      .then(async response => {
        if (!response.ok) {
          await fetch('/api/dashboard/session', { method: 'DELETE', cache: 'no-store', signal: controller.signal });
          return;
        }
        const data = await response.json();
        const session = await fetch('/api/dashboard/session', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: controller.signal });
        if (!session.ok) return;
        if (!controller.signal.aborted && Array.isArray(data.components)) setAppNavigation({ token, components: data.components });
      }).catch(() => { /* Access unavailable: keep internal navigation hidden. */ });
    return () => controller.abort();
  }, [ready, token]);
  const profile = useQuery(api.users.profile, ready ? {} : "skip");
  const libraries = useQuery(api.libraries.list, ready ? {} : "skip");
  const create = useMutation(api.libraries.create);
  const pending = useRef(false);
  const [creating, setCreating] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  useEffect(() => {
    const report = () => window.parent.postMessage({
      type: "ds1:navigation-auth", authenticated: ready,
      appComponents: ready && token === appNavigation?.token ? appNavigation.components : [],
      companyName: ready ? profile?.companyName ?? "" : "",
      libraries: ready ? libraries?.map(({ _id, name, publishedVersion }) => ({ id: _id, name, publishedVersion })) ?? [] : [],
      librariesLoaded: ready && libraries !== undefined, creating, creationError,
    }, window.location.origin);
    const request = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (event.data?.type === "ds1:navigation-auth-request") report();
      if (event.data?.type !== "ds1:create-library" || !ready || pending.current) return;
      pending.current = true; setCreating(true); setCreationError(null);
      try {
        const library = await create({ name: "Untitled library", css: libraryTemplate, config: JSON.stringify({ schema: 2 }), templateVersion: templateVersion() });
        window.parent.postMessage({ type: "ds1:library-created", id: library._id }, window.location.origin);
      } catch { setCreationError("Could not create a library. Try again from My libraries."); }
      finally { pending.current = false; setCreating(false); }
    };
    window.addEventListener("message", request); report();
    return () => window.removeEventListener("message", request);
  }, [ready, token, appNavigation, profile?.companyName, libraries, creating, creationError, create]);
  return null;
}
