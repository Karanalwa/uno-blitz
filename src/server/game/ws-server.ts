import type { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import {
  createRoom, joinRoom, getRoom, registerSocket, unregisterSocket,
  startGame, toggleReady, leaveRoom, broadcastToRoom, broadcastRoomUpdate,
  broadcastGameState, handlePlayCard, handleDrawCard, handleDeclareUno,
  handleCatchPlayer, handlePassTurn,
} from "./room-manager";
import type { WsClientMessage } from "./types";

interface ClientInfo {
  socket: WebSocket;
  playerId: string;
  roomId: string;
  username: string;
}

const clients = new Map<WebSocket, ClientInfo>();

export function initWebSocketServer(server: HttpServer): void {
  try {
    const wss = new WebSocketServer({ server, path: "/ws" });

    wss.on("connection", (socket: WebSocket) => {
      console.log("[WS] New connection, total:", wss.clients.size);

      socket.send(JSON.stringify({ type: "connected", message: "Welcome to UNO Blitz!" }));

      socket.on("message", (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as WsClientMessage;
          handleMessage(socket, message);
        } catch (err) {
          console.error("[WS] Invalid message:", err);
          socket.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
        }
      });

      socket.on("close", () => {
        const client = clients.get(socket);
        if (client) {
          unregisterSocketAndNotify(client, socket);
        }
        console.log("[WS] Connection closed, remaining:", wss.clients.size);
      });

      socket.on("error", (err: Error) => {
        console.error("[WS] Socket error:", err.message);
      });
    });

    wss.on("error", (err) => {
      console.error("[WS] Server error:", err);
    });

    console.log("[WS] WebSocket server initialized on path /ws");
  } catch (err) {
    console.error("[WS] Failed to initialize:", err);
  }
}

function handleMessage(socket: WebSocket, message: WsClientMessage): void {
  const client = clients.get(socket);

  switch (message.type) {
    case "create_room": {
      const userId = message.userId || `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const username = message.username || `Guest-${Math.floor(Math.random() * 9999)}`;

      const { room, playerId } = createRoom(
        {
          name: message.name || `${username}'s Room`,
          maxPlayers: message.maxPlayers || 4,
          mode: message.mode || "classic",
          turnTimer: message.turnTimer || 30,
          password: message.password,
        },
        { userId, username, avatar: message.avatar }
      );

      clients.set(socket, { socket, playerId, roomId: room.id, username });
      registerSocket(`${Date.now()}_${Math.random()}`, socket, playerId, room.id, username);

      socket.send(JSON.stringify({
        type: "room_created",
        roomId: room.id,
        code: room.code,
        playerId,
      }));

      broadcastRoomUpdate(room.id);
      break;
    }

    case "join_room": {
      const userId = message.userId || `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const username = message.username || `Guest-${Math.floor(Math.random() * 9999)}`;

      const result = joinRoom(message.code, { userId, username, avatar: message.avatar });

      if (!result) {
        socket.send(JSON.stringify({ type: "error", message: "Room not found, full, or game already started" }));
        return;
      }

      const { room, playerId } = result;
      clients.set(socket, { socket, playerId, roomId: room.id, username });
      registerSocket(`${Date.now()}_${Math.random()}`, socket, playerId, room.id, username);

      socket.send(JSON.stringify({
        type: "room_joined",
        roomId: room.id,
        code: room.code,
        playerId,
      }));

      broadcastRoomUpdate(room.id);
      break;
    }

    case "ready_toggle": {
      if (!client) return;
      const isReady = toggleReady(client.roomId, client.playerId);
      socket.send(JSON.stringify({ type: "ready_toggled", isReady }));
      broadcastRoomUpdate(client.roomId);
      break;
    }

    case "start_game": {
      if (!client) return;
      const room = getRoom(client.roomId);
      if (!room || room.hostId !== client.playerId) {
        socket.send(JSON.stringify({ type: "error", message: "Only host can start" }));
        return;
      }

      const gameState = startGame(client.roomId);
      if (!gameState) {
        socket.send(JSON.stringify({ type: "error", message: "Need at least 2 ready players" }));
        return;
      }

      broadcastGameState(client.roomId);
      break;
    }

    case "play_card": {
      if (!client) return;
      const result = handlePlayCard(client.roomId, client.playerId, message.cardIndex, message.chosenColor);
      if (!result.success) {
        socket.send(JSON.stringify({ type: "error", message: result.message }));
      }
      break;
    }

    case "draw_card": {
      if (!client) return;
      const result = handleDrawCard(client.roomId, client.playerId);
      if (!result.success) {
        socket.send(JSON.stringify({ type: "error", message: result.message }));
      }
      break;
    }

    case "declare_uno": {
      if (!client) return;
      const result = handleDeclareUno(client.roomId, client.playerId);
      if (!result.success) {
        socket.send(JSON.stringify({ type: "error", message: result.message }));
      }
      break;
    }

    case "catch_player": {
      if (!client) return;
      const result = handleCatchPlayer(client.roomId, client.playerId, message.targetPlayerId);
      if (!result.success) {
        socket.send(JSON.stringify({ type: "error", message: result.message }));
      }
      break;
    }

    case "pass_turn": {
      if (!client) return;
      const result = handlePassTurn(client.roomId, client.playerId);
      if (!result.success) {
        socket.send(JSON.stringify({ type: "error", message: result.message }));
      }
      break;
    }

    case "leave_room": {
      if (!client) return;
      const { roomId, playerId } = client;
      leaveRoom(roomId, playerId);
      clients.delete(socket);
      broadcastRoomUpdate(roomId);
      socket.send(JSON.stringify({ type: "left_room" }));
      break;
    }

    case "chat": {
      if (!client) return;
      broadcastToRoom(client.roomId, {
        type: "chat",
        playerId: client.playerId,
        username: client.username,
        message: message.message,
        timestamp: Date.now(),
      });
      break;
    }

    default:
      socket.send(JSON.stringify({ type: "error", message: "Unknown message type" }));
  }
}

function unregisterSocketAndNotify(client: ClientInfo, socket: WebSocket): void {
  const { roomId, playerId } = client;
  leaveRoom(roomId, playerId);
  clients.delete(socket);
  broadcastRoomUpdate(roomId);
}
