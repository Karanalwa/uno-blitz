import { useState, useEffect, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Play, Bot, HelpCircle, Zap, Plus, Bell, Menu as MenuIcon,
  UserPlus, Gift, Trophy, Award, History, ShoppingBag, Coins, Gem, ChevronRight, X,
} from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { useSound } from "@/hooks/useSound";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { AVATARS } from "@/engine/types";

const NAV = [
  { icon: Users, label: "Friends" },
  { icon: Gift, label: "Rewards" },
  { icon: Trophy, label: "Leaderboard" },
  { icon: Award, label: "Achievements" },
  { icon: History, label: "History" },
  { icon: ShoppingBag, label: "Shop" },
];

const LEADERBOARD = [
  { rank: 1, name: "SarahChamp", pts: 15230 },
  { rank: 2, name: "AlexGamer", pts: 12450, me: true },
  { rank: 3, name: "KingUNO", pts: 11200 },
  { rank: 4, name: "PlayMaster", pts: 9850 },
  { rank: 5, name: "CardWizard", pts: 8410 },
];

const FAN = [
  { label: "2", cls: "suit-green", rot: -16, x: -104, glyph: "glyph-green" },
  { label: "7", cls: "suit-red", rot: -8, x: -52, glyph: "glyph-red" },
  { label: "U", cls: "suit-blue", rot: 0, x: 0, glyph: "glyph-blue" },
  { label: "4", cls: "suit-yellow", rot: 8, x: 52, glyph: "glyph-yellow" },
  { label: "+4", cls: "suit-wild", rot: 16, x: 104, glyph: "glyph-wild" },
];

