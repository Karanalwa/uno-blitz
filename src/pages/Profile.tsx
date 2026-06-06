import { useNavigate } from "react-router";
import { Edit3, Award } from "lucide-react";
import { ScreenShell } from "@/components/ScreenShell";
import { PROFILE, ACHIEVEMENTS } from "@/data/mockProfile";
import { AVATARS } from "@/engine/types";
import { useGameStore } from "@/store/gameStore";

const TIER_COLOR: Record<string, string> = { gold: "#ffd255", silver: "#c0c7d0", bronze: "#cd7f32", purple: "#a356f0" };

export default function Profile() {
  const navigate = useNavigate();
  const store = useGameStore();
  const name = store.username || PROFILE.name;
  const avatar = localStorage.getItem("uno_playerAvatar") || AVATARS[0];
  const s = PROFILE.stats;

  return (
    <ScreenShell title="PROFILE" maxWidth="max-w-2xl">
      {/* header card */}
      <div className="glass rounded-2xl p-5 flex items-center gap-4 mb-4">
        <div className="relative frame-ring w-20 h-20 flex-shrink-0">
          <img src={avatar} alt="" className="w-full h-full rounded-xl object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-extrabold text-2xl truncate">{name}</h2>
            <button className="text-gray-400 hover:text-white"><Edit3 className="w-4 h-4" /></button>
          </div>
          <p className="text-sm text-gold mb-2">Lv. {PROFILE.level}</p>
          <div className="panel-inset rounded-full h-2.5 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(PROFILE.xp / PROFILE.xpMax) * 100}%`, background: "linear-gradient(90deg,#ffd255,#f0a818)" }} />
          </div>
          <p className="text-[10px] text-gray-400 text-right mt-1">{PROFILE.xp} / {PROFILE.xpMax} XP</p>
        </div>
      </div>

      {/* stats */}
      <div className="glass rounded-2xl p-4 mb-4 grid grid-cols-3 gap-3">
        <Stat label="Games Played" value={s.gamesPlayed} />
        <Stat label="Wins" value={s.wins} />
        <Stat label="Win Rate" value={s.winRate} accent />
        <Stat label="Longest Streak" value={s.longestStreak} />
        <Stat label="UNO Calls" value={s.unoCalls} />
        <Stat label="Draw Fours" value={s.drawFours} />
      </div>

      {/* achievements */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold tracking-[0.15em] text-[#caa15a] flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> ACHIEVEMENTS</p>
          <button onClick={() => navigate("/achievements")} className="text-[11px] text-gold">VIEW ALL</button>
        </div>
        <div className="flex gap-3">
          {ACHIEVEMENTS.map((a) => (
            <div key={a.name} className="flex-1 aspect-square rounded-xl flex items-center justify-center text-2xl panel-inset" style={{ boxShadow: `inset 0 0 18px ${TIER_COLOR[a.tier]}33` }} title={a.name}>
              <span style={{ filter: `drop-shadow(0 0 6px ${TIER_COLOR[a.tier]})` }}>🛡️</span>
            </div>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="panel-inset rounded-xl p-3 text-center">
      <p className={`font-display font-extrabold text-2xl ${accent ? "text-gold" : "text-white"}`}>{value}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
