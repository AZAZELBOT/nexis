import {
  Activity,
  Gauge,
  Network,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import type {
  ControlMetricsResponse,
  RuntimeAdminSnapshot,
} from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function metricValue(value: number | undefined): string {
  if (typeof value !== "number") {
    return "--";
  }
  return String(value);
}

export function SectionCards({
  runtime,
  control,
}: {
  runtime: RuntimeAdminSnapshot | null;
  control: ControlMetricsResponse | null;
}) {
  const tokenMinted = control?.counters.tokens_minted ?? 0;
  const tokenDenied = control?.counters.tokens_denied ?? 0;
  const tokenAttempts = tokenMinted + tokenDenied;
  const successRate = tokenAttempts
    ? Math.round((tokenMinted / tokenAttempts) * 100)
    : 0;

  const cards = [
    {
      title: "Connections",
      value: metricValue(runtime?.metrics.active_connections),
      description: "Live WebSocket sessions",
      icon: Activity,
    },
    {
      title: "Rooms",
      value: metricValue(runtime?.metrics.room_count),
      description: `${runtime?.totals.matchmaking_waiting ?? 0} in matchmaking queue`,
      icon: Network,
    },
    {
      title: "Token Mint",
      value: metricValue(tokenMinted),
      description: `${successRate}% success rate`,
      icon: ShieldCheck,
    },
    {
      title: "Resync Requests",
      value: metricValue(runtime?.metrics.state_resync_total),
      description: `${metricValue(runtime?.metrics.state_patches_total)} patches emitted`,
      icon: Gauge,
    },
    {
      title: "Denied Tokens",
      value: metricValue(tokenDenied),
      description: "Access checks blocked by control plane",
      icon: TriangleAlert,
    },
  ];

  return (
    <div className="grid gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 lg:px-6">
      {cards.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.title}
            className="border-border/80 bg-card/80 backdrop-blur animate-fade-up"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between">
                <p className="text-2xl font-bold text-foreground">{item.value}</p>
                <Icon className="size-4 text-muted-foreground/80" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
