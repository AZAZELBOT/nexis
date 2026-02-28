import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { useTheme } from "@/hooks/use-theme";
import {
  extractErrorMessage,
  getControlPlaneHealth,
  getCurrentDashboardSession,
  getRuntimePlaneHealth,
  signInWithEmailPassword,
  signOutCurrentSession,
  type ServiceHealthStatus,
} from "@/lib/api";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ConnectionsPage } from "@/pages/connections-page";
import { ControlPage } from "@/pages/control-page";
import { LoginPage } from "@/pages/login-page";
import { OverviewPage } from "@/pages/overview-page";
import { RoomsPage } from "@/pages/rooms-page";
import { dashboardRoutes, isDashboardRoute, type DashboardRoute } from "@/routes";
import type { DashboardAuthSession } from "@/types";

type DashboardHealthState = {
  checked_at: string | null;
  control: ServiceHealthStatus;
  runtime: ServiceHealthStatus;
  is_refreshing: boolean;
};

const initialHealthState: DashboardHealthState = {
  checked_at: null,
  control: { ok: false, status: null, error: "pending" },
  runtime: { ok: false, status: null, error: "pending" },
  is_refreshing: false,
};

function routeFromHash(): DashboardRoute {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return isDashboardRoute(hash) ? hash : "overview";
}

function pageTitle(route: DashboardRoute): { title: string; description: string } {
  switch (route) {
    case "overview":
      return {
        title: "Overview",
        description: "Realtime operational summary across control and data planes.",
      };
    case "rooms":
      return {
        title: "Rooms",
        description: "Inspect live rooms, members, and game state snapshots.",
      };
    case "connections":
      return {
        title: "Connections",
        description: "Track connected sessions, suspended sessions, and matchmaking.",
      };
    case "control":
      return {
        title: "Control Plane",
        description: "Manage projects, keys, token issuance, and control metrics.",
      };
    default:
      return {
        title: "Overview",
        description: "Realtime operational summary across control and data planes.",
      };
  }
}

function summarizeHealth(state: DashboardHealthState): {
  status: "healthy" | "degraded" | "down";
  message: string;
} {
  if (state.control.ok && state.runtime.ok) {
    return {
      status: "healthy",
      message: "Control and runtime reachable.",
    };
  }

  if (state.control.ok || state.runtime.ok) {
    const details: string[] = [];
    if (!state.control.ok) {
      details.push(`Control: ${state.control.error || "unreachable"}`);
    }
    if (!state.runtime.ok) {
      details.push(`Runtime: ${state.runtime.error || "unreachable"}`);
    }
    return {
      status: "degraded",
      message: details.join(" | "),
    };
  }

  return {
    status: "down",
    message:
      `Control: ${state.control.error || "unreachable"} | Runtime: ${state.runtime.error || "unreachable"}`,
  };
}

export function App() {
  const [session, setSession] = useState<DashboardAuthSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [route, setRoute] = useState<DashboardRoute>("overview");
  const [health, setHealth] = useState<DashboardHealthState>(initialHealthState);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setRoute(routeFromHash());
  }, []);

  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const refreshHealth = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setHealth((current) => ({ ...current, is_refreshing: true }));
    }

    const [control, runtime] = await Promise.all([
      getControlPlaneHealth(),
      getRuntimePlaneHealth(),
    ]);
    const checkedAt = new Date().toISOString();

    setHealth((current) => ({
      checked_at: checkedAt,
      control,
      runtime,
      is_refreshing: silent ? current.is_refreshing : false,
    }));
  }, []);

  const loadSession = useCallback(async () => {
    try {
      const next = await getCurrentDashboardSession();
      setSession(next);
    } catch (error) {
      console.warn("Session lookup failed", extractErrorMessage(error));
      setSession(null);
    } finally {
      setSessionLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!session) {
      return;
    }

    void refreshHealth();
    const id = window.setInterval(() => {
      void refreshHealth({ silent: true });
    }, 5000);
    return () => window.clearInterval(id);
  }, [session, refreshHealth]);

  const currentTitle = useMemo(() => pageTitle(route), [route]);
  const statusSummary = useMemo(() => summarizeHealth(health), [health]);

  async function handleLogin(email: string, password: string) {
    if (!email.trim() || !password.trim()) {
      throw new Error("Email and password are required.");
    }

    await signInWithEmailPassword(email.trim(), password);
    const nextSession = await getCurrentDashboardSession();
    if (!nextSession) {
      throw new Error("Sign in succeeded but session is unavailable.");
    }
    setSession(nextSession);
    await refreshHealth();
  }

  async function handleLogout() {
    try {
      await signOutCurrentSession();
    } catch (error) {
      console.warn("Sign out failed", extractErrorMessage(error));
    } finally {
      setSession(null);
      setHealth(initialHealthState);
    }
  }

  function navigate(nextRoute: DashboardRoute) {
    if (!dashboardRoutes.includes(nextRoute)) {
      return;
    }
    window.location.hash = nextRoute;
    setRoute(nextRoute);
  }

  if (sessionLoading) {
    return (
      <div className="bg-background text-muted-foreground flex min-h-svh items-center justify-center">
        Verifying dashboard session...
      </div>
    );
  }

  if (!session) {
    return <LoginPage onLogin={handleLogin} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "18rem",
          "--header-height": "3.25rem",
        } as CSSProperties
      }
    >
      <AppSidebar
        variant="inset"
        currentRoute={route}
        onNavigate={navigate}
        onLogout={() => {
          void handleLogout();
        }}
      />
      <SidebarInset>
        <SiteHeader
          title={currentTitle.title}
          description={currentTitle.description}
          lastUpdatedAt={health.checked_at}
          status={statusSummary.status}
          statusMessage={statusSummary.message}
          theme={theme}
          onToggleTheme={toggleTheme}
          isRefreshing={health.is_refreshing}
          onRefresh={() => {
            void refreshHealth();
          }}
        />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {route === "overview" ? <OverviewPage /> : null}
            {route === "rooms" ? <RoomsPage /> : null}
            {route === "connections" ? <ConnectionsPage /> : null}
            {route === "control" ? <ControlPage /> : null}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
