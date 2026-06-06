import { authRouter } from "./auth-router";
import { roomRouter } from "./room-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  room: roomRouter,
});

export type AppRouter = typeof appRouter;
