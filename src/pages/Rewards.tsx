import { useState } from "react";
import { motion } from "framer-motion";
import { Coins, Check } from "lucide-react";
import { ScreenShell } from "@/components/ScreenShell";
import { addCoins, addXp, useWallet } from "@/lib/wallet";
import { useSound } from "@/hooks/useSound";

const TABS = ["Daily Reward", "Weekly Reward", "Season Pass"] as const;
const WEEK = [500, 100, 250, 800, 150, 1000, 2000]; // coins per day

function todayKey() { return new Date().toISOString().slice(0, 10); }

export default function Rewards() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Daily Reward");
  const sound = useSound();
  const wallet = useWallet();

  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem("uno_daily_streak") || "0"));
  const [lastClaim, setLastClaim] = useState(() => localStorage.getItem("uno_daily_date") || "");

  const dayIndex = streak % 7;
  const claimedToday = lastClaim === todayKey();
  const todayReward = WEEK[dayIndex];

  const claim = () => {
    if (claimedToday) return;
    addCoins(todayReward);
    addXp(60);
    const newStreak = streak + 1;
    setStreak(newStreak);
    setLastClaim(todayKey());
    localStorage.setItem("uno_daily_streak", String(newStreak));
    localStorage.setItem("uno_daily_date", todayKey());
    sound.playUno();
  };

  return (
    <ScreenShell title="REWARDS" maxWidth="max-w-2xl" right={<span className="currency-pill text-xs text-gold"><Coins className="w-3.5 h-3.5" /> {wallet.coins.toLocaleString()}</span>}>
      <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4">
        <div className="glass rounded-2xl p-2 flex md:flex-col gap-1 h-fit overflow-x-auto">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left whitespace-nowrap touch-target ${tab === t ? "btn-3d btn-gold" : "text-gray-400 hover:bg-white/5"}`}>{t}</button>
          ))}
        </div>

        <div className="glass rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-4">
            <motion.div animate={{ y: [0, -6, 0], rotate: [0, -3, 3, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-4xl sm:text-5xl">🎁</motion.div>
            <div>
              <h3 className="font-display font-extrabold text-base sm:text-lg">{tab}</h3>
              <p className="text-xs text-gray-400">{tab === "Daily Reward" ? "Log in daily to claim — keep your streak going!" : "Coming soon."}</p>
            </div>
          </div>

          {tab === "Daily Reward" && (
            <>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 mb-5">
                {WEEK.map((amt, i) => {
                  const isToday = i === dayIndex;
                  const isPast = i < dayIndex;
                  return (
                    <div key={i} className={`rounded-xl p-2 text-center ${isToday && !claimedToday ? "bg-gold/15 border border-gold/40" : "panel-inset"} ${isPast || (isToday && claimedToday) ? "opacity-50" : ""}`}>
                      <p className="text-[9px] text-gray-400 mb-1">DAY {i + 1}</p>
                      <div className="text-lg mb-1">{isPast || (isToday && claimedToday) ? "✅" : "🪙"}</div>
                      <p className="text-[10px] font-bold text-gold">{amt}</p>
                    </div>
                  );
                })}
              </div>

              <button onClick={claim} disabled={claimedToday} className={`btn-3d ${claimedToday ? "btn-ghost" : "btn-gold"} w-full py-3 text-sm flex items-center justify-center gap-2 touch-target`}>
                {claimedToday ? <><Check className="w-4 h-4" /> Claimed — come back tomorrow</> : <><Coins className="w-4 h-4" /> Claim {todayReward} coins (Day {dayIndex + 1})</>}
              </button>
              <p className="text-center text-[11px] text-gray-500 mt-2">Current streak: {streak} day{streak === 1 ? "" : "s"}</p>
            </>
          )}

          {tab !== "Daily Reward" && (
            <div className="panel-inset rounded-xl p-8 text-center text-gray-400 text-sm">This reward track is coming soon.</div>
          )}
        </div>
      </div>
    </ScreenShell>
  );
}
