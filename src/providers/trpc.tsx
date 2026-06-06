import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../api/router";

// Backend URL - Railway for production, localhost for dev
const BACKEND_URL = "https://uno-blitz-production.up.railway.app";

function getBaseUrl(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.host;
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
  if (isLocal) return `http://${host}`;
  return BACKEND_URL;
}

export const trpc = createTRPCReact<AppRouter>();

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
