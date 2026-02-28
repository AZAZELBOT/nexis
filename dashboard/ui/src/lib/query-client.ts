import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep dashboard traffic predictable in dev/prod.
      retry: 0,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: 1_000,
      gcTime: 5 * 60 * 1_000,
    },
  },
});
