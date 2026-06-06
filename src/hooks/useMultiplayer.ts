import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";

export function useMultiplayer() {
  const store = useGameStore();

  useEffect(() => {
    // Auto-connect on mount
    if (!store.connected && !store.ws) {
      store.connect();
    }

    // Reconnect on interval if disconnected
    const interval = setInterval(() => {
      if (!store.connected && !store.connectError) {
        store.connect();
      }
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return {
    connected: store.connected,
    connectError: store.connectError,
    connect: store.connect,
  };
}
