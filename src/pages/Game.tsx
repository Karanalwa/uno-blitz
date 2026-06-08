import { useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, RotateCcw, Volume2, VolumeX, X, Timer, Smile, Menu as MenuIcon, Crown } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { useSound } from "@/hooks/useSound";
import { useIsMobile } from "@/hooks/use-mobile";
import { recordMatch, recordUnoCall, recordDrawFour, recordMatchHistory } from "@/lib/playerStats";
import { addCoins, addXp } from "@/lib/wallet";
import { useSettings, vibrate } from "@/lib/settings";
import { UnoCard, ColorPicker } from "@/components/UnoCard";
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

// Circular turn-timer ring around an avatar
function TimerRing({ pct, size = 58, active }: { pct: number; size?: number; active: boolean }) {
  const r = size / 2 - 2;
  const c = 2 * Math.PI * r;
  const color = !active ? "rgba(255,255,255,0.1)" : pct < 30 ? "#e4322b" : pct < 60 ? "#f6b500" : "#43d166";
  return (
    <svg width={size} height={size} className="absolute -rotate-90" style={{ left: -2, top: -2 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={3} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (c * (active ? pct : 100)) / 100} style={{ transition: "stroke-dashoffset 0.5s linear" }} />
    </svg>
  );
}

// A mini face-down fan for opponents
function MiniFan({ count }: { count: number }) {
  const n = Math.min(count, 7);
  return (
    <div className="flex justify-center" style={{ height: 26 }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="w-4 h-6 rounded-[3px] -ml-2 first:ml-0"
          style={{ background: "linear-gradient(160deg,#1a1a2e,#0f0f1a)", border: "1px solid rgba(245,166,35,0.3)", transform: `rotate(${(i - (n - 1) / 2) * 6}deg)`, boxShadow: "0 1px 2px rgba(0,0,0,0.4)" }} />
      ))}
    </div>
  );
}

// Styled red UNO card back
function CardBack({ className = "" }: { className?: string }) {
  return (
    <div className={`uno-shell ${className}`} style={{ ["--cw" as string]: "82px" }}>
      <div className="uno-inner" style={{ background: "linear-gradient(160deg,#222,#000)" }}>
        <div className="absolute left-1/2 top-1/2" style={{ width: "75%", height: "85%", transform: "translate(-50%,-50%) rotate(40deg)", borderRadius: "50%", border: "calc(var(--cw)*0.05) solid #fff", background: "radial-gradient(circle at 50% 42%,#ff3b33,#c40d0d)", boxShadow: "inset 0 2px 6px rgba(0,0,0,0.4)" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontStyle: "italic", fontWeight: 900, color: "#ffce3a", WebkitTextStrokeWidth: "calc(var(--cw)*0.018)", WebkitTextStrokeColor: "rgba(0,0,0,0.6)", paintOrder: "stroke fill", transform: "rotate(-20deg)", fontSize: "calc(var(--cw)*0.26)", textShadow: "0 2px 2px rgba(0,0,0,0.4)" }}>UNO</span>
        </div>
      </div>
    </div>
  );
}

