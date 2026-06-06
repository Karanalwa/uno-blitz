import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { createRoom, joinRoom, getRoom, toggleReady, leaveRoom } from "./game/room-manager";

export const roomRouter = createRouter({
  create: publicQuery
    .input(
      z.object({
        name: z.string().max(50).optional(),
        maxPlayers: z.number().min(2).max(8).default(4),
        mode: z.enum(["classic", "quick"]).default("classic"),
        turnTimer: z.number().min(10).max(120).default(30),
        password: z.string().max(20).optional(),
      })
    )
    .mutation(({ input, ctx }) => {
      const userId = ctx.user?.id ? String(ctx.user.id) : `guest_${Date.now()}`;
      const userName = ctx.user?.name || `Guest-${Math.floor(Math.random() * 9999)}`;

      const { room, playerId } = createRoom(
        {
          name: input.name || `${userName}'s Room`,
          maxPlayers: input.maxPlayers,
          mode: input.mode,
          turnTimer: input.turnTimer,
          password: input.password,
        },
        { userId, username: userName, avatar: ctx.user?.avatar || undefined }
      );

      return { roomId: room.id, code: room.code, name: room.settings.name, playerId };
    }),

  join: publicQuery
    .input(
      z.object({
        code: z.string().length(6),
        password: z.string().optional(),
      })
    )
    .mutation(({ input, ctx }) => {
      const userId = ctx.user?.id ? String(ctx.user.id) : `guest_${Date.now()}`;
      const userName = ctx.user?.name || `Guest-${Math.floor(Math.random() * 9999)}`;

      const result = joinRoom(input.code, { userId, username: userName, avatar: ctx.user?.avatar || undefined });

      if (!result) {
        throw new Error("Room not found, full, or game already started");
      }

      const { room, playerId } = result;
      const players = Array.from(room.players.values()).map((p) => ({
        id: p.id,
        username: p.username,
        avatar: p.avatar,
        isReady: p.isReady,
        isHost: p.isHost,
      }));

      return { roomId: room.id, code: room.code, name: room.settings.name, playerId, players };
    }),

  get: publicQuery
    .input(z.object({ roomId: z.string() }))
    .query(({ input }) => {
      const room = getRoom(input.roomId);
      if (!room) throw new Error("Room not found");

      const players = Array.from(room.players.values()).map((p) => ({
        id: p.id,
        username: p.username,
        avatar: p.avatar,
        isReady: p.isReady,
        isHost: p.isHost,
        cardCount: p.cardCount,
        score: p.score,
      }));

      return { room, players };
    }),

  leave: publicQuery
    .input(z.object({ roomId: z.string() }))
    .mutation(({ input, ctx }) => {
      const userId = ctx.user?.id ? String(ctx.user.id) : "";
      leaveRoom(input.roomId, userId);
      return { success: true };
    }),

  toggleReady: publicQuery
    .input(z.object({ roomId: z.string() }))
    .mutation(({ input, ctx }) => {
      const userId = ctx.user?.id ? String(ctx.user.id) : "";
      const isReady = toggleReady(input.roomId, userId);
      return { isReady };
    }),
});
