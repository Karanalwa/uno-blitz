import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Check, Copy, ArrowLeft, Share2, Settings2, Send, Play, MessageSquare, Smile, UserPlus } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { useSound } from "@/hooks/useSound";

const SETTINGS_ROWS = [
  { key: "stacking", label: "Stacking", on: true },
  { key: "sevenzero", label: "7-0 Rule", on: false },
  { key: "jumpin", label: "Jump-In", on: true },
  { key: "plus2draw", label: "+2 On Draw", on: true },
];

export default function Lobby() {
  const navigate = useNavigate();
  const store = useGameStore();
  const sound = useSound();
  const [chatInput, setChatInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"chat" | "emoji">("chat");
  const [toggles, setToggles] = useState<Record<string, boolean>>(Object.fromEntries(SETTINGS_ROWS.map((r) => [r.key, r.on])));

  useEffect(() => {
    if (store.phase !== "lobby" || !store.roomCode) navigate("/home");
  }, [store.phase, store.roomCode, navigate]);
  useEffect(() => {
    if (store.gamePhase === "playing" && store.topCard) navigate("/game");
  }, [store.gamePhase, store.topCard, navigate]);

  const handleReady = () => { sound.playButton(); store.toggleReady(); };
  const handleStart = () => { sound.playShuffle(); store.startGame(); };
  const handleLeave = () => { sound.playButton(); store.leaveRoom(); navigate("/home"); };
  const copyCode = () => { if (store.roomCode) { navigator.clipboard.writeText(store.roomCode); setCopied(true); setTimeout(() => setCopied(false), 1500); } };
  const sendChat = () => { if (!chatInput.trim()) return; store.sendChat(chatInput.trim()); setChatInput(""); };
  const share = (where: string) => {
    const text = `Join my UNO Blitz room! Code: ${store.roomCode}`;
    if (where === "whatsapp") window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    else if (where === "facebook") window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`, "_blank");
    else if (navigator.share) navigator.share({ title: "UNO Blitz", text }).catch(() => {});
    else copyCode();
  };

  const readyCount = store.players.filter((p) => p.isReady).length;
  const canStart = store.isHost && readyCount >= 2 && readyCount === store.players.length;
  const maxSlots = store.settings?.playerCount || 4;
  const EMOJIS = ["👋", "😎", "🔥", "😂", "👍", "🎉", "😮", "🤝", "❤️", "🍀", "💪", "🎯"];

  return (
    <div className="casino-bg min-h-[100dvh] w-full flex flex-col text-[#ece6da] overflow-x-hidden p-3 sm:p-4">
      {/* header */}
      <div className="flex items-center justify-between mb-4 max-w-6xl w-full mx-auto">
        <button onClick={handleLeave} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white touch-target"><ArrowLeft className="w-4 h-4" /> Leave</button>
        <h1 className="font-display font-extrabold text-lg sm:text-xl tracking-wide">GAME LOBBY</h1>
        <span className="text-xs text-gray-500">{readyCount}/{store.players.length} ready</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3 sm:gap-4 max-w-6xl w-full mx-auto flex-1">
        {/* ===== Lobby panel ===== */}
        <div className="glass rounded-2xl p-3 sm:p-4 flex flex-col">
          {/* code + mode */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="panel-inset rounded-xl px-4 py-3 flex-1">
              <p className="text-[10px] text-[#caa15a] font-bold tracking-wider">ROOM CODE</p>
              <button onClick={copyCode} className="flex items-center gap-2">
                <span className="font-display font-extrabold text-xl sm:text-2xl text-gold tracking-[0.2em]">{store.roomCode}</span>
                <Copy className="w-4 h-4 text-gray-400" />
                {copied && <span className="text-[10px] text-emerald-400">Copied!</span>}
              </button>
            </div>
            <div className="panel-inset rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 wild-wheel" />
              <div>
                <p className="font-display font-bold text-sm capitalize">{store.mode === "quick" ? "Quick" : "Classic"} Mode</p>
                <p className="text-[10px] text-gray-400">{maxSlots} Players</p>
              </div>
              <Settings2 className="w-4 h-4 text-gray-500 ml-2" />
            </div>
          </div>

          {/* players */}
          <div className="space-y-2 flex-1">
            {store.players.map((player, i) => (
              <motion.div key={player.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="panel-inset rounded-xl px-3 py-2.5 flex items-center gap-3">
                <div className="relative frame-ring w-10 h-10 flex-shrink-0">
                  <img src={player.avatar} alt="" className="w-full h-full rounded-[0.6rem] object-cover" />
                  <span className="absolute -bottom-1 -right-1 level-badge">{((i * 7 + 12) % 40) + 5}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate flex items-center gap-1.5">{player.username}{player.id === store.playerId && <span className="text-[10px] text-gold">(You)</span>}</p>
                </div>
                {player.isHost && <span className="flex items-center gap-1 text-[10px] font-bold text-gold"><Crown className="w-3.5 h-3.5" /> Host</span>}
                {player.isReady ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full"><Check className="w-3 h-3" /> Ready</span>
                ) : (
                  <span className="text-[10px] font-bold text-gray-500 px-2 py-1">Waiting…</span>
                )}
              </motion.div>
            ))}
            {Array.from({ length: Math.max(0, maxSlots - store.players.length) }).map((_, i) => (
              <div key={`e-${i}`} className="rounded-xl px-3 py-2.5 flex items-center gap-3 border border-dashed border-white/10 opacity-50">
                <div className="w-10 h-10 rounded-[0.6rem] border-2 border-dashed border-white/15 flex items-center justify-center"><UserPlus className="w-4 h-4 text-gray-600" /></div>
                <span className="text-xs text-gray-600">Waiting for player…</span>
              </div>
            ))}
          </div>

          {/* invite */}
          <div className="mt-4">
            <p className="text-[10px] font-bold tracking-wider text-[#caa15a] mb-2">INVITE FRIENDS</p>
            <div className="flex gap-2">
              <InviteBtn label="WhatsApp" color="#25D366" onClick={() => share("whatsapp")} />
              <InviteBtn label="Messenger" color="#0084FF" onClick={() => share("messenger")} />
              <InviteBtn label="Facebook" color="#1877F2" onClick={() => share("facebook")} />
              <InviteBtn label="More" color="#555" onClick={() => share("more")} icon={<Share2 className="w-4 h-4" />} />
            </div>
          </div>

          {/* ready + start */}
          <div className="flex gap-2.5 mt-4">
            <button onClick={handleReady} className={`btn-3d ${store.isReady ? "btn-green" : "btn-ghost"} flex-1 py-3 flex items-center justify-center gap-2 touch-target`}>
              <Check className="w-5 h-5" /> {store.isReady ? "Ready!" : "Ready Up"}
            </button>
            {store.isHost ? (
              <button onClick={handleStart} disabled={!canStart} className={`btn-3d ${canStart ? "btn-gold animate-glow-pulse" : "btn-ghost"} flex-[1.5] py-3 flex items-center justify-center gap-2 touch-target`}>
                <Play className="w-5 h-5 fill-current" /> START GAME
              </button>
            ) : (
              <div className="btn-3d btn-ghost flex-[1.5] py-3 text-center text-sm opacity-70">Waiting for host…</div>
            )}
          </div>
        </div>

        {/* ===== Side: chat + settings ===== */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* chat */}
          <div className="glass rounded-2xl flex flex-col flex-1 min-h-[220px] overflow-hidden">
            <div className="flex border-b border-white/10">
              <button onClick={() => setTab("chat")} className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 ${tab === "chat" ? "text-gold border-b-2 border-gold" : "text-gray-500"}`}><MessageSquare className="w-3.5 h-3.5" /> CHAT</button>
              <button onClick={() => setTab("emoji")} className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 ${tab === "emoji" ? "text-gold border-b-2 border-gold" : "text-gray-500"}`}><Smile className="w-3.5 h-3.5" /> EMOJI</button>
            </div>
            {tab === "chat" ? (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 text-xs">
                  {store.messages.length === 0 && <p className="text-gray-600">Say hi to your opponents…</p>}
                  {store.messages.map((m, i) => (<p key={i}><span className="text-gold font-bold">{m.username}:</span> <span className="text-[#caa89a]">{m.message}</span></p>))}
                </div>
                <div className="p-2.5 flex gap-2 border-t border-white/10">
                  <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="Type a message…" className="flex-1 panel-inset rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gold" />
                  <button onClick={sendChat} className="btn-3d btn-gold px-3 touch-target"><Send className="w-4 h-4" /></button>
                </div>
              </>
            ) : (
              <div className="flex-1 grid grid-cols-6 gap-1.5 p-3 content-start">
                {EMOJIS.map((e) => (<button key={e} onClick={() => { store.sendChat(e); }} className="text-2xl hover:scale-125 transition-transform">{e}</button>))}
              </div>
            )}
          </div>

          {/* match settings */}
          <div className="glass rounded-2xl p-3">
            <p className="text-[10px] font-bold tracking-wider text-[#caa15a] mb-2 flex items-center gap-1.5"><Settings2 className="w-3.5 h-3.5" /> MATCH SETTINGS</p>
            <SettingRow label="Game Mode" value={<span className="text-gold capitalize">{store.mode}</span>} />
            {SETTINGS_ROWS.map((r) => (
              <div key={r.key} className="flex items-center justify-between py-1.5">
                <span className="text-xs text-gray-300">{r.label}</span>
                <button
                  onClick={() => { if (!store.isHost) return; sound.playButton(); setToggles((t) => ({ ...t, [r.key]: !t[r.key] })); }}
                  className={`toggle-pill flex ${toggles[r.key] ? "toggle-on justify-end" : "toggle-off justify-start"}`}
                >
                  <span className="toggle-knob" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InviteBtn({ label, color, onClick, icon }: { label: string; color: string; onClick: () => void; icon?: ReactNode }) {
  return (
    <button onClick={onClick} className="flex-1 flex flex-col items-center gap-1 group touch-target">
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform" style={{ background: color }}>
        {icon || label[0]}
      </div>
      <span className="text-[9px] text-gray-400">{label}</span>
    </button>
  );
}

function SettingRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5">
      <span className="text-xs text-gray-300">{label}</span>
      <span className="text-xs font-bold">{value}</span>
    </div>
  );
}
