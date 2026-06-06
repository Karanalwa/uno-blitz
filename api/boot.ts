import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";
import { initWebSocketServer } from "./game/ws-server";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// Health check for Railway
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

export default app;

// Initialize HTTP server with WebSocket support
async function startServer() {
  const { serve } = await import("@hono/node-server");
  const port = parseInt(process.env.PORT || "3000");

  if (env.isProduction) {
    const { serveStaticFiles } = await import("./lib/vite");
    serveStaticFiles(app);
  }

  const server = serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`WebSocket available on ws://localhost:${port}/ws`);
  });

  // Initialize WebSocket server attached to the same HTTP server
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initWebSocketServer(server as any);
}

// Always start the server (both dev and production)
startServer().catch(console.error);
