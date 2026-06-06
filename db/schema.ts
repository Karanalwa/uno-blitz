import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  boolean,
  bigint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const userStats = mysqlTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  totalMatches: int("total_matches").default(0).notNull(),
  wins: int("wins").default(0).notNull(),
  losses: int("losses").default(0).notNull(),
  totalPoints: int("total_points").default(0).notNull(),
  highestRound: int("highest_round").default(0).notNull(),
  unoCatches: int("uno_catches").default(0).notNull(),
  timesCaught: int("times_caught").default(0).notNull(),
  rankTier: varchar("rank_tier", { length: 20 }).default("Bronze").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserStats = typeof userStats.$inferSelect;

export const leaderboard = mysqlTable("leaderboard", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull().unique(),
  username: varchar("username", { length: 255 }).notNull(),
  wins: int("wins").default(0).notNull(),
  totalPoints: int("total_points").default(0).notNull(),
  unoCatches: int("uno_catches").default(0).notNull(),
  rankTier: varchar("rank_tier", { length: 20 }).default("Bronze").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type LeaderboardEntry = typeof leaderboard.$inferSelect;

export const matchHistory = mysqlTable("match_history", {
  id: serial("id").primaryKey(),
  roomCode: varchar("room_code", { length: 6 }).notNull(),
  winnerId: bigint("winner_id", { mode: "number", unsigned: true }),
  winnerName: varchar("winner_name", { length: 255 }),
  mode: varchar("mode", { length: 20 }).default("classic").notNull(),
  playerCount: int("player_count").default(2).notNull(),
  durationSeconds: int("duration_seconds").default(0),
  endedAt: timestamp("endedAt").defaultNow().notNull(),
});

export type MatchHistory = typeof matchHistory.$inferSelect;

export const matchPlayers = mysqlTable("match_players", {
  id: serial("id").primaryKey(),
  matchId: bigint("matchId", { mode: "number", unsigned: true }).notNull(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  username: varchar("username", { length: 255 }).notNull(),
  score: int("score").default(0).notNull(),
  rankPosition: int("rank_position").default(0).notNull(),
  isWinner: boolean("is_winner").default(false).notNull(),
});

export type MatchPlayer = typeof matchPlayers.$inferSelect;
