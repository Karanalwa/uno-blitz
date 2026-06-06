import { useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Crown, Check, X, Copy, ArrowLeft, Play, User, Share2 } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { useSound } from "@/hooks/useSound";

export default function Lobby() {
  const navigate = useNavigate();
  const store = useGameStore();
  const sound = useSound();

  // Redirect if not in lobby
  useEffect(() => {
    if (store.phase !== "lobby" || !store.roomCode) {
      navigate("/");
    }
  }, [store.phase, store.roomCode, navigate]);

  // Navigate to game when playing
  useEffect(() => {
    if (store.gamePhase === "playing" && store.topCard) {
      navigate("/game");
    }
  }, [store.gamePhase, store.topCard, navigate]);

  const handleReady = () => {
    sound.playButton();
    store.toggleReady();
  };

  const handleStart = () => {
    sound.playButton();
    store.startGame();
  };

  const handleLeave = () => {
    sound.playButton();
    store.leaveRoom();
    navigate("/");
  };

  const copyCode = () => {
    if (store.roomCode) {
      navigator.clipboard.writeText(store.roomCode);
    }
  };

  const shareCode = () => {
    if (store.roomCode && navigator.share) {
      navigator.share({ title: "Join my UNO room!", text: `Room code: ${store.roomCode}` });
    }
  };

  const readyCount = store.players.filter((p) => p.isReady).length;
  const canStart = store.isHost && readyCount >= 2 && readyCount === store.players.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0D1B2A] via-[#0f2235] to-[#0D1B2A] flex flex-col items-center p-4">
      {/* Header */}
      <div className="w-full max-w-lg mt-6 mb-6">
        <button onClick={handleLeave} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-5 h-5" />
          Leave
        </button>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">{store.roomName || "Game Room"}</h1>
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-gray-400">Code:</span>
            <button onClick={copyCode} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all border border-white/10">
              <span className="text-2xl font-mono font-bold text-[#FFD700] tracking-[0.3em]">{store.roomCode}</span>
              <Copy className="w-4 h-4 text-gray-400" />
            </button>
            {typeof navigator !== "undefined" && "share" in navigator && (
              <button onClick={shareCode} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
                <Share2 className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">Share this code with friends to join!</p>
        </div>
      </div>

      {/* Players */}
      <div className="w-full max-w-lg mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400" />
            Players ({store.players.length})
          </h2>
          <span className="text-xs text-gray-400">{readyCount} ready</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {store.players.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`relative rounded-xl p-3 border-2 transition-all ${
                player.isReady ? "border-green-500/50 bg-green-500/10" : "border-white/10 bg-white/5"
              }`}
            >
              {player.isHost && (
                <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1">
                  <Crown className="w-3 h-3 text-[#0D1B2A]" />
                </div>
              )}
              <div className="flex flex-col items-center">
                <img src={player.avatar} alt={player.username} className="w-12 h-12 rounded-full border-2 border-white/20 mb-1" />
                <span className="text-white text-xs font-medium truncate max-w-full">{player.username}</span>
                <span className={`text-[10px] mt-0.5 ${player.isReady ? "text-green-400" : "text-gray-500"}`}>
                  {player.isReady ? <span className="flex items-center gap-0.5"><Check className="w-2.5 h-2.5" /> Ready</span> : <span className="flex items-center gap-0.5"><X className="w-2.5 h-2.5" /> Waiting</span>}
                </span>
              </div>
            </motion.div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 8 - store.players.length) }).slice(0, 4).map((_, i) => (
            <div key={`empty-${i}`} className="rounded-xl p-3 border-2 border-dashed border-white/5 bg-white/[0.02] flex items-center justify-center min-h-[100px]">
              <span className="text-gray-600 text-xs">Open</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        <button
          onClick={handleReady}
          className={`w-full py-3 rounded-xl font-bold transition-all ${
            store.isReady
              ? "bg-green-500/20 text-green-400 border-2 border-green-500/50 hover:bg-green-500/30"
              : "bg-white/10 text-white border-2 border-white/20 hover:bg-white/20"
          }`}
        >
          {store.isReady ? <span className="flex items-center justify-center gap-2"><Check className="w-5 h-5" /> Ready!</span> : <span className="flex items-center justify-center gap-2"><Play className="w-5 h-5" /> Ready Up</span>}
        </button>

        {store.isHost && (
          <button
            onClick={handleStart}
            disabled={!canStart}
            className={`w-full py-3 rounded-xl font-bold transition-all ${
              canStart
                ? "bg-gradient-to-r from-[#0077B6] to-[#2A9D8F] text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
                : "bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            Start Game
          </button>
        )}

        {!store.isHost && store.players.length > 0 && (
          <p className="text-center text-gray-500 text-xs">Waiting for host...</p>
        )}
      </div>
    </div>
  );
}
