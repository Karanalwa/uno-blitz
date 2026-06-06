import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftRight, Clock, Home, LogOut, MessageSquare, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { useSound } from "@/hooks/useSound";
import { UnoCard, ColorPicker } from "@/components/UnoCard";
import type { CardColor } from "../../api/game/types";

function isCardPlayable(card: any, topCard: any, activeColor: any, isMyTurn: boolean): boolean {
  if (!isMyTurn || !topCard) return false;
  if (card.type === "wild" || card.type === "wild4") return true;
  if (card.color === activeColor) return true;
  if (card.type === "number" && topCard.type === "number" && card.value === topCard.value) return true;
  if (card.type !== "number" && card.type === topCard.type) return true;
  return false;
}

export default function Game() {
  const navigate = useNavigate();
  const store = useGameStore();
  const sound = useSound();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [lastAction, setLastAction] = useState("");

  // Sound effects on action changes
  useEffect(() => {
    if (!store.lastAction || !soundEnabled) return;
    const a = store.lastAction;
    setLastAction(a);
    if (a.includes("SKIP")) sound.playSkip();
    else if (a.includes("REVERSE")) sound.playReverse();
    else if (a.includes("+2")) sound.playDraw2();
    else if (a.includes("WILD")) sound.playWild();
    else if (a.includes("UNO")) sound.playUno();
    else if (a.includes("wins")) sound.playWin();
    else if (a.includes("played")) sound.playCard();
    else if (a.includes("draw")) sound.playDraw();
  }, [store.lastAction, soundEnabled, sound]);

  // Redirect if not in game
  useEffect(() => {
    if (store.phase === "menu" || (!store.roomCode && store.phase !== "match_end")) {
      navigate("/");
    }
  }, [store.phase, store.roomCode, navigate]);

  // Auto-advance round end
  useEffect(() => {
    if (store.phase === "round_end") {
      const timer = setTimeout(() => {
        // Server auto-starts next round, but we can also trigger
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [store.phase]);

  const handlePlayCard = useCallback((cardIndex: number) => {
    const card = store.myHand[cardIndex];
    if (!card || !store.isMyTurn || !store.topCard) return;
    if (!isCardPlayable(card, store.topCard, store.activeColor, store.isMyTurn)) {
      sound.playError();
      return;
    }
    if (card.type === "wild" || card.type === "wild4") {
      store._set({ showColorPicker: true, pendingCardIndex: cardIndex });
      return;
    }
    sound.playCard();
    store.playCard(cardIndex);
  }, [store, sound]);

  const handleColorSelect = useCallback((color: CardColor) => {
    const { pendingCardIndex } = store;
    if (pendingCardIndex === null) return;
    sound.playWild();
    store.selectColor(color);
  }, [store, sound]);

  const handleDraw = useCallback(() => {
    if (!store.isMyTurn) return;
    sound.playDraw();
    store.drawCard();
  }, [store, sound]);

  const handleUno = useCallback(() => {
    if (store.myHand.length !== 1) return;
    sound.playUno();
    store.declareUno();
  }, [store, sound]);

  const handlePass = useCallback(() => {
    if (!store.isMyTurn) return;
    store.passTurn();
  }, [store]);

  const handleLeave = useCallback(() => {
    store.leaveRoom();
    navigate("/");
  }, [store, navigate]);

  const handleRematch = useCallback(() => {
    store.leaveRoom();
    navigate("/");
  }, [store, navigate]);

  const handleChat = useCallback(() => {
    if (!chatInput.trim()) return;
    store.sendChat(chatInput.trim());
    setChatInput("");
  }, [chatInput, store]);

  const otherPlayers = store.players.filter((p) => p.id !== store.playerId);
  const me = store.players.find((p) => p.id === store.playerId);
  const timerPct = store.turnTimer > 0 ? (store.turnTimeLeft / store.turnTimer) * 100 : 100;

  return (
    <div className="h-screen w-screen bg-gradient-to-b from-[#0a1f1a] via-[#0D1B2A] to-[#0a1628] flex flex-col overflow-hidden select-none">
      {/* Top HUD */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/30 backdrop-blur-sm border-b border-white/5 z-20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={handleLeave} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
            <LogOut className="w-4 h-4 text-gray-300" />
          </button>
          <span className="text-xs text-gray-400">Room: <span className="text-[#FFD700] font-mono">{store.roomCode}</span></span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <ArrowLeftRight className={`w-4 h-4 ${store.direction === "counter_clockwise" ? "rotate-180" : ""}`} />
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-400" />
            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${timerPct < 30 ? "bg-red-500" : timerPct < 60 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${timerPct}%` }} />
            </div>
          </div>
          <div className="w-4 h-4 rounded-full border border-white/30" style={{ backgroundColor: store.activeColor === "red" ? "#E84855" : store.activeColor === "blue" ? "#0077B6" : store.activeColor === "green" ? "#2A9D8F" : "#E9C46A" }} />
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
            {soundEnabled ? <Volume2 className="w-4 h-4 text-gray-300" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
          </button>
          <button onClick={() => setShowChat(!showChat)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors relative">
            <MessageSquare className="w-4 h-4 text-gray-300" />
            {store.messages.length > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] flex items-center justify-center">{store.messages.length}</span>}
          </button>
        </div>
      </div>

      {/* Opponents */}
      <div className="flex justify-center gap-2 py-2 px-2 flex-shrink-0 flex-wrap">
        {otherPlayers.map((player, i) => (
          <motion.div key={player.id} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all ${player.id === store.currentPlayerId ? "bg-white/10 border border-yellow-400/50" : "bg-white/5 border border-white/5"}`}>
            <div className="relative">
              <img src={player.avatar} alt={player.username} className="w-9 h-9 rounded-full border-2 border-white/20" />
              {player.cardCount === 1 && !player.declaredUno && player.id !== store.playerId && (
                <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                  onClick={() => store.catchPlayer(player.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-full animate-pulse">
                  CATCH
                </motion.button>
              )}
              {player.declaredUno && player.cardCount === 1 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-[#0D1B2A] text-[7px] font-bold px-1 rounded-full">UNO</span>
              )}
            </div>
            <span className="text-[10px] text-gray-300 truncate max-w-[50px]">{player.username}</span>
            <span className="text-[9px] text-gray-500">{player.cardCount} cards</span>
            <span className="text-[9px] text-[#FFD700]">{player.score} pts</span>
          </motion.div>
        ))}
      </div>

      {/* Game board center */}
      <div className="flex-1 flex items-center justify-center gap-6 relative min-h-0">
        {/* Draw pile */}
        <motion.div whileHover={{ y: -5 }} className="relative cursor-pointer" onClick={handleDraw}>
          <div className="w-20 h-28 md:w-24 md:h-36 relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-600 transform rotate-3" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-600 transform -rotate-2" />
            <div className="absolute inset-0 rounded-xl overflow-hidden shadow-xl">
              <img src="/assets/card-back.png" alt="Draw" className="w-full h-full object-cover rounded-xl" />
            </div>
            {store.isMyTurn && <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute -inset-2 rounded-xl border-2 border-dashed border-cyan-400/50" />}
          </div>
          <span className="text-center text-[10px] text-gray-400 mt-1 block">Draw</span>
        </motion.div>

        {/* Discard pile */}
        <div className="relative">
          {store.topCard && (
            <motion.div key={store.topCard.id} initial={{ scale: 0.5, rotate: 10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300 }}>
              <UnoCard card={store.topCard} size="lg" />
            </motion.div>
          )}
          <AnimatePresence mode="wait">
            {lastAction && (
              <motion.div key={lastAction} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-cyan-300 bg-black/60 px-3 py-1 rounded-full">
                {lastAction}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Color picker overlay */}
        <AnimatePresence>
          {store.showColorPicker && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-30">
              <div className="bg-[#1B2838] rounded-2xl p-6 border border-white/10 shadow-2xl">
                <h3 className="text-white font-bold text-lg text-center mb-4">Choose Color</h3>
                <ColorPicker onSelect={handleColorSelect} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Turn indicator */}
      <AnimatePresence>
        {store.isMyTurn && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center py-0.5 flex-shrink-0">
            <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg shadow-cyan-500/30">
              YOUR TURN
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score bar */}
      <div className="flex justify-center gap-3 px-4 py-1 flex-shrink-0">
        {store.players.map((p) => (
          <div key={p.id} className={`flex items-center gap-1 text-[10px] ${p.id === store.playerId ? "text-cyan-300" : "text-gray-500"}`}>
            <img src={p.avatar} className="w-4 h-4 rounded-full" alt="" />
            <span>{p.score}pts</span>
          </div>
        ))}
      </div>

      {/* My hand */}
      <div className="px-2 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-1 px-1">
          <div className="flex items-center gap-1">
            <img src={me?.avatar || "/assets/avatar-robot.png"} alt="You" className="w-7 h-7 rounded-full border border-white/20" />
            <span className="text-xs text-white">{me?.username}</span>
          </div>
          <div className="flex gap-1">
            {store.myHand.length === 1 && !me?.declaredUno && (
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleUno}
                className="bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-xs px-3 py-1 rounded-full shadow-lg animate-pulse">
                UNO!
              </motion.button>
            )}
            {store.isMyTurn && store.myHand.length > 0 && !store.myHand.some((c) => isCardPlayable(c, store.topCard, store.activeColor, store.isMyTurn)) && (
              <button onClick={handlePass} className="bg-white/10 text-white text-xs px-3 py-1 rounded-full hover:bg-white/20 transition-colors">Pass</button>
            )}
          </div>
        </div>

        {/* Cards */}
        <div className="flex justify-center overflow-x-auto pb-1 px-1" style={{ minHeight: "110px" }}>
          <div className="flex" style={{ paddingLeft: `${Math.min(store.myHand.length * 8, 60)}px` }}>
            {store.myHand.map((card, index) => {
              const playable = isCardPlayable(card, store.topCard, store.activeColor, store.isMyTurn);
              return (
                <div key={card.id} className="flex-shrink-0" style={{ marginLeft: `-${Math.min(store.myHand.length * 4, 32)}px` }}>
                  <UnoCard card={card} size="sm" playable={playable} onClick={playable ? () => handlePlayCard(index) : undefined} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {showChat && (
          <motion.div initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }}
            className="fixed right-0 top-0 bottom-0 w-72 bg-[#1B2838]/95 backdrop-blur-md border-l border-white/10 z-40 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <h3 className="text-white font-bold text-sm">Chat</h3>
              <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white"><Home className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {store.messages.map((msg, i) => (
                <div key={i} className="text-xs"><span className="text-cyan-400 font-medium">{msg.username}:</span> <span className="text-gray-300">{msg.message}</span></div>
              ))}
            </div>
            <div className="p-3 border-t border-white/10">
              <div className="flex gap-2">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChat()}
                  placeholder="Type..." className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-cyan-400" />
                <button onClick={handleChat} className="bg-cyan-500 text-white px-3 py-2 rounded-lg hover:bg-cyan-600 transition-colors text-xs">Send</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Round End Overlay */}
      <AnimatePresence>
        {store.phase === "round_end" && store.roundScores && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              className="bg-[#1B2838] rounded-2xl p-5 border border-white/10 shadow-2xl max-w-xs w-full mx-4">
              <h2 className="text-xl font-bold text-center text-[#FFD700] mb-1">Round Over!</h2>
              <p className="text-center text-gray-400 text-xs mb-3">{store.roundScores.find((s) => s.roundWinner)?.username} wins</p>
              <div className="space-y-1.5 mb-3">
                {store.roundScores.map((score, i) => (
                  <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${score.roundWinner ? "bg-yellow-500/10 border border-yellow-500/30" : "bg-white/5"}`}>
                    <span className="text-white text-xs">{score.username}</span>
                    <span className={`text-xs font-bold ${score.roundWinner ? "text-yellow-400" : "text-gray-400"}`}>{score.points > 0 ? `+${score.points}` : score.points}</span>
                  </div>
                ))}
              </div>
              <p className="text-center text-gray-500 text-xs animate-pulse">Next round starting...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match End Overlay */}
      <AnimatePresence>
        {store.phase === "match_end" && store.finalScores && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              className="bg-[#1B2838] rounded-2xl p-5 border border-yellow-500/30 shadow-2xl max-w-xs w-full mx-4 text-center">
              <motion.img src="/assets/trophy.png" alt="Trophy" className="w-16 h-16 mx-auto mb-2"
                animate={{ rotate: [0, -10, 10, 0], y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }} />
              <h2 className="text-xl font-bold text-[#FFD700] mb-1">{store.matchWinner} Wins!</h2>
              <div className="space-y-1.5 mb-5 mt-3">
                {store.finalScores.map((score, i) => (
                  <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${i === 0 ? "bg-yellow-500/10 border border-yellow-500/30" : i === 1 ? "bg-gray-400/10" : "bg-white/5"}`}>
                    <span className="text-white text-xs">#{score.rank} {score.username}</span>
                    <span className="text-[#FFD700] font-bold text-xs">{score.score} pts</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={handleRematch} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#0077B6] to-[#2A9D8F] text-white font-bold text-sm flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4" /> New Game
                </button>
                <button onClick={handleLeave} className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all text-sm">
                  Menu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
