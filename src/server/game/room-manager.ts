import type { WebSocket } from "ws";
import type { Player, Room, RoomSettings, GameState } from "./types";
import { initGameState, playCard, drawCards, endRound, shouldEndMatch, getMatchWinner, startNewRound, checkUnoViolation, hasPlayableCard } from "./uno-engine";
import { serializeGameState } from "./uno-engine";

interface SocketData {
  socket: WebSocket;
  playerId: string;
  roomId: string;
  username: string;
}

const rooms = new Map<string, Room>();
const sockets = new Map<string, SocketData>(); // socketId -> SocketData
const playerToSocket = new Map<string, string>(); // playerId -> socketId

const avatars = [
  "/assets/avatar-robot.png",
  "/assets/avatar-cat.png",
  "/assets/avatar-alien.png",
  "/assets/avatar-ninja.png",
  "/assets/avatar-pirate.png",
  "/assets/avatar-astronaut.png",
  "/assets/avatar-dragon.png",
  "/assets/avatar-unicorn.png",
];

function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createRoom(settings: RoomSettings, hostData: { userId: string; username: string; avatar?: string }): { room: Room; playerId: string } {
  const code = generateRoomCode();
  const roomId = generateId();
  const hostId = hostData.userId;

  const host: Player = {
    id: hostId,
    username: hostData.username,
    avatar: hostData.avatar || avatars[0],
    hand: [],
    cardCount: 0,
    score: 0,
    declaredUno: false,
    isActive: false,
    isHost: true,
    isReady: true,
    isConnected: true,
  };

  const room: Room = {
    id: roomId,
    code,
    settings: {
      ...settings,
      name: settings.name || `${hostData.username}'s Room`,
    },
    hostId,
    players: new Map([[hostId, host]]),
    createdAt: Date.now(),
  };

  rooms.set(roomId, room);
  return { room, playerId: hostId };
}

export function joinRoom(code: string, playerData: { userId: string; username: string; avatar?: string }): { room: Room; playerId: string } | null {
  const room = Array.from(rooms.values()).find((r) => r.code === code);
  if (!room) return null;
  if (room.gameState && room.gameState.phase === "playing") return null;
  if (room.players.size >= room.settings.maxPlayers) return null;

  const playerId = playerData.userId;
  const avatarIndex = room.players.size % avatars.length;

  const player: Player = {
    id: playerId,
    username: playerData.username,
    avatar: playerData.avatar || avatars[avatarIndex],
    hand: [],
    cardCount: 0,
    score: 0,
    declaredUno: false,
    isActive: false,
    isHost: false,
    isReady: false,
    isConnected: true,
  };

  room.players.set(playerId, player);
  return { room, playerId };
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function getRoomByCode(code: string): Room | undefined {
  return Array.from(rooms.values()).find((r) => r.code === code);
}

export function leaveRoom(roomId: string, playerId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;

  room.players.delete(playerId);

  // Reassign host if host leaves
  if (room.hostId === playerId && room.players.size > 0) {
    const newHost = room.players.values().next().value;
    if (newHost) {
      room.hostId = newHost.id;
      newHost.isHost = true;
    }
  }

  // If game is in progress, mark player as disconnected
  if (room.gameState) {
    const player = room.gameState.players.find((p) => p.id === playerId);
    if (player) {
      player.isConnected = false;
    }
  }

  // Clean up empty rooms
  if (room.players.size === 0) {
    rooms.delete(roomId);
  }

  // Clean up socket mapping
  const socketId = playerToSocket.get(playerId);
  if (socketId) {
    playerToSocket.delete(playerId);
    sockets.delete(socketId);
  }
}

export function toggleReady(roomId: string, playerId: string): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;
  const player = room.players.get(playerId);
  if (!player) return false;
  player.isReady = !player.isReady;
  return player.isReady;
}

export function startGame(roomId: string): GameState | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  const readyPlayers = Array.from(room.players.values()).filter((p) => p.isReady);
  if (readyPlayers.length < 2) return null;

  room.gameState = initGameState(room);
  return room.gameState;
}

export function registerSocket(socketId: string, socket: WebSocket, playerId: string, roomId: string, username: string): void {
  sockets.set(socketId, { socket, playerId, roomId, username });
  playerToSocket.set(playerId, socketId);
}

export function unregisterSocket(socketId: string): void {
  const data = sockets.get(socketId);
  if (data) {
    playerToSocket.delete(data.playerId);
    sockets.delete(socketId);
    // Mark player as disconnected but don't remove from room
    const room = rooms.get(data.roomId);
    if (room) {
      const player = room.players.get(data.playerId);
      if (player) {
        player.isConnected = false;
      }
      if (room.gameState) {
        const gamePlayer = room.gameState.players.find((p) => p.id === data.playerId);
        if (gamePlayer) gamePlayer.isConnected = false;
      }
    }
  }
}

