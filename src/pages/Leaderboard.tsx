import { useState } from "react";
import { ScreenShell } from "@/components/ScreenShell";
import { LEADERBOARD } from "@/data/mockProfile";

const TABS = ["Global", "Friends", "Country"] as const;

export default function Leaderboard() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Global");

  return (
    <ScreenShell title="LEADERBOARD" maxWidth="max-w-2xl">
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex border-b border-white/10">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-xs font-bold ${tab === t ? "text-gold border-b-2 border-gold" : "text-gray-500"}`}>{t.toUpperCase()}</button>
          ))}
        </div>
        <div className="grid grid-cols-[40px_1fr_70px_70px] gap-2 px-4 py-2 text-[10px] font-bold tracking-wider text-gray-500 border-b border-white/5">
          <span>RANK</span><span>PLAYER</span><span className="text-right">WINS</span><span className="text-right">WIN %</span>
        </div>
        <div className="p-2 space-y-1.5">
          {LEADERBOARD.map((r) => (
            <div key={r.rank} className={`grid grid-cols-[40px_1fr_70px_70px] gap-2 items-center px-2 py-2.5 rounded-lg ${r.me ? "bg-gold/10 border border-gold/30" : "panel-inset"}`}>
              <span className={`font-display font-extrabold ${r.rank === 1 ? "text-gold" : r.rank <= 3 ? "text-amber-600" : "text-gray-500"}`}>{r.rank === 1 ? "👑" : r.rank}</span>
              <span className="font-bold text-sm truncate">{r.name}{r.me && <span className="text-[10px] text-gold ml-1">(You)</span>}</span>
              <span className="text-right font-bold text-gold text-sm">{r.wins.toLocaleString()}</span>
              <span className="text-right text-sm text-gray-300">{r.winRate}</span>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-white/10 text-center text-[11px] text-gray-500">SEASON ENDS IN: 23d 14h</div>
      </div>
    </ScreenShell>
  );
}
