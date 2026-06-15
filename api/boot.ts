import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import fs from "fs";
import path from "path";
import { appRouter } from "./router";
import { createContext } from "../src/server/context";
import { createOAuthCallbackHandler } from "../src/server/kimi/auth";
import { Paths } from "@contracts/constants";
import { initWebSocketServer } from "../src/server/game/ws-server";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// CORS: the frontend (Vercel) and backend (Railway) are different origins, so
// cross-origin tRPC calls with cookies need explicit CORS + credentials.
// Configure allowed origins via CORS_ORIGIN (comma-separated); defaults cover
// the deployed Vercel app plus local dev.
const ALLOWED_ORIGINS = (
  process.env.CORS_ORIGIN ??
  "https://uno-blitz.vercel.app,http://localhost:3000,http://localhost:5173"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  "/api/*",
  cors({
    origin: (origin) =>
      origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".vercel.app"))
        ? origin
        : ALLOWED_ORIGINS[0],
    credentials: true,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Health checks for Railway - MUST be before other routes so the platform
// always gets a fast 200 even if the rest of the app is busy.
app.get("/", (c) => c.json({ status: "ok", service: "uno-blitz", timestamp: Date.now() }));
app.get("/health", (c) => c.json({ status: "ok" }));

app.get(Paths.oauthCallback, createOAuthCallbackHandler());
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

// Resolve the built frontend directory in a way that does not depend on the
// process working directory. When bundled the file lives at dist/boot.js, so
// the frontend is the sibling dist/public. Fall back to cwd/dist/public.
function resolvePublicDir(): string {
  const candidates = [
    path.resolve(import.meta.dirname, "public"),
    path.resolve(process.cwd(), "dist/public"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "index.html"))) return dir;
  }
  return candidates[candidates.length - 1];
}

const PUBLIC_DIR = resolvePublicDir();

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

// Serve static frontend files; fall back to index.html for SPA routing.
app.use("/*", async (c, next) => {
  try {
    const { pathname } = new URL(c.req.url);
    // Normalize and guard against path traversal outside PUBLIC_DIR.
    const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
    let filePath = path.join(PUBLIC_DIR, safePath);
    if (!filePath.startsWith(PUBLIC_DIR)) filePath = path.join(PUBLIC_DIR, "index.html");
    if (pathname === "/" || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(PUBLIC_DIR, "index.html");
    }
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath);
      const ext = path.extname(filePath);
      return c.body(content, 200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    }
  } catch {
    /* fall through to next() */
  }
  await next();
});

export default app;

// Never let a single stray rejection or exception kill the container. Log it
// and keep serving - unhandled rejections are what previously caused Railway
// restart loops (Node terminates the process by default).
process.on("unhandledRejection", (reason) => {
  console.error("[Server] Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[Server] Uncaught exception:", err);
});

// Start server with Railway-compatible settings.
async function startServer() {
  const { serve } = await import("@hono/node-server");
  // Railway sets PORT dynamically; bind to 0.0.0.0 so the edge proxy can reach us.
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const hostname = "0.0.0.0";

  const server = serve({ fetch: app.fetch, port, hostname }, () => {
    console.log(`[Server] Listening on http://${hostname}:${port}/`);
    console.log(`[Server] WebSocket on ws://${hostname}:${port}/ws`);
    console.log(`[Server] PORT=${process.env.PORT ?? "(unset, defaulting to 3000)"} | static dir: ${PUBLIC_DIR}`);
  });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initWebSocketServer(server as any);
    console.log("[WS] WebSocket server attached to HTTP server");
  } catch (err) {
    console.error("[WS] Failed to attach WebSocket:", err);
  }

  // Graceful shutdown on Railway redeploys.
  const shutdown = (signal: string) => {
    console.log(`[Server] ${signal} received, shutting down gracefully`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref(); // force-exit if close hangs
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch((err) => {
  console.error("[Server] Fatal error during startup:", err);
  process.exit(1);
});