export function broadcastToRoom(roomId: string, message: object): void {
  const room = rooms.get(roomId);
  if (!room) return;

  const messageStr = JSON.stringify(message);
  for (const [, data] of sockets) {
    if (data.roomId === roomId && data.socket.readyState === 1) {
      data.socket.send(messageStr);
    }
  }
}

export function sendToPlayer(playerId: string, message: object): void {
  const socketId = playerToSocket.get(playerId);
  if (!socketId) return;
  const data = sockets.get(socketId);
  if (data && data.socket.readyState === 1) {
    data.socket.send(JSON.stringify(message));
  }
}

export function getSocketCount(): number {
  return sockets.size;
}

export function getRoomCount(): number {
  return rooms.size;
}

// Game action handlers
export function handlePlayCard(roomId: string, playerId: string, cardIndex: number, chosenColor?: any): { success: boolean; message?: string } {
  const room = rooms.get(roomId);
  if (!room || !room.gameState) return { success: false, message: "No active game" };

  const state = room.gameState;
  if (state.phase !== "playing") return { success: false, message: "Game not in playing phase" };

  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) return { success: false, message: "Player not found" };
  if (playerIndex !== state.currentPlayerIndex) return { success: false, message: "Not your turn" };

  const result = playCard(state, playerIndex, cardIndex, chosenColor);

  if (result.success) {
    // Check for round win
    if (result.message === "round_win") {
      const roundResult = endRound(state);
      state.phase = "round_end";
      state.winner = roundResult.winnerId;
      state.lastAction = `${roundResult.winnerUsername} wins the round! +${roundResult.roundScores.find((s) => s.roundWinner)?.points || 0} points`;

      // Check for match end
      if (shouldEndMatch(state)) {
        const matchResult = getMatchWinner(state);
        state.phase = "match_end";
        state.winner = matchResult.winnerId;
        state.lastAction = `${matchResult.winnerUsername} wins the match!`;

        broadcastToRoom(roomId, {
          type: "match_end",
          winnerId: matchResult.winnerId,
          winnerUsername: matchResult.winnerUsername,
          finalScores: matchResult.finalScores,
        });
        return { success: true };
      }

      broadcastToRoom(roomId, {
        type: "round_end",
        winnerId: roundResult.winnerId,
        winnerUsername: roundResult.winnerUsername,
        scores: roundResult.roundScores,
        cumulativeScores: roundResult.cumulativeScores,
        nextRoundIn: 5,
      });

      // Auto-start next round after 5 seconds
      setTimeout(() => {
        const currentRoom = rooms.get(roomId);
        if (currentRoom && currentRoom.gameState && currentRoom.gameState.phase === "round_end") {
          currentRoom.gameState = startNewRound(currentRoom.gameState);
          broadcastGameState(currentRoom.id);
        }
      }, 5000);

      return { success: true };
    }

    // Normal turn
    broadcastGameState(roomId);

    // Check for UNO violation
    const unoCheck = checkUnoViolation(state);
    if (unoCheck.caught && unoCheck.targetId) {
      broadcastToRoom(roomId, {
        type: "action_resolved",
        action: "uno_caught",
        targetPlayerId: unoCheck.targetId,
        drawCount: 2,
      });
    }

    return { success: true };
  }

  return { success: false, message: result.message };
}

export function handleDrawCard(roomId: string, playerId: string): { success: boolean; message?: string } {
  const room = rooms.get(roomId);
  if (!room || !room.gameState) return { success: false, message: "No active game" };

  const state = room.gameState;
  if (state.phase !== "playing") return { success: false, message: "Game not in playing phase" };

  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) return { success: false, message: "Player not found" };
  if (playerIndex !== state.currentPlayerIndex) return { success: false, message: "Not your turn" };

  const player = state.players[playerIndex];
  const topCard = state.discardPile[state.discardPile.length - 1];

  // Check if player has playable cards
  if (hasPlayableCard(player, topCard, state.activeColor)) {
    return { success: false, message: "You have playable cards - you must play" };
  }

  // Draw a card
  const drawn = drawCards(state, playerIndex, 1);

  if (drawn.length === 0) {
    // No cards left, skip turn
    state.currentPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.direction, state.players.length);
    state.turnTimeLeft = state.turnTimer;
    state.lastAction = `${player.username} had to pass (no cards left in deck)`;
  } else {
    const drawnCard = drawn[0];
    // Check if drawn card is playable
    if (canPlayDrawnCard(drawnCard, topCard, state.activeColor)) {
      state.lastAction = `${player.username} drew a card (playable!)`;
    } else {
      // Auto-pass if drawn card is not playable
      state.currentPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.direction, state.players.length);
      state.turnTimeLeft = state.turnTimer;
      state.lastAction = `${player.username} drew and passed`;
    }
  }

  broadcastGameState(roomId);
  return { success: true };
}

