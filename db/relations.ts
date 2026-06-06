import { relations } from "drizzle-orm";
import { users, userStats, leaderboard, matchHistory, matchPlayers } from "./schema";

export const usersRelations = relations(users, ({ one }) => ({
  stats: one(userStats, { fields: [users.id], references: [userStats.userId] }),
  leaderboard: one(leaderboard, { fields: [users.id], references: [leaderboard.userId] }),
}));

export const matchHistoryRelations = relations(matchHistory, ({ many }) => ({
  players: many(matchPlayers),
}));
