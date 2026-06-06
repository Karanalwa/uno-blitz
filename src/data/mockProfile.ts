// Static/mock data for the cosmetic dashboard screens (no backend behind these).
import { AVATARS } from "@/engine/types";

export const PROFILE = {
  name: "AlexGamer",
  level: 28,
  xp: 2850,
  xpMax: 4200,
  coins: 12450,
  gems: 1250,
  stats: { gamesPlayed: 512, wins: 312, winRate: "60.9%", longestStreak: 12, unoCalls: 156, drawFours: 98 },
};

export const LEADERBOARD = [
  { rank: 1, name: "SarahChamp", wins: 15230, winRate: "72.4%" },
  { rank: 2, name: "AlexGamer", wins: 12450, winRate: "60.9%", me: true },
  { rank: 3, name: "KingUNO", wins: 11200, winRate: "59.1%" },
  { rank: 4, name: "PlayMaster", wins: 9850, winRate: "57.3%" },
  { rank: 5, name: "CardWizard", wins: 8410, winRate: "54.8%" },
];

export const FRIENDS = [
  { name: "Sophia", status: "Online", avatar: AVATARS[1], action: "INVITE" },
  { name: "William", status: "Online", avatar: AVATARS[2], action: "INVITE" },
  { name: "Emma", status: "In Game", avatar: AVATARS[4], action: "JOIN" },
  { name: "James", status: "Online", avatar: AVATARS[3], action: "INVITE" },
  { name: "Noah", status: "Offline", avatar: AVATARS[6], action: "INVITE" },
];

export const HISTORY = [
  { result: "WIN", players: "Sophia, William, Emma", when: "2m ago", count: 4 },
  { result: "WIN", players: "James, Noah, Sophia", when: "12m ago", count: 4 },
  { result: "LOSE", players: "William, Emma, James", when: "25m ago", count: 4 },
  { result: "WIN", players: "Noah, Sophia, Emma", when: "40m ago", count: 4 },
  { result: "WIN", players: "James, William, Noah", when: "1h ago", count: 4 },
];

export const ACHIEVEMENTS = [
  { name: "UNO Master", desc: "Call UNO 100 times", reward: 1000, progress: 1, tier: "gold" },
  { name: "Card Collector", desc: "Collect 200 cards", reward: 500, progress: 0.7, tier: "silver" },
  { name: "Win Streak", desc: "Win 10 matches in a row", reward: 800, progress: 0.5, tier: "bronze" },
  { name: "Draw Four King", desc: "Play 50 Draw Four cards", reward: 600, progress: 0.4, tier: "purple" },
];

export const DAILY_REWARDS = [
  { day: 1, amount: "500", claimed: true },
  { day: 2, amount: "10", claimed: true },
  { day: 3, amount: "1", claimed: false, today: true },
  { day: 4, amount: "800" },
  { day: 5, amount: "15" },
  { day: 6, amount: "1" },
  { day: 7, amount: "2K" },
];
