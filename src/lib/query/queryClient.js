import { QueryClient } from "@tanstack/vue-query";

/**
 * Global TanStack Query client.
 *
 * Goals:
 * - Deduplicate requests across router guards + pages
 * - Provide a single cache for "server state"
 * - Keep current store APIs working (stores can call queryClient.fetchQuery)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Avoid repeated refetch during quick navigation.
      staleTime: 30_000, // 30s
      // How long unused cache stays in memory.
      gcTime: 5 * 60_000, // 5m

      refetchOnWindowFocus: false,
      refetchOnReconnect: true,

      // Retry only for likely-transient failures. Axios errors provide `response.status`.
      retry: (failureCount, error) => {
        const status = error?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});
