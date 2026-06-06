import { useState } from "react";
import { motion } from "framer-motion";
import { ScreenShell } from "@/components/ScreenShell";
import { DAILY_REWARDS } from "@/data/mockProfile";
import { useSound } from "@/hooks/useSound";

const TABS = ["Daily Reward", "Weekly Reward", "Season Pass"] as const;

export default function Rewards() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Daily Reward");
  const sound = useSound();

  return (
    <ScreenShell title="REWARDS" maxWidth="max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4">
        {/* side tabs */}
        <div className="glass rounded-2xl p-2 flex md:flex-col gap-1 h-fit">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left whitespace-nowrap ${tab === t ? "btn-3d btn-gold" : "text-gray-400 hover:bg-white/5"}`}>{t}</button>
          ))}
        </div>

        {/* content */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <motion.div animate={{ y: [0, -6, 0], rotate: [0, -3, 3, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-5xl">🎁</motion.div>
            <div>
              <h3 className="font-display font-extrabold text-lg">{tab}</h3>
              <p className="text-xs text-gray-400">Login daily to claim awesome rewards!</p>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-5">
            {DAILY_REWARDS.map((d) => (
              <div key={d.day} className={`rounded-xl p-2 text-center ${d.today ? "bg-gold/15 border border-gold/40" : "panel-inset"} ${d.claimed ? "opacity-50" : ""}`}>
                <p className="text-[9px] text-gray-400 mb-1">DAY {d.day}</p>
                <div className="text-xl mb-1">{d.claimed ? "✅" : d.amount === "1" ? "💎" : "🪙"}</div>
                <p className="text-[10px] font-bold text-gold">{d.amount}</p>
              </div>
            ))}
          </div>

          <button onClick={() => sound.playUno()} className="btn-3d btn-gold w-full py-3 text-sm">CLAIM REWARD</button>
        </div>
      </div>
    </ScreenShell>
  );
}
