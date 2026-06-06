// Single source of truth for backend endpoints.
//
// The frontend is hosted on Vercel and the backend (HTTP/tRPC + WebSocket) on
// Railway, so in production we must point at the Railway origin — NOT
// window.location.host (that would resolve to the Vercel domain, which has no
// backend). In local dev we talk to the same host the app is served from.
//
// Override at build time with VITE_BACKEND_HOST if the backend ever moves.

const BACKEND_HOST: string =
  (import.meta.env.VITE_BACKEND_HOST as string | undefined) ??
  "uno-blitz-production.up.railway.app";

function isLocalHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.host;
  return host.includes("localhost") || host.includes("127.0.0.1");
}

/** Base URL for HTTP / tRPC requests, e.g. "https://uno-blitz-production.up.railway.app". */
export function getBackendHttpUrl(): string {
  if (typeof window === "undefined") return "";
  if (isLocalHost()) return `${window.location.protocol}//${window.location.host}`;
  return `https://${BACKEND_HOST}`;
}

/** WebSocket URL for the game server, e.g. "wss://uno-blitz-production.up.railway.app/ws". */
export function getBackendWsUrl(): string {
  if (isLocalHost()) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws`;
  }
  return `wss://${BACKEND_HOST}/ws`;
}
