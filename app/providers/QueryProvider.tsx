"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

/**
 * React Query Provider with optimized defaults
 *
 * Configuration:
 * - staleTime: 5 minutes - Data considered fresh for 5 minutes
 * - cacheTime: 30 minutes - Unused data kept in cache for 30 minutes
 * - refetchOnWindowFocus: false - Don't refetch when window regains focus
 * - retry: 1 - Retry failed requests once
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 30, // 30 minutes (renamed from cacheTime in v5)
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
