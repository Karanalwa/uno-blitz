import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Edit3, Award, X, Check, Upload, Copy, Coins, Gem } from "lucide-react";
import { ScreenShell } from "@/components/ScreenShell";
import { ACHIEVEMENTS } from "@/data/mockProfile";
import { AVATARS } from "@/engine/types";
import { useGameStore } from "@/store/gameStore";
import { getStats, winRate } from "@/lib/playerStats";
import { getUserId } from "@/lib/identity";
import { useWallet, levelInfo } from "@/lib/wallet";
import { fileToAvatar } from "@/lib/avatarUpload";
import { useSound } from "@/hooks/useSound";

const TIER_COLOR: Record<string, string> = { gold: "#f5a623", silver: "#c0c7d0", bronze: "#cd7f32", purple: "#9b59b6" };

export default function Profile() {
  const navigate = useNavigate();
  const store = useGameStore();
  const sound = useSound();

  const [name, setName] = useState(store.username || localStorage.getItem("uno_username") || "Player");
  const [avatar, setAvatar] = useState(localStorage.getItem("uno_playerAvatar") || AVATARS[0]);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [draftAvatar, setDraftAvatar] = useState(avatar);
  const [uploadErr, setUploadErr] = useState("");
  const [idCopied, setIdCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const stats = getStats();
  const userId = getUserId();
  const wallet = useWallet();
  const lvl = levelInfo(wallet.xp);
  const copyId = () => { navigator.clipboard?.writeText(userId); setIdCopied(true); setTimeout(() => setIdCopied(false), 1500); sound.playButton(); };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadErr("");
      setDraftAvatar(await fileToAvatar(file));
      sound.playButton();
    } catch (err: any) {
      setUploadErr(err?.message || "Upload failed");
    }
  };

  const openEdit = () => { setDraftName(name); setDraftAvatar(avatar); setEditing(true); };
  const saveEdit = () => {
    const finalName = draftName.trim() || "Player";
    setName(finalName);
    setAvatar(draftAvatar);
    store.setPlayerName(finalName);
    store.setPlayerAvatar(draftAvatar);
    sound.playButton();
    setEditing(false);
  };

  return (
    <ScreenShell title="PROFILE" maxWidth="max-w-2xl">
      {/* header card */}
      <div className="glass rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 mb-4">
        <button onClick={openEdit} className="relative frame-ring w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 group">
          <img src={avatar} alt="" className="w-full h-full rounded-xl object-cover" />
          <span className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"><Edit3 className="w-5 h-5" /></span>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-extrabold text-xl sm:text-2xl truncate">{name}</h2>
            <button onClick={openEdit} className="text-gray-400 hover:text-white"><Edit3 className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <p className="text-sm text-gold font-bold">Lv. {lvl.level}</p>
            <span className="currency-pill text-[11px] text-gold"><Coins className="w-3 h-3" /> {wallet.coins.toLocaleString()}</span>
            <span className="currency-pill text-[11px] text-sky-300"><Gem className="w-3 h-3" /> {wallet.gems.toLocaleString()}</span>
          </div>
          <button onClick={copyId} className="flex items-center gap-1.5 panel-inset rounded-lg px-2.5 py-1 mb-2 hover:brightness-125 transition">
            <span className="text-[11px] text-gray-400">ID</span>
            <span className="font-display font-bold text-xs text-gold tracking-wider">{userId}</span>
            <Copy className="w-3 h-3 text-gray-400" />
            {idCopied && <span className="text-[10px] text-emerald-400">Copied!</span>}
          </button>
          <div className="panel-inset rounded-full h-2.5 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(lvl.into / lvl.need) * 100}%`, background: "linear-gradient(90deg,#f5a623,#e67e22)" }} />
          </div>
          <p className="text-[10px] text-gray-400 text-right mt-1">{lvl.into} / {lvl.need} XP · Level {lvl.level}</p>
        </div>
      </div>

      {/* real stats */}
      <div className="glass rounded-2xl p-3 sm:p-4 mb-4 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        <Stat label="Games Played" value={stats.gamesPlayed} />
        <Stat label="Wins" value={stats.wins} />
        <Stat label="Win Rate" value={winRate(stats)} accent />
        <Stat label="Longest Streak" value={stats.longestStreak} />
        <Stat label="UNO Calls" value={stats.unoCalls} />
        <Stat label="Draw Fours" value={stats.drawFours} />
      </div>
      {stats.gamesPlayed === 0 && (
        <p className="text-center text-[11px] text-gray-500 -mt-2 mb-4">Play a game to start building your stats.</p>
      )}

      {/* achievements */}
      <div className="glass rounded-2xl p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold tracking-[0.15em] text-[#caa15a] flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> ACHIEVEMENTS</p>
          <button onClick={() => navigate("/achievements")} className="text-[11px] text-gold">VIEW ALL</button>
        </div>
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1">
          {ACHIEVEMENTS.map((a) => (
            <button key={a.name} onClick={() => navigate("/achievements")} className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-2xl panel-inset hover:brightness-125 transition" style={{ boxShadow: `inset 0 0 18px ${TIER_COLOR[a.tier]}33` }} title={a.name}>
              <span style={{ filter: `drop-shadow(0 0 6px ${TIER_COLOR[a.tier]})` }}>🛡️</span>
            </button>
          ))}
        </div>
      </div>

      {/* edit modal */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditing(false)}>
            <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 20 }} transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="glass rounded-2xl p-6 w-full max-w-sm relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setEditing(false)} className="absolute top-3 right-3 text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
              <h2 className="font-display text-xl font-extrabold mb-4">Edit Profile</h2>

              {/* avatar preview + upload */}
              <div className="flex flex-col items-center mb-4">
                <div className="frame-ring w-20 h-20 mb-2"><img src={draftAvatar} alt="" className="w-full h-full rounded-2xl object-cover" /></div>
                <button onClick={() => fileRef.current?.click()} className="btn-3d btn-ghost px-3 py-1.5 text-xs flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> Upload Photo</button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
                {uploadErr && <p className="text-[11px] text-suit-red mt-1">{uploadErr}</p>}
              </div>

              <label className="text-xs text-[#caa15a] mb-1 block">Display Name</label>
              <input value={draftName} onChange={(e) => setDraftName(e.target.value)} maxLength={15}
                className="w-full panel-inset rounded-xl px-4 py-2.5 font-bold mb-4 focus:outline-none focus:ring-2 focus:ring-gold" />
              <label className="text-xs text-[#caa15a] mb-1 block">Or pick an avatar</label>
              <div className="grid grid-cols-4 gap-3 mb-5">
                {AVATARS.map((av, i) => (
                  <button key={i} onClick={() => { setDraftAvatar(av); sound.playButton(); }} className={`transition-transform ${av === draftAvatar ? "scale-105" : "opacity-60 hover:opacity-100"}`}>
                    <div className={`w-full aspect-square frame-ring ${av === draftAvatar ? "" : "opacity-70"}`}><img src={av} alt="" className="w-full h-full rounded-[0.6rem] object-cover" /></div>
                  </button>
                ))}
              </div>
              <button onClick={saveEdit} className="btn-3d btn-gold w-full py-3 flex items-center justify-center gap-2"><Check className="w-5 h-5" /> Save</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ScreenShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="panel-inset rounded-xl p-3 text-center">
      <p className={`font-display font-extrabold text-xl sm:text-2xl ${accent ? "text-gold" : "text-white"}`}>{value}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
