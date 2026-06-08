import { useState } from "react";
import { Coins, Check } from "lucide-react";
import { ScreenShell } from "@/components/ScreenShell";
import { getStats } from "@/lib/playerStats";
import { addCoins, addXp } from "@/lib/wallet";
import { useSound } from "@/hooks/useSound";

const TIER_COLOR: Record<string, string> = { gold: "#f5a623", silver: "#c0c7d0", bronze: "#cd7f32", purple: "#9b59b6" };
const CLAIM_KEY = "uno_ach_claimed";

function getClaimed(): string[] {
  try { return JSON.parse(localStorage.getItem(CLAIM_KEY) || "[]"); } catch { return []; }
}
function setClaimed(ids: string[]) {
  try { localStorage.setItem(CLAIM_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
}

export default function Achievements() {
  const sound = useSound();
  const s = getStats();
  const [claimed, setClaimedState] = useState<string[]>(getClaimed());

  const list = [
    { id: "uno", name: "UNO Master", desc: "Call UNO 100 times", current: s.unoCalls, target: 100, reward: 1000, tier: "gold" },
    { id: "champ", name: "Champion", desc: "Win 50 games", current: s.wins, target: 50, reward: 500, tier: "silver" },
    { id: "streak", name: "Win Streak", desc: "Win 10 matches in a row", current: s.longestStreak, target: 10, reward: 800, tier: "bronze" },
    { id: "draw4", name: "Draw Four King", desc: "Play 50 Draw Four cards", current: s.drawFours, target: 50, reward: 600, tier: "purple" },
    { id: "vet", name: "Veteran", desc: "Play 100 games", current: s.gamesPlayed, target: 100, reward: 300, tier: "silver" },
  ];

  const claim = (id: string, reward: number) => {
    if (claimed.includes(id)) return;
    addCoins(reward);
    addXp(Math.round(reward / 4));
    const next = [...claimed, id];
    setClaimed(next);
    setClaimedState(next);
    sound.playUno();
  };

  return (
    <ScreenShell title="ACHIEVEMENTS" maxWidth="max-w-2xl">
      <div className="space-y-2.5">
        {list.map((a) => {
          const pct = Math.min(1, a.current / a.target);
          const done = a.current >= a.target;
          const isClaimed = claimed.includes(a.id);
          return (
            <div key={a.id} className="glass rounded-xl p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl panel-inset flex items-center justify-center text-2xl flex-shrink-0" style={{ boxShadow: `inset 0 0 16px ${TIER_COLOR[a.tier]}44` }}>
                <span style={{ filter: `drop-shadow(0 0 5px ${TIER_COLOR[a.tier]})`, opacity: done ? 1 : 0.5 }}>🛡️</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{a.name}</p>
                <p className="text-[11px] text-gray-400 mb-1.5">{a.desc} · {Math.min(a.current, a.target)}/{a.target}</p>
                <div className="panel-inset rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: `linear-gradient(90deg, ${TIER_COLOR[a.tier]}, #f0a818)` }} />
                </div>
              </div>
              {isClaimed ? (
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 flex-shrink-0"><Check className="w-3.5 h-3.5" /> Claimed</span>
              ) : done ? (
                <button onClick={() => claim(a.id, a.reward)} className="btn-3d btn-gold px-3 py-1.5 text-xs flex items-center gap-1 flex-shrink-0"><Coins className="w-3.5 h-3.5" /> {a.reward}</button>
              ) : (
                <span className="currency-pill text-xs text-gray-400 flex-shrink-0"><Coins className="w-3.5 h-3.5" /> {a.reward}</span>
              )}
            </div>
          );
        })}
      </div>
    </ScreenShell>
  );
}
