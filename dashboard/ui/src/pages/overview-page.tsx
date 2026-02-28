import { useEffect, useMemo, useState } from "react";

import data from "@/data.json";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable, type RoomTableRow } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { controlApi, extractErrorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { ControlMetricsResponse } from "@/types";
import { useRuntimeSnapshot } from "@/hooks/use-runtime-snapshot";

type ConnectionPoint = {
  label: string;
  value: number;
};

export function OverviewPage() {
  const { data: runtime } = useRuntimeSnapshot({ intervalMs: 5_000 });
  const [controlMetrics, setControlMetrics] =
    useState<ControlMetricsResponse | null>(null);
  const [controlError, setControlError] = useState("");
  const [connectionSeries, setConnectionSeries] = useState<ConnectionPoint[]>(
    [],
  );

  useEffect(() => {
    let disposed = false;
    async function refreshControlMetrics() {
      try {
        const metrics = await controlApi<ControlMetricsResponse>("/metrics");
        if (disposed) {
          return;
        }
        setControlMetrics(metrics);
        setControlError("");
      } catch (error) {
        if (disposed) {
          return;
        }
        setControlError(extractErrorMessage(error));
      }
    }

    void refreshControlMetrics();
    const id = window.setInterval(() => {
      void refreshControlMetrics();
    }, 5000);
    return () => {
      disposed = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!runtime) {
      return;
    }
    setConnectionSeries((previous) => {
      const next = [
        ...previous,
        {
          label: new Date(runtime.generated_at).toLocaleTimeString(),
          value: runtime.metrics.active_connections,
        },
      ];
      return next.slice(-30);
    });
  }, [runtime]);

  const roomRows = useMemo<RoomTableRow[]>(() => {
    if (!runtime || runtime.rooms.length === 0) {
      return data as RoomTableRow[];
    }
    return runtime.rooms.map((room) => ({
      id: room.id,
      roomType: room.room_type,
      members: room.member_count,
      lastActivity: formatDateTime(room.last_activity_at),
    }));
  }, [runtime]);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {controlError ? (
        <div className="mx-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive lg:mx-6">
          {controlError}
        </div>
      ) : null}
      <SectionCards runtime={runtime} control={controlMetrics} />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive points={connectionSeries} />
      </div>
      <div className="px-4 lg:px-6">
        <DataTable data={roomRows} />
      </div>
    </div>
  );
}
