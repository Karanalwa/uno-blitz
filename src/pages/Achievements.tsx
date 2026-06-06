import { Coins } from "lucide-react";
import { ScreenShell } from "@/components/ScreenShell";
import { ACHIEVEMENTS } from "@/data/mockProfile";

const TIER_COLOR: Record<string, string> = { gold: "#ffd255", silver: "#c0c7d0", bronze: "#cd7f32", purple: "#a356f0" };

export default function Achievements() {
  return (
    <ScreenShell title="ACHIEVEMENTS" maxWidth="max-w-2xl" right={<span className="text-xs glass-bright px-3 py-1.5 rounded-lg text-gray-300">ALL ▾</span>}>
      <div className="space-y-2.5">
        {ACHIEVEMENTS.map((a) => (
          <div key={a.name} className="glass rounded-xl p-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl panel-inset flex items-center justify-center text-2xl flex-shrink-0" style={{ boxShadow: `inset 0 0 16px ${TIER_COLOR[a.tier]}44` }}>
              <span style={{ filter: `drop-shadow(0 0 5px ${TIER_COLOR[a.tier]})` }}>🛡️</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{a.name}</p>
              <p className="text-[11px] text-gray-400 mb-1.5">{a.desc}</p>
              <div className="panel-inset rounded-full h-1.5 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${a.progress * 100}%`, background: `linear-gradient(90deg, ${TIER_COLOR[a.tier]}, #f0a818)` }} />
              </div>
            </div>
            <span className="currency-pill text-xs text-gold flex-shrink-0"><Coins className="w-3.5 h-3.5" /> {a.reward}</span>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}
