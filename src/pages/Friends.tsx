import { useState } from "react";
import { UserPlus } from "lucide-react";
import { ScreenShell } from "@/components/ScreenShell";
import { FRIENDS } from "@/data/mockProfile";

const TABS = ["Friends", "Online", "Offline"] as const;
const STATUS_COLOR: Record<string, string> = { Online: "#43d166", "In Game": "#f6b500", Offline: "#6b7280" };

export default function Friends() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Friends");
  const list = FRIENDS.filter((f) => tab === "Friends" || (tab === "Online" ? f.status !== "Offline" : f.status === "Offline"));
  const onlineCount = FRIENDS.filter((f) => f.status !== "Offline").length;

  return (
    <ScreenShell title="FRIENDS" maxWidth="max-w-lg">
      <div className="glass rounded-2xl overflow-hidden flex flex-col">
        <div className="flex border-b border-white/10">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-xs font-bold ${tab === t ? "text-gold border-b-2 border-gold" : "text-gray-500"}`}>
              {t}{t === "Online" ? ` (${onlineCount})` : ""}
            </button>
          ))}
        </div>
        <div className="p-3 space-y-2">
          {list.map((f) => (
            <div key={f.name} className="panel-inset rounded-xl px-3 py-2.5 flex items-center gap-3">
              <div className="relative frame-ring w-11 h-11 flex-shrink-0">
                <img src={f.avatar} alt="" className="w-full h-full rounded-[0.6rem] object-cover" />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#15151b]" style={{ background: STATUS_COLOR[f.status] }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{f.name}</p>
                <p className="text-[11px]" style={{ color: STATUS_COLOR[f.status] }}>{f.status}</p>
              </div>
              <button className={`btn-3d ${f.action === "JOIN" ? "btn-green" : "btn-gold"} px-4 py-1.5 text-xs`}>{f.action}</button>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-white/10">
          <button className="btn-3d btn-gold w-full py-3 flex items-center justify-center gap-2 text-sm"><UserPlus className="w-4 h-4" /> ADD FRIEND</button>
        </div>
      </div>
    </ScreenShell>
  );
}
