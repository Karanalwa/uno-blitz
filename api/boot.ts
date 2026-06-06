import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";
import { initWebSocketServer } from "./game/ws-server";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// Health check for Railway - MUST be first
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

// Serve static files (frontend)
app.use("/*", async (c, next) => {
  try {
    const fs = await import("fs");
    const path = await import("path");
    const url = new URL(c.req.url);
    let filePath = path.join(process.cwd(), "dist/public", url.pathname);
    if (url.pathname === "/") filePath = path.join(process.cwd(), "dist/public", "index.html");
    if (!fs.existsSync(filePath)) filePath = path.join(process.cwd(), "dist/public", "index.html");
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath);
      const ext = path.extname(filePath);
      const mime: Record<string, string> = {
        ".html": "text/html", ".js": "application/javascript", ".css": "text/css",
        ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml",
        ".json": "application/json", ".woff2": "font/woff2", ".ico": "image/x-icon"
      };
      return c.body(content, 200, { "Content-Type": mime[ext] || "application/octet-stream" });
    }
  } catch { /* fall through */ }
  await next();
});

export default app;

// Start server with Railway-compatible settings
async function startServer() {
  const { serve } = await import("@hono/node-server");
  const port = parseInt(process.env.PORT || "3000");
  const hostname = "0.0.0.0";

  const server = serve({ fetch: app.fetch, port, hostname }, () => {
    console.log(`Server running on http://${hostname}:${port}/`);
    console.log(`WebSocket available on ws://${hostname}:${port}/ws`);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initWebSocketServer(server as any);
}

startServer().catch(console.error);