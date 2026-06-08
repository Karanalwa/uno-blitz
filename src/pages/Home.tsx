import { useState, useEffect, type ReactNode, type CSSProperties } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home as HomeIcon, Users, Gift, Trophy, Award, History, ShoppingCart,
  Bell, Settings as SettingsIcon, Coins, Gem, Plus, Play, Bot, HelpCircle, UserPlus, X, Clock,
} from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { useSound } from "@/hooks/useSound";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { AVATARS } from "@/engine/types";
import { useWallet, levelInfo } from "@/lib/wallet";
import { useSettings } from "@/lib/settings";

const NAV = [
  { icon: HomeIcon, label: "HOME", to: "/home", selected: true },
  { icon: Users, label: "FRIENDS", to: "/friends" },
  { icon: Gift, label: "REWARDS", to: "/rewards" },
  { icon: Trophy, label: "LEADERBOARD", to: "/leaderboard" },
  { icon: Award, label: "ACHIEVEMENTS", to: "/achievements" },
  { icon: History, label: "HISTORY", to: "/history" },
  { icon: ShoppingCart, label: "SHOP", to: "", disabled: true },
];

// Floating cards: [label, suit class, glyph, css positioning, rotation, size]
const cw = (px: number) => ({ ["--cw" as string]: `${px}px` }) as CSSProperties;

