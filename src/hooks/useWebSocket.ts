// WebSocket connection - connects to Railway backend for multiplayer
const BACKEND_URL = "wss://uno-blitz-production.up.railway.app";

function getWsUrl(): string {
  const host = window.location.host;
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");

  if (isLocal) {
    // Local dev - connect to local backend
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${host}/ws`;
  }

  // Production - connect to Railway backend
  return `${BACKEND_URL}/ws`;
}

import { useEffect, useRef, useCallback } from "react";
import { useGameStore } from "@/store/gameStore";

export function useWebSocket() {
  const store = useGameStore();
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const isConnecting = useRef(false);

  const connect = useCallback(() => {
    if (isConnecting.current) return;
    isConnecting.current = true;

    try {
      const wsUrl = getWsUrl();
      console.log("[WS] Connecting to:", wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("[WS] Connected");
        store._set({ connected: true, connectError: null, ws });
        reconnectAttempts.current = 0;
        isConnecting.current = false;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message, store);
        } catch (err) {
          console.error("[WS] Failed to parse message:", err);
        }
      };

      ws.onclose = () => {
        console.log("[WS] Disconnected");
        store._set({ connected: false, ws: null });
        isConnecting.current = false;

        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 5000);
          reconnectTimeout.current = setTimeout(() => connect(), delay);
        }
      };

      ws.onerror = () => {
        console.error("[WS] Connection error");
        isConnecting.current = false;
        store._set({ connectError: "Cannot connect to game server", connected: false });
      };
    } catch (err) {
      console.error("[WS] Failed to connect:", err);
      isConnecting.current = false;
    }
  }, [store]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    const ws = store.ws;
    if (ws) {
      ws.close();
    }
  }, [store]);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [connect, disconnect]);

  return {
    connected: store.connected,
    connect,
    disconnect,
  };
}

function handleMessage(message: any, store: any) {
  switch (message.type) {
    case "connected":
      console.log("[WS] Server confirmed connection");
      break;
    case "room_created":
      store._set({ playerId: message.playerId, roomId: message.roomId, roomCode: message.code, isHost: true, phase: "lobby" });
      break;
    case "room_joined":
      store._set({ playerId: message.playerId, roomId: message.roomId, roomCode: message.code, isHost: false, phase: "lobby" });
      break;
    case "room_update":
      const me = message.players.find((p: any) => p.id === store.playerId);
      store._set({
        players: message.players,
        roomName: message.roomName,
        isHost: message.hostId === store.playerId,
        isReady: me?.isReady || false,
      });
      break;
    case "game_state":
      const gs = message.state;
      const myPlayer = gs.players.find((p: any) => p.id === store.playerId);
      store._set({
        phase: "playing",
        gamePhase: gs.phase,
        players: gs.players,
        myHand: myPlayer?.hand || [],
        topCard: gs.topCard,
        activeColor: gs.activeColor,
        currentPlayerId: gs.currentPlayerId,
        isMyTurn: gs.isYourTurn,
        direction: gs.direction,
        turnTimer: gs.turnTimer,
        turnTimeLeft: gs.turnTimeLeft,
        lastAction: gs.lastAction,
        roundNumber: gs.roundNumber,
        mode: gs.mode,
      });
      break;
    case "round_end":
      store._set({
        phase: "round_end",
        roundScores: message.scores,
        cumulativeScores: message.cumulativeScores,
      });
      break;
    case "match_end":
      store._set({
        phase: "match_end",
        matchWinner: message.winnerUsername,
        finalScores: message.finalScores,
      });
      break;
    case "error":
      console.error("[WS] Server error:", message.message);
      break;
    case "chat":
      store.addMessage({
        playerId: message.playerId,
        username: message.username,
        message: message.message,
        timestamp: message.timestamp,
      });
      break;
    case "ready_toggled":
      store._set({ isReady: message.isReady });
      break;
    default:
      console.log("[WS] Unknown message:", message);
  }
}
