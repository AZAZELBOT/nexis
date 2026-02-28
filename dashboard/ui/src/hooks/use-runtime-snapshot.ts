import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

import { extractErrorMessage, getRuntimeSnapshot } from "@/lib/api";
import type { RuntimeAdminSnapshot } from "@/types";

type RuntimeSnapshotOptions = {
  includeState?: boolean;
  roomId?: string;
  enabled?: boolean;
  intervalMs?: number;
};

export function useRuntimeSnapshot(options: RuntimeSnapshotOptions = {}) {
  const {
    includeState = false,
    roomId,
    enabled = true,
    intervalMs = 4_000,
  } = options;

  const query = useQuery({
    queryKey: ["runtime-snapshot", includeState, roomId ?? ""],
    queryFn: () =>
      getRuntimeSnapshot({
        includeState,
        roomId,
      }),
    enabled,
    refetchInterval: enabled ? intervalMs : false,
    refetchIntervalInBackground: false,
    staleTime: Math.max(750, Math.floor(intervalMs * 0.75)),
    retry: 0,
    refetchOnWindowFocus: false,
  });

  const refresh = useCallback(
    async ({ silent: _silent = false }: { silent?: boolean } = {}) => {
      await query.refetch();
    },
    [query],
  );

  return {
    data: (query.data ?? null) as RuntimeAdminSnapshot | null,
    error: query.error ? extractErrorMessage(query.error) : "",
    isLoading: query.isPending,
    refresh,
  };
}