export default function Home() {
  const navigate = useNavigate();
  const store = useGameStore();
  const sound = useSound();
  const { connected } = useMultiplayer();
  const wallet = useWallet();
  const fx = useSettings();

  const [modal, setModal] = useState<null | "solo" | "help" | "avatar">(null);
  const [username, setUsername] = useState(store.username || localStorage.getItem("uno_username") || "AlexGamer");
  const [mode, setMode] = useState<"classic" | "quick">("classic");
  const [botCount, setBotCount] = useState(3);
  const [avatar, setAvatar] = useState(() => localStorage.getItem("uno_playerAvatar") || AVATARS[0]);

  useEffect(() => {
    if (store.phase === "lobby" && store.roomCode) navigate("/lobby");
  }, [store.phase, store.roomCode, navigate]);

  const ensureName = () => {
    const name = username.trim() || "Player";
    setUsername(name);
    localStorage.setItem("uno_username", name);
    store.setPlayerName(name);
    store.setPlayerAvatar(avatar);
    return name;
  };
  const handleSoloPlay = () => { ensureName(); sound.playButton(); store.setSettings({ botCount, mode }); store.startLocalGame(); navigate("/game"); };

  const navTo = (to: string, disabled?: boolean) => { if (disabled || !to) return; sound.playButton(); navigate(to); };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden text-white"
      style={{ background: "radial-gradient(ellipse 80% 60% at 50% 32%, #ff2d22 0%, #c01008 30%, #6e0604 56%, #2a0100 82%, #120000 100%)" }}>

      {/* vignette */}
      <div className="absolute inset-0 pointer-events-none z-0" style={{ boxShadow: "inset 0 0 220px 60px rgba(0,0,0,0.75)" }} />
      {/* bottom arena glow */}
      <div className="absolute left-1/2 -bottom-20 -translate-x-1/2 w-[140%] h-[40vh] pointer-events-none z-0"
        style={{ background: "radial-gradient(ellipse at center, rgba(255,70,40,0.55) 0%, rgba(255,40,30,0.15) 35%, transparent 62%)" }}>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] aspect-[2/1] rounded-[50%] border-2 border-red-400/30" style={{ boxShadow: "0 0 60px rgba(255,80,50,0.4), inset 0 0 60px rgba(255,80,50,0.25)" }} />
      </div>
      {/* spark particles */}
      {fx.particles && (
      <div className="absolute inset-0 pointer-events-none z-0">
        {Array.from({ length: 26 }).map((_, i) => (
          <motion.span key={i} className="absolute"
            style={{ left: `${(i * 37 + 9) % 100}%`, top: `${(i * 29 + 13) % 100}%`, width: 3 + (i % 3) * 2, height: 3 + (i % 3) * 2, background: "#ff6a4a", borderRadius: 2, transform: "rotate(45deg)", boxShadow: "0 0 8px rgba(255,90,60,0.9)" }}
            animate={{ y: [0, -26, 0], opacity: [0.1, 0.7, 0.1] }}
            transition={{ duration: 4 + (i % 4), repeat: Infinity, delay: (i % 6) * 0.5, ease: "easeInOut" }} />
        ))}
      </div>
      )}

      {/* floating cards */}
      {fx.backgroundFx && (<>
      <FloatCard label="5" suit="suit-red" glyph="glyph-red" style={{ top: "13%", left: "18%" }} rot={-20} size={56} />
      <FloatCard label="+4" suit="suit-wild" glyph="glyph-wild" style={{ top: "11%", right: "16%" }} rot={16} size={56} wild />
      <FloatCard label="8" suit="suit-yellow" glyph="glyph-yellow" style={{ top: "50%", left: "20%" }} rot={-18} size={54} />
      <FloatCard label="⟲" suit="suit-green" glyph="glyph-green" style={{ bottom: "16%", right: "8%" }} rot={14} size={58} />
      <FloatBack style={{ bottom: "2%", left: "2%" }} rot={-14} size={64} />
      </>)}

      {/* ===== Top bar ===== */}
      <header className="relative z-20 flex items-center justify-between px-3 pt-3 pb-1 gap-2">
        <button onClick={() => navigate("/profile")} className="flex items-center gap-2 flex-shrink-0">
          <div className="relative frame-ring w-12 h-12 rounded-full" style={{ borderRadius: "9999px" }}>
            <img src={avatar} alt="" className="w-full h-full rounded-full object-cover" />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#3a0000]" />
          </div>
          <div className="text-left leading-tight">
            <p className="font-display font-extrabold text-sm">{username || "AlexGamer"}</p>
            <span className="inline-flex items-center gap-1 currency-pill text-[10px] text-gold px-1.5 py-0.5">👑 Lv. {levelInfo(wallet.xp).level}</span>
          </div>
        </button>

        <div className="flex items-center gap-1.5">
          <span className="currency-pill text-xs text-gold gap-1"><Coins className="w-3.5 h-3.5" /> {wallet.coins.toLocaleString()} <Plus className="w-3 h-3 text-gold" /></span>
          <span className="currency-pill text-xs text-sky-300 gap-1 hidden sm:inline-flex"><Gem className="w-3.5 h-3.5" /> {wallet.gems.toLocaleString()} <Plus className="w-3 h-3 text-gold" /></span>
          <button onClick={() => navigate("/rewards")} className="relative p-2 rounded-full bg-black/45 border border-white/10 text-gray-200 hover:text-white">
            <Bell className="w-4 h-4" /><span className="absolute -top-1 -right-1 w-4 h-4 bg-suit-red rounded-full text-[9px] font-bold flex items-center justify-center border border-[#3a0000]">3</span>
          </button>
          <button onClick={() => navigate("/settings")} className="p-2 rounded-full bg-black/45 border border-white/10 text-gray-200 hover:text-white"><SettingsIcon className="w-4 h-4" /></button>
        </div>
      </header>

      {/* ===== Body: sidebar + content ===== */}
      <div className="relative z-10 flex flex-1">
        {/* left rail */}
        <nav className="flex-shrink-0 w-[68px] sm:w-[76px] py-2 flex flex-col items-stretch gap-1 bg-black/40 rounded-r-2xl border-r border-white/5">
          {NAV.map(({ icon: Icon, label, to, selected, disabled }) => (
            <button key={label} onClick={() => navTo(to, disabled)}
              className={`flex flex-col items-center gap-1 py-2 mx-1.5 rounded-xl transition ${selected ? "bg-gold/10 text-gold border border-gold/50 shadow-[0_0_14px_rgba(245,166,35,0.35)]" : disabled ? "text-gray-500" : "text-gray-300 hover:text-white hover:bg-white/5"}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[8px] font-bold tracking-wide">{label}</span>
            </button>
          ))}
        </nav>

        {/* content area */}
        <div className="relative flex-1 flex flex-col px-3 pb-5">
          {/* right widgets */}
          <div className="absolute top-2 right-2 w-[120px] sm:w-[138px] flex flex-col gap-3 z-20">
            <div className="glass rounded-2xl p-2.5 text-center">
              <p className="text-[10px] font-extrabold tracking-wide text-gold mb-1">DAILY REWARD</p>
              <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-4xl mb-1" style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))" }}>🎁</motion.div>
              <button onClick={() => navigate("/rewards")} className="currency-pill text-[11px] text-gold w-full justify-center"><Clock className="w-3 h-3" /> 23h 45m</button>
            </div>
            <div className="glass rounded-2xl p-2.5 text-center">
              <p className="text-[10px] font-extrabold tracking-wide text-gold mb-1">SEASON PASS</p>
              <div className="text-4xl mb-1" style={{ filter: "drop-shadow(0 0 8px rgba(155,89,182,0.7))" }}>🛡️</div>
              <div className="panel-inset rounded-full h-3.5 overflow-hidden relative">
                <div className="h-full rounded-full" style={{ width: "60%", background: "linear-gradient(90deg,#ffd255,#f0a818)" }} />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-extrabold text-[#3a2600]">120 / 200</span>
              </div>
            </div>
          </div>

          {/* logo */}
          <div className="flex-1 flex items-center justify-center min-h-[34vh]">
            <UnoLogo />
          </div>

          {/* buttons */}
          <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto pr-1">
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => { ensureName(); setModal("solo"); sound.playButton(); }}
              className="btn-3d btn-gold w-full h-[58px] flex items-center justify-center gap-2 text-2xl font-extrabold tracking-wide animate-glow-pulse">
              PLAY NOW
            </motion.button>
            <div className="flex gap-3 w-full">
              <button onClick={() => { if (!connected) return; ensureName(); sound.playButton(); navigate("/create"); }} disabled={!connected} className="btn-3d btn-purple flex-1 h-[58px] flex flex-col items-center justify-center gap-0.5">
                <span className="text-sm font-extrabold tracking-wide">CREATE ROOM</span><Users className="w-4 h-4" />
              </button>
              <button onClick={() => { if (!connected) return; ensureName(); sound.playButton(); navigate("/join"); }} disabled={!connected} className="btn-3d btn-green flex-1 h-[58px] flex flex-col items-center justify-center gap-0.5">
                <span className="text-sm font-extrabold tracking-wide">JOIN ROOM</span><UserPlus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

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
            <button onClick={() => setModal("avatar")} className="w-full text-center text-xs text-gray-400 mt-3 hover:text-white">Change avatar / name</button>
          </Modal>
        )}
        {modal === "avatar" && (
          <Modal onClose={() => setModal(null)}>
            <h2 className="font-display text-xl font-extrabold mb-4">Choose Avatar</h2>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your name" maxLength={15} className="w-full panel-inset rounded-xl px-4 py-2.5 text-center font-bold mb-4 focus:outline-none focus:ring-2 focus:ring-gold" />
            <div className="grid grid-cols-4 gap-3 mb-4">
              {AVATARS.map((av, i) => (
                <button key={i} onClick={() => { setAvatar(av); sound.playButton(); }} className={`transition-transform ${av === avatar ? "scale-105" : "opacity-60 hover:opacity-100"}`}>
                  <div className={`w-full aspect-square frame-ring ${av === avatar ? "" : "opacity-70"}`}><img src={av} alt="" className="w-full h-full rounded-[0.65rem] object-cover" /></div>
                </button>
              ))}
            </div>
            <button onClick={() => { ensureName(); setModal(null); }} className="btn-3d btn-gold w-full py-3">Save</button>
          </Modal>
        )}
        {modal === "help" && (
          <Modal onClose={() => setModal(null)} wide>
            <h2 className="font-display text-2xl font-extrabold mb-4 flex items-center gap-2"><HelpCircle className="w-6 h-6 text-gold" /> How to Play</h2>
            <div className="space-y-2.5 text-[#caa89a] text-sm">
              <HelpRow title="Goal">Empty your hand first. Score points from opponents. First to target wins!</HelpRow>
              <HelpRow title="Playing Cards">Match the top card by color or number. Tap a glowing card to play it.</HelpRow>
              <HelpRow title="UNO!">Hit the UNO! button at 1 card left, or risk a draw-2 penalty.</HelpRow>
            </div>
            <button onClick={() => setModal(null)} className="btn-3d btn-gold w-full mt-4 py-3">Got it!</button>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---- the UNO logo (red ellipse + glow + wordmark) ---- */
function UnoLogo() {
  return (
    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }} className="relative" style={{ width: "min(64vw, 250px)", aspectRatio: "1.45 / 1" }}>
      <div className="absolute inset-0 rounded-[50%]" style={{ background: "radial-gradient(circle at 50% 38%, #ff3b30, #d40e08 70%, #a60a05 100%)", boxShadow: "0 0 0 7px #fff, 0 0 50px 12px rgba(255,90,60,0.75), 0 12px 34px rgba(0,0,0,0.55)" }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: "min(17vw, 66px)", color: "#ffce1f", WebkitTextStrokeWidth: "min(1.2vw, 4px)", WebkitTextStrokeColor: "#1a1a1a", paintOrder: "stroke fill", transform: "rotate(-4deg)", textShadow: "0 4px 6px rgba(0,0,0,0.4)", letterSpacing: "-0.02em" }}>UNO</span>
      </div>
      <span className="absolute top-1 right-2 text-white text-[10px] font-bold">™</span>
    </motion.div>
  );
}

function FloatCard({ label, suit, glyph, style, rot, size, wild }: { label: string; suit: string; glyph: string; style: CSSProperties; rot: number; size: number; wild?: boolean }) {
  return (
    <motion.div className="absolute z-0 pointer-events-none" style={style}
      initial={{ opacity: 0 }} animate={{ opacity: 0.95, y: [0, -14, 0], rotate: [rot, rot + 4, rot] }}
      transition={{ opacity: { duration: 1 }, y: { duration: 6 + size / 20, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" } }}>
      <div className="uno-shell" style={{ ...cw(size), width: size, height: size * 1.42 }}>
        <div className={`uno-inner ${suit}`}>
          <div className="uno-oval" style={wild ? { background: "conic-gradient(#ff0000 0deg 90deg,#ffcc00 90deg 180deg,#00aa44 180deg 270deg,#0066ff 270deg 360deg)" } : undefined} />
          <div className="absolute inset-0 flex items-center justify-center"><span className={`uno-glyph ${wild ? "text-white" : glyph}`}>{label}</span></div>
        </div>
      </div>
    </motion.div>
  );
}

function FloatBack({ style, rot, size }: { style: CSSProperties; rot: number; size: number }) {
  return (
    <motion.div className="absolute z-0 pointer-events-none" style={style}
      initial={{ opacity: 0 }} animate={{ opacity: 0.95, y: [0, -12, 0], rotate: [rot, rot + 3, rot] }}
      transition={{ opacity: { duration: 1 }, y: { duration: 7, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 7, repeat: Infinity, ease: "easeInOut" } }}>
      <div className="uno-shell" style={{ ...cw(size), width: size, height: size * 1.42 }}>
        <div className="uno-inner" style={{ background: "linear-gradient(160deg,#222,#000)" }}>
          <div className="absolute left-1/2 top-1/2" style={{ width: "75%", height: "85%", transform: "translate(-50%,-50%) rotate(40deg)", borderRadius: "50%", border: "calc(var(--cw)*0.05) solid #fff", background: "radial-gradient(circle at 50% 42%,#ff3b33,#c40d0d)" }} />
          <div className="absolute inset-0 flex items-center justify-center"><span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontStyle: "italic", fontWeight: 900, color: "#ffce3a", WebkitTextStrokeWidth: "calc(var(--cw)*0.018)", WebkitTextStrokeColor: "rgba(0,0,0,0.6)", paintOrder: "stroke fill", transform: "rotate(-20deg)", fontSize: "calc(var(--cw)*0.26)" }}>UNO</span></div>
        </div>
      </div>
    </motion.div>
  );
}

function Modal({ children, onClose, wide }: { children: ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 20 }} transition={{ type: "spring", stiffness: 280, damping: 22 }} className={`glass rounded-2xl p-6 w-full ${wide ? "max-w-md" : "max-w-sm"} relative`} onClick={(e) => e.stopPropagation()}>
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
