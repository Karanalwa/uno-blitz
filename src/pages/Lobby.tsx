import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Crown, Check, Copy, ArrowLeft, User, Share2, Settings2, Send, UserPlus, Play, Gamepad2, History, ShoppingBag } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { useSound } from "@/hooks/useSound";

export default function Lobby() {
  const navigate = useNavigate();
  const store = useGameStore();
  const sound = useSound();
  const [chatInput, setChatInput] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (store.phase !== "lobby" || !store.roomCode) navigate("/");
  }, [store.phase, store.roomCode, navigate]);

  useEffect(() => {
    if (store.gamePhase === "playing" && store.topCard) navigate("/game");
  }, [store.gamePhase, store.topCard, navigate]);

  const handleReady = () => { sound.playButton(); store.toggleReady(); };
  const handleStart = () => { sound.playButton(); store.startGame(); };
  const handleLeave = () => { sound.playButton(); store.leaveRoom(); navigate("/"); };
  const copyCode = () => { if (store.roomCode) { navigator.clipboard.writeText(store.roomCode); setCopied(true); setTimeout(() => setCopied(false), 1500); } };
  const shareCode = () => { if (store.roomCode && navigator.share) navigator.share({ title: "Join my UNO Blitz room!", text: `Room code: ${store.roomCode}` }); };
  const sendChat = () => { if (!chatInput.trim()) return; store.sendChat(chatInput.trim()); setChatInput(""); };

  const readyCount = store.players.filter((p) => p.isReady).length;
  const canStart = store.isHost && readyCount >= 2 && readyCount === store.players.length;
  const me = store.players.find((p) => p.id === store.playerId);
  const maxSlots = store.settings?.playerCount || 6;

  return (
    <div className="casino-bg min-h-[100dvh] w-full flex text-[#e2e2ec] overflow-x-hidden">
      {/* ===== Sidebar (desktop) ===== */}
      <aside className="hidden md:flex flex-col w-56 glass border-r border-white/5 p-4 gap-4 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-display font-extrabold text-lg text-gold glow-gold-text">UNO Blitz</span>
        </div>
        <div className="glass-bright rounded-xl p-3 flex items-center gap-3">
          <div className="chip-frame chip-frame-gold w-11 h-11">
            <img src={me?.avatar || "https://i.pravatar.cc/200?img=12"} alt="" className="w-full h-full rounded-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-sm truncate">{me?.username || store.username || "Player"}</p>
            <p className="text-[10px] text-gold">{store.isHost ? "Host" : "Player"}</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1 mt-2">
          <SideItem icon={<User className="w-4 h-4" />} label="Profile" />
          <SideItem icon={<Gamepad2 className="w-4 h-4" />} label="Lobby" active />
          <SideItem icon={<History className="w-4 h-4" />} label="Match History" />
          <SideItem icon={<ShoppingBag className="w-4 h-4" />} label="Store" />
        </nav>
        <button onClick={handleLeave} className="mt-auto flex items-center gap-2 text-sm text-gray-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Leave room
        </button>
      </aside>

      {/* ===== Main ===== */}
      <main className="flex-1 flex flex-col p-4 md:p-6 min-w-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4 mb-4">
          <div>
            <button onClick={handleLeave} className="md:hidden flex items-center gap-1 text-xs text-gray-400 hover:text-white mb-2">
              <ArrowLeft className="w-4 h-4" /> Leave
            </button>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl">{store.roomName || "Game Lounge"}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-[#d1c5b0]">ROOM CODE:</span>
              <button onClick={copyCode} className="flex items-center gap-1.5 glass-bright px-2.5 py-1 rounded-lg">
                <span className="font-display font-bold text-gold tracking-[0.2em]">{store.roomCode}</span>
                <Copy className="w-3.5 h-3.5 text-gray-400" />
              </button>
              {copied && <span className="text-[10px] text-emerald-400">Copied!</span>}
            </div>
          </div>

          {/* Game settings */}
          <div className="glass rounded-2xl p-3 border border-electric/30 w-full md:w-auto md:min-w-[150px]">
            <div className="flex items-center gap-1.5 mb-2 text-electric">
              <Settings2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold tracking-[0.15em]">GAME SETTINGS</span>
            </div>
            <SettingRow label="Mode" value={store.mode === "quick" ? "Quick Blitz" : "Classic Blitz"} />
            <SettingRow label="Max Players" value={`${maxSlots} slots`} />
            <SettingRow label="Turn Timer" value={`${store.turnTimer}s`} />
          </div>
        </div>

        {/* Felt / players */}
        <div className="flex-1 glass rounded-3xl relative flex flex-col items-center justify-center p-6 mb-4 min-h-[280px]">
          {/* decorative center card stack */}
          <div className="relative mb-6">
            <div className="uno-shell w-20 h-28 absolute -left-3 top-2 rotate-[-10deg] opacity-60">
              <div className="uno-inner suit-blue"><div className="uno-oval" /></div>
            </div>
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity }} className="uno-shell w-20 h-28 relative card-active-glow">
              <div className="uno-inner suit-red">
                <div className="uno-oval" />
                <div className="absolute inset-0 flex items-center justify-center"><span className="uno-glyph text-3xl glyph-red">7</span></div>
              </div>
            </motion.div>
          </div>

          {/* player slots */}
          <div className="flex flex-wrap items-start justify-center gap-5">
            {store.players.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex flex-col items-center gap-1 w-20"
              >
                <div className="relative">
                  <div className={`w-14 h-14 ${player.isReady ? "chip-frame chip-frame-active" : "chip-frame"}`}>
                    <img src={player.avatar} alt={player.username} className="w-full h-full rounded-full object-cover" />
                  </div>
                  {player.isHost && (
                    <span className="absolute -top-2 -right-1 bg-gold rounded-full p-1 shadow"><Crown className="w-3 h-3 text-[#3e2e00]" /></span>
                  )}
                </div>
                <span className="text-xs font-bold truncate max-w-full">{player.username}</span>
                <span className={`text-[10px] font-bold ${player.isReady ? "text-emerald-400" : "text-gray-500"}`}>
                  {player.isReady ? "● READY" : "○ WAITING"}
                </span>
              </motion.div>
            ))}

            {Array.from({ length: Math.max(0, maxSlots - store.players.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="flex flex-col items-center gap-1 w-20 opacity-50">
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-gray-600" />
                </div>
                <span className="text-[10px] text-gray-600">Open Slot</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: chat + actions */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Chat */}
          <div className="glass rounded-2xl p-3 flex-1 flex flex-col min-h-[120px] max-h-[160px]">
            <span className="text-[10px] font-bold tracking-[0.15em] text-[#d1c5b0] mb-2">LOBBY CHAT</span>
            <div className="flex-1 overflow-y-auto space-y-1 text-xs pr-1">
              {store.messages.length === 0 && <p className="text-gray-600">Say hi to your opponents…</p>}
              {store.messages.map((m, i) => (
                <p key={i}><span className="text-electric font-bold">{m.username}:</span> <span className="text-[#d1c5b0]">{m.message}</span></p>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder="Type a message…"
                className="flex-1 glass-bright rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-electric"
              />
              <button onClick={sendChat} className="btn-3d btn-ghost px-3"><Send className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 lg:w-72">
            <button onClick={handleReady} className={`btn-3d ${store.isReady ? "btn-cyan" : "btn-ghost"} w-full py-3 flex items-center justify-center gap-2`}>
              <Check className="w-5 h-5" /> {store.isReady ? "Ready!" : "Ready Up"}
            </button>
            <div className="flex gap-2">
              {typeof navigator !== "undefined" && "share" in navigator && (
                <button onClick={shareCode} className="btn-3d btn-ghost flex-1 py-3 flex items-center justify-center gap-2 text-sm"><Share2 className="w-4 h-4" /> Invite</button>
              )}
              {store.isHost ? (
                <button onClick={handleStart} disabled={!canStart} className={`btn-3d ${canStart ? "btn-gold animate-glow-pulse" : "btn-ghost"} flex-1 py-3 flex items-center justify-center gap-2 text-sm`}>
                  <Play className="w-4 h-4" /> Start Game
                </button>
              ) : (
                <div className="btn-3d btn-ghost flex-1 py-3 text-center text-sm opacity-70">Waiting for host…</div>
              )}
            </div>
            <p className="text-center text-[10px] text-gray-500">Minimum 2 ready players required ({readyCount}/{store.players.length})</p>
          </div>
        </div>
      </main>
    </div>
  );
}

function SideItem({ icon, label, active }: { icon: ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold ${active ? "bg-gold/15 text-gold" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
      {icon} {label}
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs py-0.5">
      <span className="text-gray-400">{label}</span>
      <span className="font-bold text-[#e2e2ec]">{value}</span>
    </div>
  );
}
