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

export const AVATARS = [
  "/assets/avatar-robot.png",
  "/assets/avatar-cat.png",
  "/assets/avatar-alien.png",
  "/assets/avatar-ninja.png",
  "/assets/avatar-pirate.png",
  "/assets/avatar-astronaut.png",
  "/assets/avatar-dragon.png",
  "/assets/avatar-unicorn.png",
];

export const BOT_NAMES = ["Bot-Alpha", "Bot-Beta", "Bot-Gamma", "Bot-Delta", "Bot-Epsilon", "Bot-Zeta", "Bot-Omega"];
