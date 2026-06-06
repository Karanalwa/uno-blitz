import { useState, useEffect, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Sparkles, Play, Bot, HelpCircle, Settings, Globe, Gamepad2, Trophy, ShoppingBag } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { useSound } from "@/hooks/useSound";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { AVATARS } from "@/engine/types";

// Decorative fan of cards behind the logo
const FAN = [
  { label: "7", cls: "suit-red", rot: -18, x: -96, glyph: "glyph-red" },
  { label: "4", cls: "suit-yellow", rot: -8, x: -48, glyph: "glyph-yellow" },
  { label: "U", cls: "suit-blue", rot: 0, x: 0, glyph: "glyph-blue" },
  { label: "2", cls: "suit-green", rot: 8, x: 48, glyph: "glyph-green" },
  { label: "+4", cls: "suit-wild", rot: 18, x: 96, glyph: "glyph-wild" },
];

export default function Home() {
  const navigate = useNavigate();
  const store = useGameStore();
  const sound = useSound();
  const { connected } = useMultiplayer();

  const [showCreate, setShowCreate] = useState(false);
  const [showSoloSetup, setShowSoloSetup] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [username, setUsername] = useState(store.username || localStorage.getItem("uno_username") || "");
  const [roomCode, setRoomCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [mode, setMode] = useState<"classic" | "quick">("classic");
  const [botCount, setBotCount] = useState(3);
  const [avatarIndex, setAvatarIndex] = useState(0);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (store.phase === "lobby" && store.roomCode) navigate("/lobby");
  }, [store.phase, store.roomCode, navigate]);

  const ensureName = () => {
    const name = username.trim() || "Player";
    setUsername(name);
    localStorage.setItem("uno_username", name);
    store.setPlayerName(name);
    store.setPlayerAvatar(AVATARS[avatarIndex]);
    return name;
  };

  const handleCreate = () => {
    const name = ensureName();
    sound.playButton();
    store.createRoom({ name: `${name}'s Room`, maxPlayers, mode, turnTimer: 30 }, name);
  };

  const handleJoin = () => {
    if (roomCode.length !== 6) return;
    const name = ensureName();
    sound.playButton();
    store.joinRoom(roomCode, name);
  };

  const handleSoloPlay = () => {
    const name = ensureName();
    sound.playButton();
    store.setSettings({ botCount, mode });
    store.startLocalGame();
    navigate("/game");
  };

  return (
    <div className="casino-bg min-h-[100dvh] w-full flex flex-col text-[#e2e2ec] overflow-x-hidden">
      {/* ===== Top bar ===== */}
      <header className="flex items-center justify-between px-5 py-3 z-20">
        <div className="flex items-center gap-2">
          <span className="font-display font-extrabold text-lg text-gold glow-gold-text">UNO Blitz</span>
          <span
            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              connected ? "text-emerald-300 bg-emerald-400/10" : "text-gold bg-gold/10"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-gold"} animate-pulse`} />
            {connected ? "ONLINE" : "SOLO"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowHelp(true)} className="p-2 rounded-full glass-bright text-gray-300 hover:text-white">
            <HelpCircle className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-full glass-bright text-gray-300 hover:text-white">
            <Settings className="w-4 h-4" />
          </button>
          <div className="chip-frame w-9 h-9">
            <img src={AVATARS[avatarIndex]} alt="" className="w-full h-full rounded-full object-cover" />
          </div>
        </div>
      </header>

      {/* ===== Main ===== */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 z-10">
        {/* Logo + card fan */}
        <div className="relative flex flex-col items-center mb-6">
          <div className="relative h-28 w-full flex items-end justify-center mb-1">
            {FAN.map((c, i) => (
              <div key={i} className="absolute" style={{ transform: `translateX(${c.x}px)` }}>
                <motion.div
                  initial={{ y: 40, opacity: 0, rotate: 0 }}
                  animate={{ y: [0, -8, 0], opacity: 1, rotate: c.rot }}
                  transition={{
                    opacity: { delay: i * 0.08 },
                    rotate: { delay: i * 0.08, type: "spring", stiffness: 180 },
                    y: { duration: 3, repeat: Infinity, delay: i * 0.2 },
                  }}
                  className="uno-shell w-16 h-24"
                >
                  <div className={`uno-inner ${c.cls}`}>
                    <div className="uno-oval" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`uno-glyph text-2xl ${c.glyph}`}>{c.label}</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>

          <motion.h1
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl tracking-tight leading-none"
          >
            <span className="text-[#fff2da]">UNO</span>{" "}
            <span className="text-gold glow-gold-text">BLITZ</span>
          </motion.h1>
          <p className="font-body font-bold tracking-[0.4em] text-[11px] text-[#d1c5b0] mt-1">THE PREMIUM CARD ARENA</p>
        </div>

        {/* Avatar carousel */}
        <div className="mb-5 w-full max-w-md">
          <p className="text-center text-[10px] font-bold tracking-[0.2em] text-[#d1c5b0] mb-2">CHOOSE YOUR AVATAR</p>
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
            {AVATARS.map((av, i) => (
              <button
                key={i}
                onClick={() => { setAvatarIndex(i); sound.playButton(); }}
                className={`flex-shrink-0 transition-transform ${i === avatarIndex ? "scale-110" : "opacity-50 hover:opacity-90"}`}
              >
                <div className={`w-11 h-11 ${i === avatarIndex ? "chip-frame chip-frame-active" : "chip-frame"}`}>
                  <img src={av} alt="" className="w-full h-full rounded-full object-cover" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your name"
          maxLength={15}
          className="w-72 mb-4 glass rounded-xl px-4 py-2.5 text-center text-[#e2e2ec] font-body font-semibold placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-electric/60"
        />

        {/* Primary actions */}
        <div className="flex gap-3 w-full max-w-md mb-5">
          <button
            onClick={() => { ensureName(); setShowSoloSetup(true); sound.playButton(); }}
            className="btn-3d btn-gold flex-1 flex items-center justify-center gap-2 py-3.5 text-base"
          >
            <Bot className="w-5 h-5" /> Play Solo
          </button>
          <button
            onClick={() => { if (!connected) return; ensureName(); setShowCreate(true); sound.playButton(); }}
            disabled={!connected}
            className="btn-3d btn-cyan flex-1 flex items-center justify-center gap-2 py-3.5 text-base"
          >
            <Globe className="w-5 h-5" /> Play Online
          </button>
        </div>

        {/* Multiplayer lobby panel */}
        <div className="glass rounded-2xl p-4 w-full max-w-md">
          <div className="flex items-center justify-between mb-3">
            <span className="font-display font-bold text-sm text-[#e2e2ec]">Multiplayer Lobby</span>
            <button
              onClick={() => { if (!connected) return; ensureName(); setShowCreate(true); sound.playButton(); }}
              disabled={!connected}
              className="flex items-center gap-1 text-xs font-bold text-electric disabled:opacity-40"
            >
              <Users className="w-3.5 h-3.5" /> CREATE ROOM
            </button>
          </div>

          <p className="text-[10px] font-bold tracking-[0.15em] text-[#d1c5b0] mb-2">JOIN WITH ROOM CODE</p>
          <div className="relative mb-3" onClick={() => codeInputRef.current?.focus()}>
            <div className="flex justify-between gap-1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`otp-box flex items-center justify-center flex-1 ${roomCode.length === i ? "ring-2 ring-electric" : ""}`}>
                  {roomCode[i] ?? ""}
                </div>
              ))}
            </div>
            <input
              ref={codeInputRef}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Room code"
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={!connected || roomCode.length !== 6}
            className="btn-3d btn-ghost w-full py-3 text-sm"
          >
            {connected ? "Join Match" : "Connecting…"}
          </button>
        </div>
      </main>

      {/* ===== Bottom nav ===== */}
      <nav className="flex items-center justify-around px-6 py-3 glass border-t border-white/5 z-20">
        <NavBtn icon={<Gamepad2 className="w-5 h-5" />} label="Play" active />
        <NavBtn icon={<Users className="w-5 h-5" />} label="Lobby" onClick={() => { if (connected) { ensureName(); setShowCreate(true); } }} />
        <NavBtn icon={<ShoppingBag className="w-5 h-5" />} label="Store" />
        <NavBtn icon={<Trophy className="w-5 h-5" />} label="Friends" />
      </nav>

      {/* ===== Modals ===== */}
      <AnimatePresence>
        {showSoloSetup && (
          <Modal onClose={() => setShowSoloSetup(false)}>
            <h2 className="font-display text-xl font-extrabold mb-4 flex items-center gap-2"><Bot className="w-5 h-5 text-gold" /> Solo Setup</h2>
            <label className="text-xs text-[#d1c5b0] mb-1 block">Bot Opponents: {botCount}</label>
            <input type="range" min={1} max={5} value={botCount} onChange={(e) => setBotCount(parseInt(e.target.value))} className="w-full accent-gold mb-4" />
            <label className="text-xs text-[#d1c5b0] mb-1 block">Mode</label>
            <div className="flex gap-2 mb-5">
              {(["classic", "quick"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize ${mode === m ? "btn-3d btn-gold" : "btn-3d btn-ghost"}`}>{m}</button>
              ))}
            </div>
            <button onClick={handleSoloPlay} className="btn-3d btn-cyan w-full py-3 flex items-center justify-center gap-2"><Play className="w-5 h-5" /> Start Game</button>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreate && (
          <Modal onClose={() => setShowCreate(false)}>
            <h2 className="font-display text-xl font-extrabold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-electric" /> Create Room</h2>
            <label className="text-xs text-[#d1c5b0] mb-1 block">Max Players: {maxPlayers}</label>
            <input type="range" min={2} max={8} value={maxPlayers} onChange={(e) => setMaxPlayers(parseInt(e.target.value))} className="w-full accent-electric mb-4" />
            <label className="text-xs text-[#d1c5b0] mb-1 block">Mode</label>
            <div className="flex gap-2 mb-5">
              {(["classic", "quick"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize ${mode === m ? "btn-3d btn-cyan" : "btn-3d btn-ghost"}`}>{m}</button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="btn-3d btn-ghost flex-1 py-3 text-sm">Cancel</button>
              <button onClick={handleCreate} className="btn-3d btn-cyan flex-1 py-3 text-sm">Create</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHelp && (
          <Modal onClose={() => setShowHelp(false)} wide>
            <h2 className="font-display text-2xl font-extrabold mb-4 flex items-center gap-2"><HelpCircle className="w-6 h-6 text-electric" /> How to Play</h2>
            <div className="space-y-2.5 text-[#d1c5b0] text-sm">
              <HelpRow title="Goal">Empty your hand first. Score points from opponents. First to target wins!</HelpRow>
              <HelpRow title="Playing Cards">Match the top card by color or number. Tap a glowing card to play it.</HelpRow>
              <HelpRow title="Actions"><span className="text-suit-yellow">Skip</span> · <span className="text-suit-blue">Reverse</span> · <span className="text-suit-green">+2 Draw</span> · <span className="text-gold">Wild</span> · <span className="text-suit-red">Wild +4</span></HelpRow>
              <HelpRow title="UNO!">Hit the UNO! button when you have 1 card left, or risk a draw-2 penalty.</HelpRow>
            </div>
            <button onClick={() => setShowHelp(false)} className="btn-3d btn-gold w-full mt-4 py-3"><Sparkles className="w-4 h-4 inline mr-1" /> Got it!</button>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }: { icon: ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-0.5 ${active ? "nav-item-active" : "nav-item hover:text-white"}`}>
      {icon}
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}

function Modal({ children, onClose, wide }: { children: ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 20 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className={`glass rounded-2xl p-6 w-full ${wide ? "max-w-md" : "max-w-sm"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function HelpRow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="glass-bright rounded-lg p-3">
      <h3 className="text-[#e2e2ec] font-bold mb-1 text-sm">{title}</h3>
      <p>{children}</p>
    </div>
  );
}
