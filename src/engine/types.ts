export type CardColor = "red" | "blue" | "green" | "yellow";
export type CardType = "number" | "skip" | "reverse" | "draw2" | "wild" | "wild4";

export interface Card {
  id: string;
  color: CardColor | "wild";
  type: CardType;
  value: number;
  display: string;
}

export interface Player {
  id: string;
  username: string;
  avatar: string;
  hand: Card[];
  cardCount: number;
  score: number;
  declaredUno: boolean;
  isActive: boolean;
  isHost: boolean;
  isReady: boolean;
  isBot: boolean;
}

export type GamePhase = "menu" | "setup" | "playing" | "round_end" | "match_end";
export type GameDirection = "clockwise" | "counter_clockwise";

export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  direction: GameDirection;
  activeColor: CardColor;
  discardPile: Card[];
  drawPile: Card[];
  turnTimer: number;
  turnTimeLeft: number;
  lastAction: string;
  roundNumber: number;
  targetScore: number;
  winner?: string;
}

export interface GameSettings {
  playerCount: number;
  botCount: number;
  mode: "classic" | "quick";
  turnTimer: number;
}

export const CARD_COLORS: CardColor[] = ["red", "blue", "green", "yellow"];

// Real-person avatar photos (pravatar.cc provides realistic face portraits).
export const AVATARS = [
  "https://i.pravatar.cc/200?img=12",
  "https://i.pravatar.cc/200?img=5",
  "https://i.pravatar.cc/200?img=33",
  "https://i.pravatar.cc/200?img=47",
  "https://i.pravatar.cc/200?img=32",
  "https://i.pravatar.cc/200?img=26",
  "https://i.pravatar.cc/200?img=16",
  "https://i.pravatar.cc/200?img=68",
];

export const DEFAULT_AVATAR = AVATARS[0];

export const BOT_NAMES = ["Alex", "Maya", "Liam", "Sofia", "Noah", "Emma", "Ethan"];
