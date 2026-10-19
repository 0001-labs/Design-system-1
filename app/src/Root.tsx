import { FeatureFlags } from "./screens/FeatureFlags";
import { AdoptionDashboard } from "./screens/AdoptionDashboard";
import { FontWorkspace } from "./screens/FontWorkspace";
import { IconBuilder } from "./screens/iconBuilder/IconBuilder";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useEffect, type ReactNode } from "react";

import "../../DS1/2-core/ds-button";
import { Button } from "../../DS1/react/button";
import { LoadingIndicator } from "../../packages/app/src/react/loading";
import { App } from "./App";
import { AppShell } from "./AppShell";
import { libraryWorkspaceRedirect } from "../../shared/library-navigation";
import { convex } from "./lib/convex";
import { navigate, RouterProvider, useLocation, useRoute } from "./router";
import { NavigationAuth } from "./NavigationAuth";
import { LibraryEditor } from "./screens/LibraryEditor";
import { Profile } from "./screens/Profile";
import { LibraryList } from "./screens/LibraryList";
import { SignIn } from "./screens/SignIn";

/**
 * Route table.
 *
 *   /playground   today's workbench, no account, no persistence
 *   /signin       the shared sign-in screen: the email, then the code or the owner's password
 *   /libraries    dashboard
 *   /l/:id        editor
 *
 * `/playground` keeps the product's current front door working and gives people
 * something to try before creating an account.
 */
function Routes() {
  const { path } = useLocation();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const editor = useRoute("/l/:id");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('standalone') === '1') document.documentElement.setAttribute('data-standalone-workspace', '');
    const destination = libraryWorkspaceRedirect(path, query, document.documentElement.hasAttribute('data-docs-embed'), document.documentElement.hasAttribute('data-standalone-workspace'));
    if (destination) window.location.replace(destination);
  }, [path]);

  if (path === "/" || path === "/playground") return <App />;

  if (isLoading) return <Splash />;

  if (!isAuthenticated) {
    if (path !== "/signin") {
      // Remember where they were headed so sign-in can return them there.
      return <SignIn redirectTo={path === "/" ? "/libraries" : path} />;
    }
    return <SignIn />;
  }

  if (path === "/signin") {
    navigate("/libraries", { replace: true });
    return <Splash />;
  }

  if (path === "/libraries") return <LibraryList />;
  if (path === "/profile") return <Profile />;
  if (path === "/reports/components") { window.location.replace("https://dash.designsystem1.com/"); return <Splash />; }
  if (editor) return <LibraryEditor libraryId={editor.id} />;

  return <NotFound />;
}

function Splash() {
  return (
    <div className="route-splash" data-testid="route-splash">
      <LoadingIndicator label="Loading" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="route-splash">
      <p className="ds-text">That page does not exist.</p>
      <Button secondary onClick={() => navigate("/libraries")}>
        Go to your libraries
      </Button>
    </div>
  );
}


export function Root({ children }: { children?: ReactNode }) {
  return (
    <ConvexAuthProvider client={convex}>
      <RouterProvider>{["/flags", "/flags/", "/app/flags"].includes(window.location.pathname) ? <FeatureFlags /> : window.location.pathname === "/app/navigation-auth" ? <NavigationAuth /> : window.location.hostname === "dash.designsystem1.com" ? <AdoptionDashboard /> : window.location.hostname === "fonts.designsystem1.com" ? <FontWorkspace /> : window.location.hostname === "icon.designsystem1.com" ? <IconBuilder /> : <AppShell>{children ?? <Routes />}</AppShell>}</RouterProvider>
    </ConvexAuthProvider>
  );
}
