'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function makeQueryClient() {
   return new QueryClient({
      defaultOptions: {
         queries: {
            staleTime: 1000 * 60 * 2, // 2 minutes
            gcTime: 1000 * 60 * 10, // 10 minutes
            refetchOnWindowFocus: true,
            retry: (failureCount, error: unknown) => {
               const err = error as { status?: number };
               if (err?.status === 401 || err?.status === 403 || err?.status === 404) {
                  return false;
               }
               return failureCount < 2;
            },
         },
         mutations: {
            retry: 0,
         },
      },
   });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
   if (typeof window === 'undefined') {
      return makeQueryClient();
   } else {
      if (!browserQueryClient) browserQueryClient = makeQueryClient();
      return browserQueryClient;
   }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
   const queryClient = getQueryClient();

   return (
      <QueryClientProvider client={queryClient}>
         {children}
         {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
         )}
      </QueryClientProvider>
   );
}
