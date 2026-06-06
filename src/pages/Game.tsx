import { useEffect, useState, useCallback, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftRight, LogOut, MessageSquare, RotateCcw, Volume2, VolumeX, X, Coins } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { useSound } from "@/hooks/useSound";
import { UnoCard, ColorPicker } from "@/components/UnoCard";
import { Confetti } from "@/components/Confetti";
import type { CardColor } from "../../api/game/types";

const SUIT_HEX: Record<string, string> = { red: "#e4322b", yellow: "#f6b500", green: "#18a558", blue: "#1e7fd6" };

function isCardPlayable(card: any, topCard: any, activeColor: any, isMyTurn: boolean): boolean {
  if (!isMyTurn || !topCard) return false;
  if (card.type === "wild" || card.type === "wild4") return true;
  if (card.color === activeColor) return true;
  if (card.type === "number" && topCard.type === "number" && card.value === topCard.value) return true;
  if (card.type !== "number" && card.type === topCard.type) return true;
  return false;
}

// Circular turn-timer ring drawn around an avatar
function TimerRing({ pct, size = 60, active }: { pct: number; size?: number; active: boolean }) {
  const r = size / 2 - 3;
  const c = 2 * Math.PI * r;
  const color = !active ? "rgba(255,255,255,0.12)" : pct < 30 ? "#e4322b" : pct < 60 ? "#f6b500" : "#27d9f8";
  return (
    <svg width={size} height={size} className="absolute -inset-0 -rotate-90" style={{ left: -3, top: -3 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (c * (active ? pct : 100)) / 100}
        style={{ transition: "stroke-dashoffset 0.5s linear" }}
      />
    </svg>
  );
}

export default function Game() {
  const navigate = useNavigate();
  const store = useGameStore();
  const sound = useSound();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [lastAction, setLastAction] = useState("");

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

  useEffect(() => {
    // Solo games have no roomCode; only redirect multiplayer sessions that lost their room.
    if (store.phase === "menu" || (store.gameMode !== "solo" && !store.roomCode && store.phase !== "match_end")) {
      navigate("/");
    }
  }, [store.phase, store.roomCode, store.gameMode, navigate]);

  const handlePlayCard = useCallback((cardIndex: number) => {
    const card = store.myHand[cardIndex];
    if (!card || !store.isMyTurn || !store.topCard) return;
    if (!isCardPlayable(card, store.topCard, store.activeColor, store.isMyTurn)) { sound.playError(); return; }
    if (card.type === "wild" || card.type === "wild4") { store._set({ showColorPicker: true, pendingCardIndex: cardIndex }); return; }
    sound.playCard();
    store.playCard(cardIndex);
  }, [store, sound]);

  const handleColorSelect = useCallback((color: CardColor) => {
    if (store.pendingCardIndex === null) return;
    sound.playWild();
    store.selectColor(color);
  }, [store, sound]);

  const handleDraw = useCallback(() => { if (!store.isMyTurn) return; sound.playDraw(); store.drawCard(); }, [store, sound]);
  const handleUno = useCallback(() => { if (store.myHand.length !== 1) return; sound.playUno(); store.declareUno(); }, [store, sound]);
  const handlePass = useCallback(() => { if (!store.isMyTurn) return; store.passTurn(); }, [store]);
  const handleLeave = useCallback(() => { store.leaveRoom(); navigate("/"); }, [store, navigate]);
  const handleChat = useCallback(() => { if (!chatInput.trim()) return; store.sendChat(chatInput.trim()); setChatInput(""); }, [chatInput, store]);

  const otherPlayers = store.players.filter((p) => p.id !== store.playerId);
  const me = store.players.find((p) => p.id === store.playerId);
  const timerPct = store.turnTimer > 0 ? (store.turnTimeLeft / store.turnTimer) * 100 : 100;
  const hasPlayable = store.myHand.some((c) => isCardPlayable(c, store.topCard, store.activeColor, store.isMyTurn));
  const myScore = me?.score ?? 0;

  return (
    <div className="casino-bg h-screen w-screen flex flex-col overflow-hidden select-none text-[#e2e2ec]">
      {/* ===== Top bar ===== */}
      <header className="flex items-center justify-between px-4 py-2.5 z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={handleLeave} className="p-2 rounded-full glass-bright text-gray-300 hover:text-white"><LogOut className="w-4 h-4" /></button>
          <span className="font-display font-extrabold text-gold glow-gold-text hidden sm:block">UNO Blitz</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 glass-bright px-3 py-1.5 rounded-full text-sm font-display font-bold text-gold">
            <Coins className="w-4 h-4" /> {myScore.toLocaleString()} PTS
          </span>
          <div className="flex items-center gap-1 glass-bright px-2 py-1.5 rounded-full">
            <ArrowLeftRight className={`w-4 h-4 text-gray-300 ${store.direction === "counter_clockwise" ? "rotate-180" : ""}`} />
            <span className="w-4 h-4 rounded-full border border-white/30" style={{ backgroundColor: SUIT_HEX[store.activeColor] || "#888" }} />
          </div>
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 rounded-full glass-bright text-gray-300 hover:text-white">
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
          </button>
          <button onClick={() => setShowChat(!showChat)} className="p-2 rounded-full glass-bright text-gray-300 hover:text-white relative">
            <MessageSquare className="w-4 h-4" />
            {store.messages.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-suit-red rounded-full text-[8px] flex items-center justify-center font-bold">{store.messages.length}</span>}
          </button>
        </div>
      </header>

      {/* ===== Opponents ===== */}
      <div className="flex justify-center items-start gap-6 md:gap-12 py-2 px-2 flex-shrink-0 flex-wrap">
        {otherPlayers.map((player, i) => {
          const isTurn = player.id === store.currentPlayerId;
          return (
            <motion.div key={player.id} initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="flex flex-col items-center gap-1">
              <div className="relative">
                <TimerRing pct={timerPct} active={isTurn} />
                <div className={`w-[54px] h-[54px] ${isTurn ? "chip-frame chip-frame-gold" : "chip-frame"}`}>
                  <img src={player.avatar} alt={player.username} className="w-full h-full rounded-full object-cover" />
                </div>
                {/* card count badge */}
                <span className="absolute -bottom-1 -right-1 bg-casino-surface-3 border border-white/10 text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{player.cardCount}</span>
                {/* catch / uno */}
                {player.cardCount === 1 && !player.declaredUno && (
                  <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => store.catchPlayer(player.id)}
                    className="absolute -top-2 -right-2 bg-suit-red text-white text-[7px] font-bold px-1 py-0.5 rounded-full animate-pulse">CATCH</motion.button>
                )}
                {player.declaredUno && player.cardCount === 1 && (
                  <span className="absolute -top-2 -right-2 bg-gold text-[#3e2e00] text-[7px] font-bold px-1.5 py-0.5 rounded-full">UNO</span>
                )}
              </div>
              <span className="text-xs font-bold truncate max-w-[72px]">{player.username}</span>
              {isTurn ? (
                <span className="flex items-center gap-1 text-[9px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-full">
                  <motion.span className="w-1.5 h-1.5 rounded-full bg-gold" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }} /> THINKING
                </span>
              ) : (
                <span className="text-[9px] text-gray-500">{player.cardCount} cards</span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ===== Board center ===== */}
      <div className="flex-1 flex items-center justify-center gap-4 md:gap-7 relative min-h-0 px-3">
        {/* Draw pile */}
        <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.96 }} onClick={handleDraw} className="relative flex flex-col items-center" disabled={!store.isMyTurn}>
          <div className="relative w-20 h-28 md:w-24 md:h-36">
            <div className="absolute inset-0 rounded-2xl bg-casino-surface-3 border border-white/10 rotate-3" />
            <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl -rotate-2 border border-white/10">
              <img src="/assets/card-back.png" alt="Draw" className="w-full h-full object-cover" />
            </div>
            {store.isMyTurn && <motion.div animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute -inset-1.5 rounded-2xl border-2 border-dashed border-electric/60" />}
          </div>
          <span className="mt-1.5 text-[10px] font-bold tracking-[0.15em] text-electric glass-bright px-2 py-0.5 rounded-full">DRAW</span>
        </motion.button>

        {/* Discard pile (active card) */}
        <div className="relative">
          <AnimatePresence mode="popLayout">
            {store.topCard && (
              <motion.div
                key={store.topCard.id}
                initial={{ scale: 0.5, rotate: -24, y: 130, opacity: 0 }}
                animate={{ scale: [0.5, 1.14, 1], rotate: [-24, 7, 0], y: [130, -10, 0], opacity: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.42, times: [0, 0.68, 1], ease: "easeOut" }}
              >
                <UnoCard card={store.topCard} size="lg" active />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            {lastAction && (
              <motion.div key={lastAction} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-electric glass-bright px-3 py-1 rounded-full">
                {lastAction}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info panel */}
        <div className="glass rounded-2xl px-4 py-3 text-center hidden sm:block">
          <p className="text-[10px] font-bold tracking-[0.15em] text-[#d1c5b0]">CURRENT POOL</p>
          <p className="font-display font-extrabold text-2xl text-gold glow-gold-text flex items-center gap-1 justify-center"><Coins className="w-4 h-4" /> {store.players.reduce((a, p) => a + (p.score || 0), 0).toLocaleString()}</p>
          <p className="text-[10px] text-gray-500 mt-1">Round {store.roundNumber || 1}</p>
        </div>

        {/* Color picker */}
        <AnimatePresence>
          {store.showColorPicker && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-30">
              <motion.div initial={{ scale: 0.85, y: 10 }} animate={{ scale: 1, y: 0 }} className="glass rounded-3xl p-6">
                <h3 className="font-display font-bold text-lg text-center mb-4">Choose a Color</h3>
                <ColorPicker onSelect={handleColorSelect} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== Turn indicator + UNO button ===== */}
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0 py-1">
        <AnimatePresence>
          {store.isMyTurn && (
            <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-[11px] font-bold text-electric glow-cyan-text glass-bright px-3 py-1 rounded-full">
              YOUR TURN
            </motion.span>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-3">
          {store.isMyTurn && !hasPlayable && store.myHand.length > 0 && (
            <button onClick={handlePass} className="btn-3d btn-ghost px-5 py-2 text-sm">Pass</button>
          )}
          <motion.button
            whileHover={{ scale: store.myHand.length === 1 && !me?.declaredUno ? 1.08 : 1 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleUno}
            disabled={store.myHand.length !== 1 || me?.declaredUno}
            className={`w-16 h-16 font-display font-extrabold text-lg flex items-center justify-center ${
              store.myHand.length === 1 && !me?.declaredUno
                ? "btn-3d btn-red shadow-glow-red animate-glow-pulse"
                : "bg-white/5 text-gray-600 border border-white/10 cursor-not-allowed"
            }`}
            style={{ borderRadius: "9999px" }}
          >
            UNO!
          </motion.button>
        </div>
      </div>

      {/* ===== My hand ===== */}
      <div className="flex-shrink-0 px-2 pb-3 pt-1">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <div className="chip-frame w-7 h-7"><img src={me?.avatar || "https://i.pravatar.cc/200?img=12"} alt="" className="w-full h-full rounded-full object-cover" /></div>
          <span className="text-xs font-bold">{me?.username}</span>
          <span className="text-[10px] text-gray-500">· {store.myHand.length} cards</span>
        </div>
        <div className="flex justify-center overflow-x-auto pb-1" style={{ minHeight: "108px" }}>
          <div className="flex items-end" style={{ paddingLeft: `${Math.min(store.myHand.length * 10, 70)}px` }}>
            {store.myHand.map((card, index) => {
              const playable = isCardPlayable(card, store.topCard, store.activeColor, store.isMyTurn);
              return (
                <motion.div
                  key={card.id}
                  initial={{ y: 90, x: -140, opacity: 0, rotate: -14, scale: 0.8 }}
                  animate={{ y: playable ? -6 : 0, x: 0, opacity: 1, rotate: 0, scale: 1 }}
                  transition={{ delay: index * 0.045, type: "spring", stiffness: 240, damping: 20 }}
                  className="flex-shrink-0 relative z-0 hover:z-10"
                  style={{ marginLeft: `-${Math.min(store.myHand.length * 5, 38)}px` }}
                >
                  <UnoCard card={card} size="sm" playable={playable} onClick={playable ? () => handlePlayCard(index) : undefined} className={playable ? "" : "opacity-75 saturate-75"} />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== Chat panel ===== */}
      <AnimatePresence>
        {showChat && (
          <motion.div initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }}
            className="fixed right-0 top-0 bottom-0 w-72 glass border-l border-white/10 z-40 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <h3 className="font-display font-bold text-sm">Chat</h3>
              <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {store.messages.map((msg, i) => (
                <div key={i} className="text-xs"><span className="text-electric font-bold">{msg.username}:</span> <span className="text-[#d1c5b0]">{msg.message}</span></div>
              ))}
            </div>
            <div className="p-3 border-t border-white/10 flex gap-2">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleChat()} placeholder="Type…"
                className="flex-1 glass-bright rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-electric" />
              <button onClick={handleChat} className="btn-3d btn-cyan px-3 text-xs">Send</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Round End ===== */}
      <AnimatePresence>
        {store.phase === "round_end" && store.roundScores && (
          <>
          {store.roundScores.find((s) => s.roundWinner)?.username === me?.username && <Confetti count={60} />}
          <Overlay>
            <h2 className="font-display text-2xl font-extrabold text-center text-gold glow-gold-text mb-1">Round Over!</h2>
            <p className="text-center text-[#d1c5b0] text-xs mb-3">{store.roundScores.find((s) => s.roundWinner)?.username} wins the round</p>
            <div className="space-y-1.5 mb-3">
              {store.roundScores.map((score, i) => (
                <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${score.roundWinner ? "bg-gold/10 border border-gold/30" : "glass-bright"}`}>
                  <span className="text-sm">{score.username}</span>
                  <span className={`text-sm font-bold ${score.roundWinner ? "text-gold" : "text-gray-400"}`}>{score.points > 0 ? `+${score.points}` : score.points}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-500 text-xs animate-pulse">Next round starting…</p>
          </Overlay>
          </>
        )}
      </AnimatePresence>

      {/* ===== Match End ===== */}
      <AnimatePresence>
        {store.phase === "match_end" && store.finalScores && (
          <>
          <Confetti loop count={120} />
          <Overlay gold>
            <motion.img src="/assets/trophy.png" alt="Trophy" className="w-20 h-20 mx-auto mb-2" animate={{ rotate: [0, -8, 8, 0], y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity }} />
            <h2 className="font-display text-2xl font-extrabold text-gold glow-gold-text text-center mb-3">{store.matchWinner} Wins!</h2>
            <div className="space-y-1.5 mb-5">
              {store.finalScores.map((score, i) => (
                <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${i === 0 ? "bg-gold/10 border border-gold/30" : "glass-bright"}`}>
                  <span className="text-sm">#{score.rank} {score.username}</span>
                  <span className="text-gold font-bold text-sm">{score.score} pts</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={handleLeave} className="btn-3d btn-cyan flex-1 py-3 flex items-center justify-center gap-2 text-sm"><RotateCcw className="w-4 h-4" /> New Game</button>
              <button onClick={handleLeave} className="btn-3d btn-ghost flex-1 py-3 text-sm">Menu</button>
            </div>
          </Overlay>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Overlay({ children, gold }: { children: ReactNode; gold?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className={`glass rounded-3xl p-6 max-w-xs w-full ${gold ? "border border-gold/30" : ""}`}>
        {children}
      </motion.div>
    </motion.div>
  );
}
