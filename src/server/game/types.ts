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
  isConnected: boolean;
}

export type GamePhase = "waiting" | "playing" | "round_end" | "match_end";
export type GameDirection = "clockwise" | "counter_clockwise";

export interface GameState {
  phase: GamePhase;
  roomId: string;
  roomCode: string;
  roomName: string;
  players: Player[];
  currentPlayerIndex: number;
  direction: GameDirection;
  activeColor: CardColor;
  discardPile: Card[];
  drawPile: Card[];
  turnTimer: number;
  turnTimeLeft: number;
  drawStack: number;
  lastAction: string;
  roundNumber: number;
  mode: "classic" | "quick";
  maxPlayers: number;
  winner?: string;
}

export interface RoomSettings {
  name: string;
  maxPlayers: number;
  mode: "classic" | "quick";
  turnTimer: number;
  password?: string;
}

export interface Room {
  id: string;
  code: string;
  settings: RoomSettings;
  hostId: string;
  players: Map<string, Player>;
  gameState?: GameState;
  createdAt: number;
}

export type WsClientMessage =
  | { type: "create_room"; name?: string; maxPlayers?: number; mode?: "classic" | "quick"; turnTimer?: number; password?: string; userId?: string; username?: string; avatar?: string }
  | { type: "join_room"; code: string; userId?: string; username?: string; avatar?: string }
  | { type: "play_card"; cardIndex: number; chosenColor?: CardColor }
  | { type: "draw_card" }
  | { type: "declare_uno" }
  | { type: "catch_player"; targetPlayerId: string }
  | { type: "select_color"; color: CardColor }
  | { type: "ready_toggle" }
  | { type: "start_game" }
  | { type: "leave_room" }
  | { type: "challenge" }
  | { type: "pass_turn" }
  | { type: "chat"; message: string };

export type WsServerMessage =
  | { type: "connected"; message: string }
  | { type: "game_state"; state: SerializedGameState }
  | { type: "room_update"; players: any[]; roomName: string; maxPlayers: number; mode: string; hostId: string; gamePhase: string }
  | { type: "room_created"; roomId: string; code: string; playerId: string }
  | { type: "room_joined"; roomId: string; code: string; playerId: string }
  | { type: "ready_toggled"; isReady: boolean }
  | { type: "left_room" }
  | { type: "player_joined"; player: SerializedPlayer }
  | { type: "player_left"; playerId: string }
  | { type: "card_played"; playerId: string; card: Card; chosenColor?: CardColor }
  | { type: "action_resolved"; action: string; targetPlayerId?: string; drawCount?: number }
  | { type: "turn_changed"; currentPlayerId: string; timer: number }
  | { type: "round_end"; winnerId: string; winnerUsername: string; scores: RoundScore[]; cumulativeScores: CumulativeScore[]; nextRoundIn: number }
  | { type: "match_end"; winnerId: string; winnerUsername: string; finalScores: FinalScore[] }
  | { type: "error"; message: string }
  | { type: "chat"; playerId: string; username: string; message: string; timestamp: number };

export interface SerializedPlayer {
  id: string;
  username: string;
  avatar: string;
  cardCount: number;
  hand?: Card[];
  score: number;
  declaredUno: boolean;
  isActive: boolean;
  isHost: boolean;
  isReady: boolean;
}

export interface SerializedGameState {
  phase: GamePhase;
  roomCode: string;
  roomName: string;
  players: SerializedPlayer[];
  currentPlayerId: string;
  direction: GameDirection;
  activeColor: CardColor;
  topCard: Card;
  drawPileCount: number;
  turnTimer: number;
  turnTimeLeft: number;
  lastAction: string;
  roundNumber: number;
  mode: "classic" | "quick";
  isYourTurn: boolean;
  winner?: string;
}

export interface RoundScore {
  playerId: string;
  username: string;
  cardsRemaining: number;
  points: number;
  roundWinner: boolean;
}

export interface CumulativeScore {
  playerId: string;
  score: number;
}

export interface FinalScore {
  playerId: string;
  username: string;
  score: number;
  rank: number;
}
