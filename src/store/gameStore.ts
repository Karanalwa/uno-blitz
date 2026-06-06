import { create } from "zustand";
import type { Card, CardColor } from "../../api/game/types";
import type { GameSettings } from "@/engine/types";
import { initGame, playCard, handleDraw, handlePass, handleDeclareUno, checkMatchEnd, startNewRound, getBotPlay } from "@/engine/uno-engine";

interface PlayerInfo {
  id: string;
  username: string;
  avatar: string;
  cardCount: number;
  score: number;
  declaredUno: boolean;
  isHost: boolean;
  isReady: boolean;
  hand?: Card[];
}

export interface GameStore {
  ws: WebSocket | null;
  connected: boolean;
  connectError: string | null;
  playerId: string | null;
  username: string;
  roomId: string | null;
  roomCode: string | null;
  roomName: string;
  isHost: boolean;
  isReady: boolean;
  players: PlayerInfo[];
  phase: string;
  gamePhase: string;
  myHand: Card[];
  topCard: Card | null;
  activeColor: CardColor;
  currentPlayerId: string;
  isMyTurn: boolean;
  direction: "clockwise" | "counter_clockwise";
  turnTimer: number;
  turnTimeLeft: number;
  lastAction: string;
  roundNumber: number;
  mode: string;
  showColorPicker: boolean;
  pendingCardIndex: number | null;
  roundScores: any[] | null;
  cumulativeScores: any[] | null;
  matchWinner: string | null;
  finalScores: any[] | null;
  messages: Array<{ playerId: string; username: string; message: string; timestamp: number }>;
  gameMode: "multiplayer" | "solo";
  settings: GameSettings;
  gameState: any;

  // Actions
  connect: () => void;
  disconnect: () => void;
  createRoom: (settings: any, name: string) => void;
  joinRoom: (code: string, name: string) => void;
  toggleReady: () => void;
  startGame: () => void;
  leaveRoom: () => void;
  playCard: (cardIndex: number, chosenColor?: CardColor) => void;
  drawCard: () => void;
  declareUno: () => void;
  catchPlayer: (targetId: string) => void;
  passTurn: () => void;
  selectColor: (color: CardColor) => void;
  sendChat: (message: string) => void;
  reset: () => void;
  setPlayerName: (name: string) => void;
  setPlayerAvatar: (avatar: string) => void;
  setSettings: (s: Partial<GameSettings>) => void;
  startLocalGame: () => void;
  playMyCard: (cardIndex: number, chosenColor?: CardColor) => void;
  drawMyCard: () => void;
  passMyTurn: () => void;
  declareMyUno: () => void;
  selectMyColor: (color: CardColor) => void;
  startNextRound: () => void;
  resetGame: () => void;
  executeBotTurn: () => void;
  _set: (partial: Partial<GameStore>) => void;
}

const baseState = {
  ws: null as WebSocket | null,
  connected: false,
  connectError: null as string | null,
  playerId: null as string | null,
  username: localStorage.getItem("uno_username") || "",
  roomId: null as string | null,
  roomCode: null as string | null,
  roomName: "",
  isHost: false,
  isReady: false,
  players: [] as PlayerInfo[],
  phase: "menu",
  gamePhase: "waiting",
  myHand: [] as Card[],
  topCard: null as Card | null,
  activeColor: "red" as CardColor,
  currentPlayerId: "",
  isMyTurn: false,
  direction: "clockwise" as "clockwise" | "counter_clockwise",
  turnTimer: 30,
  turnTimeLeft: 30,
  lastAction: "",
  roundNumber: 1,
  mode: "classic",
  showColorPicker: false,
  pendingCardIndex: null as number | null,
  roundScores: null as any[] | null,
  cumulativeScores: null as any[] | null,
  matchWinner: null as string | null,
  finalScores: null as any[] | null,
  messages: [] as Array<{ playerId: string; username: string; message: string; timestamp: number }>,
  gameMode: "multiplayer" as "multiplayer" | "solo",
  settings: { playerCount: 4, botCount: 3, mode: "classic" as "classic" | "quick", turnTimer: 30 },
  gameState: null as any,
};

// Backend WebSocket endpoint. In local dev connect to the same host; in
// production connect to the Railway backend (the Vercel frontend has no /ws).
const WS_BACKEND_URL = "wss://uno-blitz-production.up.railway.app";