export default function Game() {
  const navigate = useNavigate();
  const store = useGameStore();
  const sound = useSound();
  const isMobile = useIsMobile();
  const settings = useSettings();
  const anims = settings.cardAnimation;
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [lastAction, setLastAction] = useState("");
  const [unoCall, setUnoCall] = useState(false);
  const recordedRef = useRef(false);

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
    if (store.phase === "menu" || (store.gameMode !== "solo" && !store.roomCode && store.phase !== "match_end")) {
      navigate("/home");
    }
  }, [store.phase, store.roomCode, store.gameMode, navigate]);

  // Record the match result once when the match ends (powers the Profile stats).
  useEffect(() => {
    if (store.phase === "match_end") {
      if (!recordedRef.current) {
        recordedRef.current = true;
        const myName = store.players.find((p) => p.id === store.playerId)?.username;
        const won = !!myName && store.matchWinner === myName;
        recordMatch(won);
        const opponents = store.players.filter((p) => p.id !== store.playerId).map((p) => p.username).join(", ");
        recordMatchHistory({ result: won ? "WIN" : "LOSE", players: opponents || "Bots", count: store.players.length, at: Date.now() });
        addCoins(won ? 500 : 50);
        addXp(won ? 120 : 40);
      }
    } else {
      recordedRef.current = false;
    }
  }, [store.phase, store.matchWinner, store.players, store.playerId]);

  // Reset the turn timer whenever the active player changes (solo; MP is server-driven).
  useEffect(() => {
    if (store.gameMode === "solo") {
      useGameStore.getState()._set({ turnTimeLeft: store.turnTimer || 30 });
    }
  }, [store.currentPlayerId, store.turnTimer, store.roundNumber, store.gameMode]);

  // Tick the turn timer down once per second; auto-draw if my time runs out (solo only).
  useEffect(() => {
    const iv = setInterval(() => {
      const st = useGameStore.getState();
      if (st.phase !== "playing" || st.gameMode !== "solo") return;
      const left = st.turnTimeLeft ?? 0;
      if (left <= 0) {
        // reset first so we never auto-draw twice for the same turn
        st._set({ turnTimeLeft: st.turnTimer || 30 });
        if (st.isMyTurn && st.myHand.length > 0) st.drawCard();
        return;
      }
      st._set({ turnTimeLeft: left - 1 });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const handlePlayCard = useCallback((cardIndex: number) => {
    const card = store.myHand[cardIndex];
    if (!card || !store.isMyTurn || !store.topCard) return;
    if (!isCardPlayable(card, store.topCard, store.activeColor, store.isMyTurn)) { sound.playError(); return; }
    if (card.type === "wild" || card.type === "wild4") {
      if (card.type === "wild4") recordDrawFour();
      store._set({ showColorPicker: true, pendingCardIndex: cardIndex });
      return;
    }
    sound.playCard();
    vibrate(18);
    store.playCard(cardIndex);
  }, [store, sound]);

  const handleColorSelect = useCallback((color: CardColor) => {
    if (store.pendingCardIndex === null) return;
    sound.playWild();
    store.selectColor(color);
  }, [store, sound]);

  const handleDraw = useCallback(() => { if (!store.isMyTurn) return; sound.playDraw(); store.drawCard(); }, [store, sound]);
  const handleUno = useCallback(() => {
    if (store.myHand.length !== 1) return;
    sound.playUno();
    store.declareUno();
    recordUnoCall();
    setUnoCall(true);
    setTimeout(() => setUnoCall(false), 1700);
  }, [store, sound]);
  const handlePass = useCallback(() => { if (!store.isMyTurn) return; store.passTurn(); }, [store]);
  const handleLeave = useCallback(() => { store.leaveRoom(); navigate("/home"); }, [store, navigate]);
  const handleChat = useCallback(() => { if (!chatInput.trim()) return; store.sendChat(chatInput.trim()); setChatInput(""); }, [chatInput, store]);

  const otherPlayers = store.players.filter((p) => p.id !== store.playerId);
  const me = store.players.find((p) => p.id === store.playerId);
  const timerPct = store.turnTimer > 0 ? (store.turnTimeLeft / store.turnTimer) * 100 : 100;
  const hasPlayable = store.myHand.some((c) => isCardPlayable(c, store.topCard, store.activeColor, store.isMyTurn));

  return (
    <div className="felt-table felt-rail h-[100dvh] w-full flex flex-col overflow-hidden select-none text-[#ece6da]">
      {/* ===== Top bar ===== */}
      <header className="flex items-center justify-between px-3 py-2.5 z-20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={handleLeave} className="p-2 rounded-full bg-black/35 border border-white/10 text-gray-200 hover:text-white"><LogOut className="w-4 h-4" /></button>
          {settings.showTimer && <span className="currency-pill text-sm text-gold"><Timer className="w-4 h-4" /> 00:{String(Math.max(0, Math.ceil(store.turnTimeLeft || 0))).padStart(2, "0")}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 rounded-full bg-black/35 border border-white/10 text-gray-200 hover:text-white">{soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-gray-500" />}</button>
          <button onClick={() => { setShowChat(true); }} className="p-2 rounded-full bg-black/35 border border-white/10 text-gray-200 hover:text-white"><Smile className="w-4 h-4" /></button>
          <button onClick={() => setShowChat(!showChat)} className="p-2 rounded-full bg-black/35 border border-white/10 text-gray-200 hover:text-white relative">
            <MenuIcon className="w-4 h-4" />
            {store.messages.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-gold rounded-full text-[8px] text-black flex items-center justify-center font-bold">{store.messages.length}</span>}
          </button>
        </div>
      </header>

      {/* ===== Opponents ===== */}
      <div className="flex justify-center items-start gap-3 sm:gap-6 md:gap-10 px-2 pt-1 flex-shrink-0 flex-wrap">
        {otherPlayers.map((player, i) => {
          const isTurn = player.id === store.currentPlayerId;
          return (
            <motion.div key={player.id} initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="flex flex-col items-center gap-1">
              <MiniFan count={player.cardCount} />
              <div className="relative mt-0.5">
                <TimerRing pct={timerPct} active={isTurn} />
                <div className={`w-[52px] h-[52px] ${isTurn ? "frame-ring frame-ring-turn" : "frame-ring"}`}>
                  <img src={player.avatar} alt={player.username} className="w-full h-full rounded-[0.65rem] object-cover" />
                </div>
                <span className="absolute -top-1.5 -left-1.5 level-badge">{((i * 9 + 12) % 30) + 7}</span>
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 count-badge"><span className="text-gold">▦</span>{player.cardCount}</span>
                {player.cardCount === 1 && !player.declaredUno && (
                  <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => store.catchPlayer(player.id)} className="absolute -top-2 -right-2 bg-suit-red text-white text-[7px] font-bold px-1 py-0.5 rounded-full animate-pulse">CATCH</motion.button>
                )}
                {player.declaredUno && player.cardCount === 1 && <span className="absolute -top-2 -right-2 bg-gold text-black text-[7px] font-bold px-1 rounded-full">UNO</span>}
              </div>
              <span className="text-[11px] font-bold truncate max-w-[72px]">{player.username}</span>
              {isTurn && <span className="text-[8px] font-bold text-emerald-300">● PLAYING</span>}
            </motion.div>
          );
        })}
      </div>

      {/* ===== Center play area ===== */}
      <div className="flex-1 flex items-center justify-center relative min-h-0 px-2">
        {/* direction arcs */}
        <div className={`absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full border-2 border-dashed border-gold/20 animate-dir-flow ${store.direction === "counter_clockwise" ? "scale-x-[-1]" : ""}`} />
        <svg className={`absolute w-72 h-72 sm:w-96 sm:h-96 animate-dir-flow ${store.direction === "counter_clockwise" ? "scale-x-[-1]" : ""}`} viewBox="0 0 200 200" fill="none">
          <path d="M170 100 A70 70 0 0 1 100 170" stroke="rgba(245,178,26,0.35)" strokeWidth="3" strokeLinecap="round" />
          <path d="M30 100 A70 70 0 0 1 100 30" stroke="rgba(245,178,26,0.35)" strokeWidth="3" strokeLinecap="round" />
          <polygon points="100,168 94,158 106,158" fill="rgba(245,178,26,0.6)" />
          <polygon points="100,32 94,42 106,42" fill="rgba(245,178,26,0.6)" />
        </svg>

        <div className="flex items-center gap-4 sm:gap-6 relative z-10">
          {/* Draw pile */}
          <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.96 }} onClick={handleDraw} disabled={!store.isMyTurn} className="relative flex flex-col items-center">
            <div className="relative">
              <CardBack className="w-16 h-24 md:w-20 md:h-28 absolute rotate-6 opacity-70" />
              <CardBack className="w-16 h-24 md:w-20 md:h-28 relative" />
              {store.isMyTurn && <motion.div animate={{ opacity: [0.3, 0.85, 0.3] }} transition={{ duration: 1.4, repeat: Infinity }} className="absolute -inset-1.5 rounded-2xl border-2 border-dashed border-gold/70" />}
            </div>
            <span className="mt-1.5 text-[10px] font-bold tracking-wider text-gold bg-black/40 px-2 py-0.5 rounded-full">DRAW</span>
          </motion.button>

          {/* Discard */}
          <div className="relative">
            <AnimatePresence mode="popLayout">
              {store.topCard && (
                <motion.div key={store.topCard.id} initial={anims ? { scale: 0.5, rotate: -24, y: 120, opacity: 0 } : false} animate={{ scale: anims ? [0.5, 1.14, 1] : 1, rotate: anims ? [-24, 7, 0] : 0, y: anims ? [120, -10, 0] : 0, opacity: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: anims ? 0.42 : 0, times: [0, 0.68, 1], ease: "easeOut" }}>
                  <UnoCard card={store.topCard} size={isMobile ? "md" : "lg"} active />
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence mode="wait">
              {lastAction && (
                <motion.div key={lastAction} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-bold text-gold bg-black/50 px-3 py-1 rounded-full">{lastAction}</motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Active-color wheel */}
          <div className="relative flex flex-col items-center">
            <div className="w-12 h-12 md:w-14 md:h-14 wild-wheel animate-wheel-spin" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white shadow" style={{ backgroundColor: SUIT_HEX[store.activeColor] || "#fff" }} />
            <span className="mt-1.5 text-[9px] font-bold text-gold/80 bg-black/40 px-2 py-0.5 rounded-full">COLOR</span>
          </div>
        </div>

        {/* Color picker */}
        <AnimatePresence>
          {store.showColorPicker && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-sm z-30">
              <motion.div initial={{ scale: 0.85, y: 10 }} animate={{ scale: 1, y: 0 }} className="glass rounded-3xl p-6">
                <h3 className="font-display font-bold text-lg text-center mb-4">Choose a Color</h3>
                <ColorPicker onSelect={handleColorSelect} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== Turn indicator + UNO ===== */}
      <div className="flex items-center justify-center gap-3 flex-shrink-0 py-1 relative">
        {settings.tutorialHints && store.isMyTurn && !hasPlayable && store.myHand.length > 0 && (
          <span className="text-[11px] font-bold text-gold bg-black/40 px-3 py-1 rounded-full">No moves — draw a card</span>
        )}
        <AnimatePresence>
          {store.isMyTurn && (
            <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-[11px] font-bold text-emerald-300 bg-black/40 px-3 py-1 rounded-full">YOUR TURN</motion.span>
          )}
        </AnimatePresence>
        <motion.button whileTap={{ scale: 0.94 }} onClick={handleUno} disabled={store.myHand.length !== 1 || me?.declaredUno}
          className={`uno-btn w-16 h-16 rounded-full font-display font-extrabold text-lg ${store.myHand.length === 1 && !me?.declaredUno ? "animate-glow-pulse" : ""}`}>
          UNO!
        </motion.button>
      </div>

      {/* ===== My hand ===== */}
      <div className="flex-shrink-0 px-2 pb-3 pt-1">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="relative frame-ring w-7 h-7"><img src={me?.avatar || "https://i.pravatar.cc/200?img=12"} alt="" className="w-full h-full rounded-[0.5rem] object-cover" /></div>
          <span className="text-xs font-bold">{me?.username || "You"}</span>
          <span className="count-badge text-[10px]">{store.myHand.length}</span>
        </div>
        <div className="flex justify-center overflow-x-auto pb-1" style={{ minHeight: "108px" }}>
          <div className="flex items-end" style={{ paddingLeft: `${Math.min(store.myHand.length * 7, 52)}px` }}>
            {store.myHand.map((card, index) => {
              const playable = isCardPlayable(card, store.topCard, store.activeColor, store.isMyTurn);
              return (
                <motion.div key={card.id} initial={anims ? { y: 90, x: -140, opacity: 0, rotate: -14, scale: 0.8 } : false} animate={{ y: playable ? -8 : 0, x: 0, opacity: 1, rotate: 0, scale: 1 }} transition={{ delay: anims ? index * 0.045 : 0, type: "spring", stiffness: 240, damping: 20 }}
                  className="flex-shrink-0 relative z-0 hover:z-10" style={{ marginLeft: `-${Math.min(store.myHand.length * 3.5, 26)}px` }}>
                  <UnoCard card={card} size="sm" playable={playable} onClick={playable ? () => handlePlayCard(index) : undefined} className={playable ? "" : "opacity-75 saturate-[0.85]"} />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== Chat ===== */}
      <AnimatePresence>
        {showChat && (
          <motion.div initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }} className="fixed right-0 top-0 bottom-0 w-72 glass border-l border-white/10 z-40 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <h3 className="font-display font-bold text-sm">Chat</h3>
              <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {store.messages.map((msg, i) => (<div key={i} className="text-xs"><span className="text-gold font-bold">{msg.username}:</span> <span className="text-[#caa89a]">{msg.message}</span></div>))}
            </div>
            <div className="p-3 border-t border-white/10 flex gap-2">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleChat()} placeholder="Type…" className="flex-1 panel-inset rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gold" />
              <button onClick={handleChat} className="btn-3d btn-gold px-3 text-xs">Send</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== UNO call burst ===== */}
      <AnimatePresence>
        {unoCall && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[55] flex items-center justify-center pointer-events-none">
            <div className="absolute w-[80vmin] h-[80vmin] rounded-full" style={{ background: "radial-gradient(circle, rgba(224,30,30,0.55) 0%, transparent 60%)" }} />
            {/* burst rays */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.span key={i} className="absolute origin-bottom" style={{ width: 4, height: "30vmin", background: "linear-gradient(to top, transparent, rgba(255,209,92,0.7))", rotate: `${i * 30}deg` }}
                initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: [0, 1, 0.8], opacity: [0, 1, 0] }} transition={{ duration: 1.2, delay: 0.05 }} />
            ))}
            <motion.div initial={{ scale: 0, rotate: -18 }} animate={{ scale: [0, 1.25, 1], rotate: [-18, 6, 0] }} transition={{ duration: 0.6, ease: "easeOut" }} className="relative text-center">
              <h1 className="font-display font-extrabold text-8xl sm:text-9xl" style={{ color: "#ffce3a", textShadow: "0 0 40px rgba(224,30,30,0.9), 0 6px 0 #a81212, 0 10px 20px rgba(0,0,0,0.7)" }}>UNO<span className="text-unored">!</span></h1>
              <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="font-display font-extrabold text-3xl text-emerald-400 mt-2" style={{ textShadow: "0 0 20px rgba(67,209,102,0.7)" }}>+100</motion.p>
            </motion.div>
            <Confetti count={50} />
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
            <p className="text-center text-[#caa89a] text-xs mb-3">{store.roundScores.find((s) => s.roundWinner)?.username} wins the round</p>
            <div className="space-y-1.5 mb-3">
              {store.roundScores.map((score, i) => {
                const av = store.players.find((p) => p.id === score.playerId)?.avatar;
                return (
                  <div key={i} className={`flex items-center gap-2.5 p-2 rounded-lg ${score.roundWinner ? "bg-gold/10 border border-gold/30" : "panel-inset"}`}>
                    {av && <div className="frame-ring w-8 h-8 flex-shrink-0"><img src={av} alt="" className="w-full h-full rounded-[0.5rem] object-cover" /></div>}
                    <span className="text-sm flex-1 flex items-center gap-1 truncate">{score.username}{score.roundWinner && <Crown className="w-3.5 h-3.5 text-gold flex-shrink-0" />}</span>
                    <span className={`text-sm font-bold ${score.roundWinner ? "text-gold" : "text-gray-500"}`}>+{score.points}</span>
                  </div>
                );
              })}
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
          <Confetti loop count={140} />
          <Overlay gold>
            <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0, y: [0, -6, 0] }} transition={{ scale: { type: "spring", stiffness: 200 }, y: { duration: 2, repeat: Infinity } }} className="text-7xl text-center mb-1" style={{ filter: "drop-shadow(0 0 20px rgba(255,209,92,0.7))" }}>🏆</motion.div>
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
              className="mx-auto mb-4 px-5 py-1.5 rounded-xl text-center font-display font-extrabold text-2xl text-white w-fit"
              style={{ background: "linear-gradient(180deg,#f04444,#c5271f)", boxShadow: "0 4px 0 #8a1010, 0 8px 18px rgba(0,0,0,0.5)" }}>
              {store.matchWinner === me?.username ? "YOU WON!" : `${store.matchWinner} WINS!`}
            </motion.div>

            {/* rewards */}
            <p className="text-[10px] font-bold tracking-[0.15em] text-[#caa15a] text-center mb-2">REWARDS</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[{ icon: "🪙", v: "+500", c: "#ffd255" }, { icon: "✦", v: "+250", c: "#a356f0" }, { icon: "🎁", v: "+1", c: "#f0a818" }].map((r, i) => (
                <motion.div key={i} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 + i * 0.1 }} className="panel-inset rounded-xl p-3 text-center">
                  <div className="text-2xl mb-1" style={{ color: r.c }}>{r.icon}</div>
                  <p className="font-bold text-sm" style={{ color: r.c }}>{r.v}</p>
                </motion.div>
              ))}
            </div>

            <div className="space-y-1.5 mb-4">
              {store.finalScores.map((score, i) => {
                const av = store.players.find((p) => p.id === score.playerId)?.avatar;
                const rankColor = i === 0 ? "text-gold" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-gray-500";
                return (
                  <div key={i} className={`flex items-center gap-2.5 p-1.5 rounded-lg ${i === 0 ? "bg-gold/10 border border-gold/30" : "panel-inset"}`}>
                    <span className={`font-display font-extrabold w-5 text-center ${rankColor}`}>{score.rank}</span>
                    {av && <div className={`w-8 h-8 flex-shrink-0 frame-ring ${i === 0 ? "" : "opacity-80"}`}><img src={av} alt="" className="w-full h-full rounded-[0.5rem] object-cover" /></div>}
                    <span className="text-sm flex-1 flex items-center gap-1 truncate">{score.username}{i === 0 && <Crown className="w-4 h-4 text-gold flex-shrink-0" />}</span>
                    <span className="text-gold font-bold text-sm">{score.score} pts</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button onClick={handleLeave} className="btn-3d btn-gold flex-1 py-3 flex items-center justify-center gap-2 text-sm"><RotateCcw className="w-4 h-4" /> Play Again</button>
              <button onClick={handleLeave} className="btn-3d btn-ghost flex-1 py-3 text-sm">Back to Home</button>
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
      <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} className={`glass rounded-3xl p-6 max-w-xs w-full ${gold ? "border border-gold/40" : ""}`}>
        {children}
      </motion.div>
    </motion.div>
  );
}

const CONFETTI_COLORS = ["#e4322b", "#f6b500", "#18a558", "#1e7fd6", "#ffd15c", "#ffffff"];

function Confetti({ count = 90, loop = false }: { count?: number; loop?: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: 50 + (Math.random() - 0.5) * 90,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 8,
        delay: Math.random() * (loop ? 2.2 : 0.5),
        duration: 2.2 + Math.random() * 1.8,
        drift: (Math.random() - 0.5) * 220,
        rotate: (Math.random() - 0.5) * 720,
        rounded: Math.random() > 0.5,
      })),
    [count, loop],
  );
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[60]">
      {pieces.map((p) => (
        <motion.span key={p.id} initial={{ y: "-10vh", x: 0, opacity: 1, rotate: 0 }} animate={{ y: "110vh", x: p.drift, opacity: [1, 1, 0.9, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn", repeat: loop ? Infinity : 0, repeatDelay: loop ? Math.random() * 1.5 : 0 }}
          style={{ position: "absolute", left: `${p.left}%`, top: 0, width: p.size, height: p.size * (p.rounded ? 1 : 1.6), backgroundColor: p.color, borderRadius: p.rounded ? "9999px" : "2px", boxShadow: `0 0 6px ${p.color}88` }} />
      ))}
    </div>
  );
}
