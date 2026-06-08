import { ScreenShell } from "@/components/ScreenShell";
import { getMatchHistory, timeAgo } from "@/lib/playerStats";

export default function MatchHistory() {
  const history = getMatchHistory();

  return (
    <ScreenShell title="MATCH HISTORY" maxWidth="max-w-2xl">
      {history.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-gray-400">
          <p className="text-3xl mb-2">🎴</p>
          <p className="text-sm">No matches yet — play a game and your results will show up here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((h, i) => {
            const win = h.result === "WIN";
            return (
              <div key={i} className={`glass rounded-xl px-4 py-3 flex items-center gap-3 border-l-4 ${win ? "border-l-emerald-500" : "border-l-suit-red"}`}>
                <span className={`font-display font-extrabold text-sm w-12 ${win ? "text-emerald-400" : "text-suit-red"}`}>{h.result}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">vs {h.players}</p>
                  <p className="text-[11px] text-gray-500">{h.count} Players</p>
                </div>
                <span className="text-[11px] text-gray-500">{timeAgo(h.at)}</span>
              </div>
            );
          })}
        </div>
      )}
    </ScreenShell>
  );
}