function getWsUrl(): string {
  const host = window.location.host;
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
  if (isLocal) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${host}/ws`;
  }
  return `${WS_BACKEND_URL}/ws`;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...baseState,

  _set: (partial) => set(partial),

  connect: () => {
    const state = get();
    if (state.ws?.readyState === WebSocket.OPEN) return;
    try {
      const wsUrl = getWsUrl();
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => { set({ connected: true, connectError: null }); };
      ws.onmessage = (event) => {
        try { handleWsMessage(JSON.parse(event.data), set, get); } catch { /* ignore */ }
      };
      ws.onclose = () => { set({ connected: false, ws: null }); };
      ws.onerror = () => { set({ connectError: "Cannot connect to game server", connected: false }); };
      set({ ws });
    } catch {
      set({ connectError: "Failed to connect" });
    }
  },

  disconnect: () => {
    const ws = get().ws;
    if (ws) { ws.close(); set({ ws: null, connected: false }); }
  },

  createRoom: (settings, name) => {
    const ws = get().ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    localStorage.setItem("uno_username", name);
    set({ username: name });
    ws.send(JSON.stringify({ type: "create_room", name: settings.name, maxPlayers: settings.maxPlayers, mode: settings.mode, turnTimer: settings.turnTimer, username: name }));
  },

  joinRoom: (code, name) => {
    const ws = get().ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    localStorage.setItem("uno_username", name);
    set({ username: name });
    ws.send(JSON.stringify({ type: "join_room", code, username: name }));
  },

  toggleReady: () => {
    const { ws, roomId } = get();
    if (!ws || !roomId) return;
    ws.send(JSON.stringify({ type: "ready_toggle" }));
  },

  startGame: () => {
    const { ws, roomId } = get();
    if (!ws || !roomId) return;
    ws.send(JSON.stringify({ type: "start_game" }));
  },

  leaveRoom: () => {
    const { ws, roomId } = get();
    if (ws && roomId) ws.send(JSON.stringify({ type: "leave_room" }));
    set({ ...baseState });
  },

  playCard: (cardIndex, chosenColor) => {
    const { ws, roomId } = get();
    if (!ws || !roomId) return;
    ws.send(JSON.stringify({ type: "play_card", cardIndex, chosenColor }));
  },

  drawCard: () => {
    const { ws, roomId } = get();
    if (!ws || !roomId) return;
    ws.send(JSON.stringify({ type: "draw_card" }));
  },

  declareUno: () => {
    const { ws, roomId } = get();
    if (!ws || !roomId) return;
    ws.send(JSON.stringify({ type: "declare_uno" }));
  },

  catchPlayer: (targetId) => {
    const { ws, roomId } = get();
    if (!ws || !roomId) return;
    ws.send(JSON.stringify({ type: "catch_player", targetPlayerId: targetId }));
  },

  passTurn: () => {
    const { ws, roomId } = get();
    if (!ws || !roomId) return;
    ws.send(JSON.stringify({ type: "pass_turn" }));
  },

  selectColor: (color) => {
    const { ws, roomId, pendingCardIndex } = get();
    if (!ws || !roomId || pendingCardIndex === null) return;
    ws.send(JSON.stringify({ type: "play_card", cardIndex: pendingCardIndex, chosenColor: color }));
    set({ showColorPicker: false, pendingCardIndex: null });
  },

  sendChat: (message) => {
    const { ws, roomId } = get();
    if (!ws || !roomId) return;
    ws.send(JSON.stringify({ type: "chat", message }));
  },

  reset: () => set({ ...baseState }),

  setPlayerName: (name) => { localStorage.setItem("uno_username", name); set({ username: name }); },
  setPlayerAvatar: (avatar) => { localStorage.setItem("uno_playerAvatar", avatar); },
  setSettings: (s) => set((state) => ({ settings: { ...state.settings, ...s } })),

  startLocalGame: () => {
    const g = get();
    const settings: GameSettings = { playerCount: 1 + g.settings.botCount, botCount: g.settings.botCount, mode: g.settings.mode, turnTimer: g.settings.turnTimer };
    const state = initGame(settings, g.username || "Player", localStorage.getItem("uno_playerAvatar") || "/assets/avatar-robot.png") as any;
    const human = state.players[0];
    set({
      gameState: state, phase: "playing", gameMode: "solo", showColorPicker: false, pendingCardIndex: null,
      roundScores: null, matchWinner: null, finalScores: null,
      myHand: human.hand, isMyTurn: state.currentPlayerIndex === 0,
      topCard: state.discardPile[state.discardPile.length - 1],
      activeColor: state.activeColor, currentPlayerId: state.players[state.currentPlayerIndex]?.id || "",
      direction: state.direction, turnTimer: state.turnTimer, turnTimeLeft: state.turnTimeLeft,
      lastAction: state.lastAction, roundNumber: state.roundNumber, mode: state.mode as string,
      players: state.players.map((p: any) => ({ id: p.id, username: p.username, avatar: p.avatar, cardCount: p.cardCount, score: p.score, declaredUno: p.declaredUno, isHost: p.isHost, isReady: p.isReady })),
    });
    if (state.currentPlayerIndex !== 0) setTimeout(() => get().executeBotTurn(), 1000);
  },

  playMyCard: (cardIndex, chosenColor) => {
    const gs = get().gameState;
    if (!gs) return;
    const result = playCard(gs, gs.currentPlayerIndex, cardIndex, chosenColor);
    if (!result.success) return;
    if (result.roundEnd) {
      const mr = checkMatchEnd(gs);
      if (mr) { set({ phase: "match_end", matchWinner: mr.winnerName, finalScores: mr.finalScores, myHand: gs.players[0].hand, topCard: gs.discardPile[gs.discardPile.length - 1], activeColor: gs.activeColor, lastAction: `${mr.winnerName} wins!` }); return; }
      set({ phase: "round_end", roundScores: result.roundEnd.scores, cumulativeScores: result.roundEnd.cumulative, myHand: gs.players[0].hand, lastAction: `${result.roundEnd.winnerName} wins round!` });
      setTimeout(() => get().startNextRound(), 4000); return;
    }
    const h = gs.players[0]; const imt = gs.currentPlayerIndex === 0;
    set({ myHand: h.hand, isMyTurn: imt, topCard: gs.discardPile[gs.discardPile.length - 1], activeColor: gs.activeColor, currentPlayerId: gs.players[gs.currentPlayerIndex]?.id || "", lastAction: result.action || "" });
    if (!imt) setTimeout(() => get().executeBotTurn(), 1000);
  },

  drawMyCard: () => {
    const gs = get().gameState;
    if (!gs || gs.currentPlayerIndex !== 0) return;
    handleDraw(gs, 0);
    const h = gs.players[0]; const imt = gs.currentPlayerIndex === 0;
    set({ myHand: h.hand, isMyTurn: imt, topCard: gs.discardPile[gs.discardPile.length - 1], activeColor: gs.activeColor, lastAction: gs.lastAction });
    if (!imt) setTimeout(() => get().executeBotTurn(), 1000);
  },

  passMyTurn: () => {
    const gs = get().gameState;
    if (!gs || gs.currentPlayerIndex !== 0) return;
    handlePass(gs, 0);
    set({ isMyTurn: false, lastAction: gs.lastAction });
    setTimeout(() => get().executeBotTurn(), 1000);
  },

  declareMyUno: () => {
    const gs = get().gameState;
    if (!gs) return;
    handleDeclareUno(gs, 0);
    set({ lastAction: gs.lastAction });
  },

  selectMyColor: (color) => {
    const pci = get().pendingCardIndex;
    if (pci === null) return;
    set({ showColorPicker: false, pendingCardIndex: null });
    get().playMyCard(pci, color);
  },

  startNextRound: () => {
    const gs = get().gameState;
    if (!gs) return;
    startNewRound(gs);
    const h = gs.players[0];
    set({ phase: "playing", roundScores: null, matchWinner: null, myHand: h.hand, isMyTurn: gs.currentPlayerIndex === 0, topCard: gs.discardPile[gs.discardPile.length - 1], activeColor: gs.activeColor, lastAction: gs.lastAction, roundNumber: gs.roundNumber });
    if (gs.currentPlayerIndex !== 0) setTimeout(() => get().executeBotTurn(), 1000);
  },

  resetGame: () => {
    set({ phase: "menu", gameState: null, showColorPicker: false, pendingCardIndex: null, roundScores: null, cumulativeScores: null, matchWinner: null, finalScores: null, myHand: [], isMyTurn: false, topCard: null, activeColor: "red", currentPlayerId: "", lastAction: "", roomId: null, roomCode: null, players: [] });
  },

  executeBotTurn: () => {
    const gs = get().gameState;
    if (!gs || gs.phase !== "playing") return;
    const cpi = gs.currentPlayerIndex;
    const p = gs.players[cpi];
    if (!p?.isBot) return;
    const d = getBotPlay(gs, cpi);
    if (d.action === "draw") { handleDraw(gs, cpi); }
    else if (d.action === "pass") { handlePass(gs, cpi); }
    else if (d.action === "play") {
      const r = playCard(gs, cpi, d.cardIndex, d.chosenColor);
      if (r.roundEnd) {
        const mr = checkMatchEnd(gs);
        if (mr) { set({ phase: "match_end", matchWinner: mr.winnerName, finalScores: mr.finalScores, myHand: gs.players[0].hand, topCard: gs.discardPile[gs.discardPile.length - 1], activeColor: gs.activeColor, lastAction: `${mr.winnerName} wins!` }); return; }
        set({ phase: "round_end", roundScores: r.roundEnd!.scores, cumulativeScores: r.roundEnd!.cumulative, myHand: gs.players[0].hand, lastAction: `${r.roundEnd!.winnerName} wins round!` });
        setTimeout(() => get().startNextRound(), 4000); return;
      }
    }
    const imt = gs.currentPlayerIndex === 0;
    set({ isMyTurn: imt, topCard: gs.discardPile[gs.discardPile.length - 1], activeColor: gs.activeColor, currentPlayerId: gs.players[gs.currentPlayerIndex]?.id || "", lastAction: gs.lastAction, myHand: gs.players[0].hand });
    if (!imt) setTimeout(() => get().executeBotTurn(), 1200);
  },
}));

function handleWsMessage(msg: any, set: any, get: any) {
  const state = get();
  switch (msg.type) {
    case "connected": break;
    case "room_created": {
      set({ playerId: msg.playerId, roomId: msg.roomId, roomCode: msg.code, isHost: true, phase: "lobby" });
      break;
    }
    case "room_joined": {
      set({ playerId: msg.playerId, roomId: msg.roomId, roomCode: msg.code, isHost: false, phase: "lobby" });
      break;
    }
    case "room_update": {
      const me = msg.players.find((p: any) => p.id === state.playerId);
      set({ players: msg.players, roomName: msg.roomName, isHost: msg.hostId === state.playerId, isReady: me?.isReady || false });
      break;
    }
    case "game_state": {
      const gs = msg.state;
      const myPlayer = gs.players.find((p: any) => p.id === state.playerId);
      set({
        phase: "playing", gamePhase: gs.phase, players: gs.players,
        myHand: myPlayer?.hand || [], topCard: gs.topCard, activeColor: gs.activeColor,
        currentPlayerId: gs.currentPlayerId, isMyTurn: gs.isYourTurn,
        direction: gs.direction, turnTimer: gs.turnTimer, turnTimeLeft: gs.turnTimeLeft,
        lastAction: gs.lastAction, roundNumber: gs.roundNumber, mode: gs.mode,
      });
      break;
    }
    case "round_end": {
      set({ phase: "round_end", roundScores: msg.scores, cumulativeScores: msg.cumulativeScores, lastAction: `${msg.winnerUsername} wins the round!` });
      break;
    }
    case "match_end": {
      set({ phase: "match_end", matchWinner: msg.winnerUsername, finalScores: msg.finalScores, lastAction: `${msg.winnerUsername} wins the match!` });
      break;
    }
    case "chat": {
      set((s: GameStore) => ({ messages: [...s.messages.slice(-50), { playerId: msg.playerId, username: msg.username, message: msg.message, timestamp: msg.timestamp }] }));
      break;
    }
    case "ready_toggled": { set({ isReady: msg.isReady }); break; }
    case "left_room": { set({ ...baseState }); break; }
    case "error": { console.error("[WS] Server error:", msg.message); break; }
    default: console.log("[WS] Unknown:", msg);
  }
}
