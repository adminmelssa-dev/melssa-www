"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  if (!browserQueryClient) {
    browserQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
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
