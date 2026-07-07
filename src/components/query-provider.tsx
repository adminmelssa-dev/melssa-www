"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  if (!browserQueryClient) {
    browserQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          gcTime: 10 * 60_000,
          retry: 1,
          staleTime: 2 * 60_000,
          refetchOnReconnect: false,
          refetchOnWindowFocus: false,
        },
      },
    });
  }

  return browserQueryClient;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}
