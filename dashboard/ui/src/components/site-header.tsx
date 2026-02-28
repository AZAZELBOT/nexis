import {
  Activity,
  AlertTriangle,
  CircleCheckBig,
  RefreshCcw,
  ServerCrash,
} from "lucide-react";

import type { DashboardTheme } from "@/hooks/use-theme";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader({
  title,
  description,
  lastUpdatedAt,
  status,
  statusMessage,
  theme,
  onToggleTheme,
  isRefreshing,
  onRefresh,
}: {
  title: string;
  description: string;
  lastUpdatedAt: string | null;
  status: "healthy" | "degraded" | "down";
  statusMessage?: string;
  theme: DashboardTheme;
  onToggleTheme: () => void;
  isRefreshing: boolean;
  onRefresh?: () => void;
}) {
  const healthy = status === "healthy";
  const statusLabel = healthy
    ? "Healthy"
    : status === "degraded"
      ? "Degraded"
      : "Down";

  return (
    <header className="border-b border-border/80 bg-background/80 px-4 py-3 backdrop-blur lg:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <SidebarTrigger className="-ml-1 md:hidden" />
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
              Nexis Dashboard
            </span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={healthy ? "secondary" : "destructive"}>
            {healthy ? (
              <CircleCheckBig className="mr-1 size-3.5" />
            ) : status === "degraded" ? (
              <AlertTriangle className="mr-1 size-3.5" />
            ) : (
              <ServerCrash className="mr-1 size-3.5" />
            )}
            {statusLabel}
          </Badge>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          {onRefresh ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCcw
                className={
                  isRefreshing ? "mr-1 size-4 animate-spin" : "mr-1 size-4"
                }
              />
              Refresh
            </Button>
          ) : null}
        </div>
      </div>
      <div className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
        <Activity className="size-3.5" />
        Last sync: {lastUpdatedAt ? formatDateTime(lastUpdatedAt) : "pending"}
        {statusMessage ? (
          <span className="opacity-90">- {statusMessage}</span>
        ) : null}
      </div>
    </header>
  );
}
