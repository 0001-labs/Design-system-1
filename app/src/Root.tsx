import { AdoptionDashboard } from "./screens/AdoptionDashboard";
import { FontWorkspace } from "./screens/FontWorkspace";
import { IconBuilder } from "./screens/iconBuilder/IconBuilder";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useEffect, type ReactNode } from "react";

import "../../DS1/2-core/ds-button";
import { Button } from "../../DS1/react/button";
import { LoadingIndicator } from "../../DS1/react/loading";
import { App } from "./App";
import { AppShell } from "./AppShell";
import { convex } from "./lib/convex";
import { navigate, RouterProvider, useLocation, useRoute } from "./router";
import { LibraryEditor } from "./screens/LibraryEditor";
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

// Same-origin public navigation receives only a verified session boolean.
function NavigationAuth() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  useEffect(() => {
    const report = () => window.parent.postMessage({ type: "ds1:navigation-auth", authenticated: !isLoading && isAuthenticated }, window.location.origin);
    const request = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.source === window.parent && event.data?.type === "ds1:navigation-auth-request") report();
    };
    window.addEventListener("message", request);
    report();
    return () => window.removeEventListener("message", request);
  }, [isAuthenticated, isLoading]);
  return null;
}

export function Root({ children }: { children?: ReactNode }) {
  return (
    <ConvexAuthProvider client={convex}>
      <RouterProvider>{window.location.pathname === "/app/navigation-auth" ? <NavigationAuth /> : window.location.hostname === "dash.designsystem1.com" ? <AdoptionDashboard /> : window.location.hostname === "fonts.designsystem1.com" ? <FontWorkspace /> : window.location.hostname === "icon.designsystem1.com" ? <IconBuilder /> : <AppShell>{children ?? <Routes />}</AppShell>}</RouterProvider>
    </ConvexAuthProvider>
  );
}