export default function Home() {
  const navigate = useNavigate();
  const store = useGameStore();
  const sound = useSound();
  const { connected } = useMultiplayer();

  const [modal, setModal] = useState<null | "solo" | "create" | "help" | "avatar" | "leaderboard">(null);
  const [username, setUsername] = useState(store.username || localStorage.getItem("uno_username") || "AlexGamer");
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

  const handleSoloPlay = () => {
    ensureName();
    sound.playButton();
    store.setSettings({ botCount, mode });
    store.startLocalGame();
    navigate("/game");
  };

  const handleQuickMatch = () => {
    ensureName();
    sound.playShuffle();
    store.setSettings({ botCount: 3, mode: "classic" });
    store.startLocalGame();
    navigate("/game");
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

  return (
    <div className="casino-bg min-h-[100dvh] w-full flex flex-col text-[#ece6da] overflow-x-hidden">
      {/* ===== Top bar ===== */}
      <header className="flex items-center justify-between px-4 py-3 z-20">
        <button onClick={() => setModal("avatar")} className="flex items-center gap-2.5 group">
          <div className="relative frame-ring w-10 h-10">
            <img src={AVATARS[avatarIndex]} alt="" className="w-full h-full rounded-[0.65rem] object-cover" />
            <span className="absolute -bottom-1 -right-1 level-badge">28</span>
          </div>
          <div className="text-left leading-tight">
            <p className="font-display font-extrabold text-sm">{username || "AlexGamer"}</p>
            <p className="text-[10px] text-gold">Lv. 28</p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <span className="currency-pill text-xs text-gold"><Coins className="w-3.5 h-3.5" /> 12,450 <Plus className="w-3 h-3 text-emerald-400" /></span>
          <span className="currency-pill text-xs text-sky-300 hidden sm:inline-flex"><Gem className="w-3.5 h-3.5" /> 1,250 <Plus className="w-3 h-3 text-emerald-400" /></span>
          <button className="p-2 rounded-full glass-bright text-gray-300 hover:text-white relative">
            <Bell className="w-4 h-4" /><span className="absolute top-1 right-1 w-1.5 h-1.5 bg-suit-red rounded-full" />
          </button>
          <button onClick={() => setModal("help")} className="p-2 rounded-full glass-bright text-gray-300 hover:text-white"><MenuIcon className="w-4 h-4" /></button>
        </div>
      </header>

      {/* ===== Body grid ===== */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[210px_1fr_250px] gap-4 px-4 pb-4 max-w-7xl w-full mx-auto">
        {/* Left nav */}
        <nav className="glass rounded-2xl p-2 flex flex-row lg:flex-col gap-1 overflow-x-auto order-2 lg:order-1">
          {NAV.map(({ icon: Icon, label }) => (
            <button
              key={label}
              onClick={() => { sound.playButton(); if (label === "Leaderboard") setModal("leaderboard"); }}
              className="nav-item flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/5 hover:text-white whitespace-nowrap flex-shrink-0"
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </nav>

        {/* Center */}
        <section className="flex flex-col items-center justify-center order-1 lg:order-2 py-2">
          {/* Logo with fan */}
          <div className="relative flex flex-col items-center mb-5">
            <div className="relative h-24 w-full flex items-end justify-center">
              {FAN.map((c, i) => (
                <div key={i} className="absolute" style={{ transform: `translateX(${c.x}px)` }}>
                  <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: [0, -8, 0], opacity: 1, rotate: c.rot }}
                    transition={{ opacity: { delay: i * 0.08 }, rotate: { delay: i * 0.08, type: "spring", stiffness: 180 }, y: { duration: 3, repeat: Infinity, delay: i * 0.2 } }}
                    className="uno-shell w-14 h-20"
                  >
                    <div className={`uno-inner ${c.cls}`}><div className="uno-oval" /><div className="absolute inset-0 flex items-center justify-center"><span className={`uno-glyph text-xl ${c.glyph}`}>{c.label}</span></div></div>
                  </motion.div>
                </div>
              ))}
            </div>
            <motion.h1 initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}
              className="font-display font-extrabold text-6xl sm:text-7xl tracking-tight leading-none mt-1"
              style={{ color: "#ffce3a", textShadow: "0 0 30px rgba(224,30,30,0.6), 0 4px 0 #a81212, 0 6px 14px rgba(0,0,0,0.6)" }}>
              UNO<span className="text-unored">!</span>
            </motion.h1>
            <p className="font-body font-bold tracking-[0.4em] text-[11px] text-[#caa15a] mt-1">PREMIUM CARD ARENA</p>
          </div>

          {/* Action buttons */}
          <div className="w-full max-w-sm flex flex-col gap-2.5">
            <button onClick={() => { ensureName(); setModal("solo"); sound.playButton(); }} className="btn-3d btn-gold w-full py-4 flex items-center justify-center gap-2 text-lg">
              <Play className="w-5 h-5 fill-current" /> PLAY NOW
            </button>
            <button onClick={handleQuickMatch} className="btn-3d btn-blue w-full py-3.5 flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 fill-current" /> QUICK MATCH
            </button>
            <div className="flex gap-2.5">
              <button onClick={() => { if (!connected) return; ensureName(); setModal("create"); sound.playButton(); }} disabled={!connected} className="btn-3d btn-purple flex-1 py-3 flex items-center justify-center gap-1.5 text-sm">
                <Users className="w-4 h-4" /> CREATE ROOM
              </button>
              <button onClick={() => codeInputRef.current?.focus()} disabled={!connected} className="btn-3d btn-green flex-1 py-3 flex items-center justify-center gap-1.5 text-sm">
                <UserPlus className="w-4 h-4" /> JOIN ROOM
              </button>
            </div>

            {/* inline join code */}
            <div className="panel-inset rounded-xl p-2.5 mt-1">
              <p className="text-[10px] font-bold tracking-[0.15em] text-[#caa15a] mb-1.5 text-center">ENTER ROOM CODE</p>
              <div className="relative" onClick={() => codeInputRef.current?.focus()}>
                <div className="flex justify-center gap-1.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={`otp-box flex items-center justify-center w-9 h-11 text-lg ${roomCode.length === i ? "ring-2 ring-gold" : ""}`}>{roomCode[i] ?? ""}</div>
                  ))}
                </div>
                <input ref={codeInputRef} value={roomCode} onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" maxLength={6} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" aria-label="Room code" />
              </div>
              <button onClick={handleJoin} disabled={!connected || roomCode.length !== 6} className="btn-3d btn-ghost w-full py-2 mt-2 text-sm">
                {connected ? "Join Match" : "Connecting…"}
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-500">{connected ? "● Server online — multiplayer ready" : "○ Solo mode available offline"}</p>
          </div>
        </section>

        {/* Right widgets */}
        <aside className="flex flex-col gap-4 order-3">
          {/* Daily reward */}
          <div className="glass rounded-2xl p-4 text-center">
            <p className="text-[10px] font-bold tracking-[0.15em] text-[#caa15a] mb-2">DAILY REWARD</p>
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-5xl mb-2">🎁</motion.div>
            <button onClick={() => sound.playUno()} className="btn-3d btn-gold w-full py-2 text-xs mb-2">CLAIM</button>
            <p className="text-[10px] text-gray-500">Next in 23h 45m</p>
          </div>
          {/* Season pass */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold tracking-[0.15em] text-[#caa15a]">SEASON PASS</p>
              <span className="level-badge">25</span>
            </div>
            <div className="panel-inset rounded-full h-2.5 overflow-hidden mb-1.5">
              <motion.div initial={{ width: 0 }} animate={{ width: "60%" }} transition={{ duration: 1, delay: 0.3 }} className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #ffd255, #f0a818)" }} />
            </div>
            <p className="text-[10px] text-gray-400 text-right">120 / 200 XP</p>
          </div>
          {/* mini leaderboard */}
          <div className="glass rounded-2xl p-3 hidden lg:block">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold tracking-[0.15em] text-[#caa15a]">TOP PLAYERS</p>
              <button onClick={() => setModal("leaderboard")} className="text-[10px] text-gold flex items-center">All <ChevronRight className="w-3 h-3" /></button>
            </div>
            {LEADERBOARD.slice(0, 3).map((r) => (
              <div key={r.rank} className={`flex items-center justify-between text-xs py-1 px-1.5 rounded ${r.me ? "bg-gold/10" : ""}`}>
                <span className="flex items-center gap-1.5"><span className={r.rank === 1 ? "text-gold" : "text-gray-500"}>#{r.rank}</span> {r.name}</span>
                <span className="font-bold text-gold">{r.pts.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </aside>
      </main>

      {/* ===== Modals ===== */}
      <AnimatePresence>
        {modal === "solo" && (
          <Modal onClose={() => setModal(null)}>
            <h2 className="font-display text-xl font-extrabold mb-4 flex items-center gap-2"><Bot className="w-5 h-5 text-gold" /> Solo Setup</h2>
            <label className="text-xs text-[#caa15a] mb-1 block">Bot Opponents: {botCount}</label>
            <input type="range" min={1} max={5} value={botCount} onChange={(e) => setBotCount(parseInt(e.target.value))} className="w-full accent-gold mb-4" />
            <label className="text-xs text-[#caa15a] mb-1 block">Mode</label>
            <div className="flex gap-2 mb-5">
              {(["classic", "quick"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize ${mode === m ? "btn-3d btn-gold" : "btn-3d btn-ghost"}`}>{m}</button>
              ))}
            </div>
            <button onClick={handleSoloPlay} className="btn-3d btn-green w-full py-3 flex items-center justify-center gap-2"><Play className="w-5 h-5" /> Start Game</button>
          </Modal>
        )}

        {modal === "create" && (
          <Modal onClose={() => setModal(null)}>
            <h2 className="font-display text-xl font-extrabold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-purple-400" /> Create Room</h2>
            <label className="text-xs text-[#caa15a] mb-1 block">Max Players: {maxPlayers}</label>
            <input type="range" min={2} max={8} value={maxPlayers} onChange={(e) => setMaxPlayers(parseInt(e.target.value))} className="w-full accent-purple-500 mb-4" />
            <label className="text-xs text-[#caa15a] mb-1 block">Mode</label>
            <div className="flex gap-2 mb-5">
              {(["classic", "quick"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize ${mode === m ? "btn-3d btn-purple" : "btn-3d btn-ghost"}`}>{m}</button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="btn-3d btn-ghost flex-1 py-3 text-sm">Cancel</button>
              <button onClick={handleCreate} className="btn-3d btn-purple flex-1 py-3 text-sm">Create</button>
            </div>
          </Modal>
        )}

        {modal === "avatar" && (
          <Modal onClose={() => setModal(null)}>
            <h2 className="font-display text-xl font-extrabold mb-4">Choose Avatar</h2>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your name" maxLength={15}
              className="w-full panel-inset rounded-xl px-4 py-2.5 text-center font-bold mb-4 focus:outline-none focus:ring-2 focus:ring-gold" />
            <div className="grid grid-cols-4 gap-3 mb-4">
              {AVATARS.map((av, i) => (
                <button key={i} onClick={() => { setAvatarIndex(i); sound.playButton(); }} className={`transition-transform ${i === avatarIndex ? "scale-105" : "opacity-60 hover:opacity-100"}`}>
                  <div className={`w-full aspect-square ${i === avatarIndex ? "frame-ring" : "frame-ring opacity-70"}`}><img src={av} alt="" className="w-full h-full rounded-[0.65rem] object-cover" /></div>
                </button>
              ))}
            </div>
            <button onClick={() => { ensureName(); setModal(null); }} className="btn-3d btn-gold w-full py-3">Save</button>
          </Modal>
        )}

        {modal === "leaderboard" && (
          <Modal onClose={() => setModal(null)} wide>
            <h2 className="font-display text-xl font-extrabold mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-gold" /> Leaderboard</h2>
            <div className="space-y-1.5">
              {LEADERBOARD.map((r) => (
                <div key={r.rank} className={`flex items-center justify-between p-2.5 rounded-lg ${r.me ? "bg-gold/10 border border-gold/30" : "panel-inset"}`}>
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span className={`w-6 text-center ${r.rank === 1 ? "text-gold" : r.rank <= 3 ? "text-amber-600" : "text-gray-500"}`}>{r.rank === 1 ? "👑" : `#${r.rank}`}</span>
                    {r.name}{r.me && <span className="text-[10px] text-gold">(You)</span>}
                  </span>
                  <span className="font-bold text-gold">{r.pts.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setModal(null)} className="btn-3d btn-ghost w-full mt-4 py-2.5">Close</button>
          </Modal>
        )}

        {modal === "help" && (
          <Modal onClose={() => setModal(null)} wide>
            <h2 className="font-display text-2xl font-extrabold mb-4 flex items-center gap-2"><HelpCircle className="w-6 h-6 text-gold" /> How to Play</h2>
            <div className="space-y-2.5 text-[#caa89a] text-sm">
              <HelpRow title="Goal">Empty your hand first. Score points from opponents. First to target wins!</HelpRow>
              <HelpRow title="Playing Cards">Match the top card by color or number. Tap a glowing card to play it.</HelpRow>
              <HelpRow title="Actions"><span className="text-suit-yellow">Skip</span> · <span className="text-suit-blue">Reverse</span> · <span className="text-suit-green">+2</span> · <span className="text-gold">Wild</span> · <span className="text-suit-red">Wild +4</span></HelpRow>
              <HelpRow title="UNO!">Hit the UNO! button at 1 card left, or risk a draw-2 penalty.</HelpRow>
            </div>
            <button onClick={() => setModal(null)} className="btn-3d btn-gold w-full mt-4 py-3">Got it!</button>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function Modal({ children, onClose, wide }: { children: ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 20 }} transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className={`glass rounded-2xl p-6 w-full ${wide ? "max-w-md" : "max-w-sm"} relative`} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
        {children}
      </motion.div>
    </motion.div>
  );
}

function HelpRow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="panel-inset rounded-lg p-3">
      <h3 className="text-[#ece6da] font-bold mb-1 text-sm">{title}</h3>
      <p>{children}</p>
    </div>
  );
}