function canPlayDrawnCard(card: any, topCard: any, activeColor: any): boolean {
  if (card.type === "wild" || card.type === "wild4") return true;
  if (card.color === activeColor) return true;
  if (card.type === "number" && topCard.type === "number" && card.value === topCard.value) return true;
  if (card.type !== "number" && card.type === topCard.type) return true;
  return false;
}

function getNextPlayerIndex(current: number, direction: string, playerCount: number, skip = false): number {
  const step = direction === "clockwise" ? 1 : -1;
  let next = current;
  const moves = skip ? 2 : 1;
  for (let i = 0; i < moves; i++) {
    next = (next + step + playerCount) % playerCount;
  }
  return next;
}

export function handleDeclareUno(roomId: string, playerId: string): { success: boolean; message?: string } {
  const room = rooms.get(roomId);
  if (!room || !room.gameState) return { success: false, message: "No active game" };

  const state = room.gameState;
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { success: false, message: "Player not found" };
  if (player.cardCount !== 1) return { success: false, message: "You don't have exactly 1 card" };

  player.declaredUno = true;
  state.lastAction = `${player.username} declared UNO!`;

  broadcastGameState(roomId);
  return { success: true };
}

export function handleCatchPlayer(roomId: string, _catcherId: string, targetId: string): { success: boolean; message?: string } {
  const room = rooms.get(roomId);
  if (!room || !room.gameState) return { success: false, message: "No active game" };

  const state = room.gameState;
  const target = state.players.find((p) => p.id === targetId);
  if (!target) return { success: false, message: "Target not found" };
  if (target.cardCount !== 1) return { success: false, message: "Target doesn't have 1 card" };
  if (target.declaredUno) return { success: false, message: "Target already declared UNO" };

  // Target draws 2 penalty cards
  const targetIndex = state.players.findIndex((p) => p.id === targetId);
  drawCards(state, targetIndex, 2);
  target.declaredUno = true; // Mark as caught

  state.lastAction = `${target.username} was caught! Draws 2!`;

  broadcastToRoom(roomId, {
    type: "action_resolved",
    action: "uno_caught",
    targetPlayerId: targetId,
    drawCount: 2,
  });

  broadcastGameState(roomId);
  return { success: true };
}

export function handlePassTurn(roomId: string, playerId: string): { success: boolean; message?: string } {
  const room = rooms.get(roomId);
  if (!room || !room.gameState) return { success: false, message: "No active game" };

  const state = room.gameState;
  if (state.phase !== "playing") return { success: false, message: "Game not in playing phase" };

  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) return { success: false, message: "Player not found" };
  if (playerIndex !== state.currentPlayerIndex) return { success: false, message: "Not your turn" };

  state.currentPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.direction, state.players.length);
  state.turnTimeLeft = state.turnTimer;
  state.lastAction = `${state.players[playerIndex].username} passed`;

  broadcastGameState(roomId);
  return { success: true };
}

export function broadcastGameState(roomId: string): void {
  const room = rooms.get(roomId);
  if (!room || !room.gameState) return;

  for (const player of room.gameState.players) {
    const serialized = serializeGameState(room.gameState, player.id);
    sendToPlayer(player.id, {
      type: "game_state",
      state: serialized,
    });
  }
}

export function broadcastRoomUpdate(roomId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;

  const players = Array.from(room.players.values()).map((p) => ({
    id: p.id,
    username: p.username,
    avatar: p.avatar,
    isReady: p.isReady,
    isHost: p.isHost,
    cardCount: p.cardCount,
    score: p.score,
  }));

  broadcastToRoom(roomId, {
    type: "room_update",
    players,
    roomName: room.settings.name,
    maxPlayers: room.settings.maxPlayers,
    mode: room.settings.mode,
    hostId: room.hostId,
    gamePhase: room.gameState?.phase || "waiting",
  });
}

// Cleanup old rooms periodically
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms) {
    // Remove rooms that have been empty for 1 hour or ended games for 30 minutes
    if (room.players.size === 0) {
      rooms.delete(roomId);
    } else if (room.gameState?.phase === "match_end" && now - room.createdAt > 30 * 60 * 1000) {
      rooms.delete(roomId);
    }
  }
}, 60 * 1000);
