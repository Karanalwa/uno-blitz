import { useState } from "react";
import { UserPlus, X, Search, Copy, Check } from "lucide-react";
import { ScreenShell } from "@/components/ScreenShell";
import { AVATARS } from "@/engine/types";
import { getUserId, isValidId, normalizeId } from "@/lib/identity";

const TABS = ["Friends", "Online", "Offline"] as const;
const STATUS_COLOR: Record<string, string> = { Online: "#2ecc71", "In Game": "#f5a623", Offline: "#6b7280" };
const KEY = "uno_friends_v2";

interface Friend { id: string; name: string; status: string; avatar: string; }

const SEED: Friend[] = [
  { id: "UNO-SPH7K2", name: "Sophia", status: "Online", avatar: AVATARS[1] },
  { id: "UNO-WLM4P9", name: "William", status: "Online", avatar: AVATARS[2] },
  { id: "UNO-EMM8R3", name: "Emma", status: "In Game", avatar: AVATARS[4] },
  { id: "UNO-JMS5T6", name: "James", status: "Offline", avatar: AVATARS[3] },
];

function load(): Friend[] {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch { /* ignore */ }
  return SEED;
}
function persist(f: Friend[]) { try { localStorage.setItem(KEY, JSON.stringify(f)); } catch { /* ignore */ } }

export default function Friends() {
  const myId = getUserId();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Friends");
  const [friends, setFriends] = useState<Friend[]>(load());
  const [query, setQuery] = useState("");
  const [addId, setAddId] = useState("");
  const [addName, setAddName] = useState("");
  const [err, setErr] = useState("");
  const [idCopied, setIdCopied] = useState(false);

  const update = (f: Friend[]) => { setFriends(f); persist(f); };

  const addFriend = () => {
    const id = normalizeId(addId);
    if (!isValidId(id)) { setErr("Enter a valid ID, e.g. UNO-A7B8C9"); return; }
    if (id === myId) { setErr("That's your own ID!"); return; }
    if (friends.some((f) => f.id === id)) { setErr("Already in your friends list."); return; }
    const avatar = AVATARS[friends.length % AVATARS.length];
    update([...friends, { id, name: addName.trim() || id, status: "Online", avatar }]);
    setAddId(""); setAddName(""); setErr("");
  };
  const removeFriend = (id: string) => update(friends.filter((f) => f.id !== id));
  const copyMyId = () => { navigator.clipboard?.writeText(myId); setIdCopied(true); setTimeout(() => setIdCopied(false), 1500); };

  const onlineCount = friends.filter((f) => f.status !== "Offline").length;
  const byTab = friends.filter((f) => tab === "Friends" || (tab === "Online" ? f.status !== "Offline" : f.status === "Offline"));
  const list = query.trim()
    ? byTab.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()) || f.id.toLowerCase().includes(query.toLowerCase()))
    : byTab;

  return (
    <ScreenShell title="FRIENDS" maxWidth="max-w-lg">
      {/* your ID */}
      <div className="glass rounded-2xl p-3 mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.15em] text-[#caa15a]">YOUR FRIEND ID</p>
          <p className="font-display font-bold text-gold tracking-wider">{myId}</p>
        </div>
        <button onClick={copyMyId} className="btn-3d btn-ghost px-3 py-2 text-xs flex items-center gap-1.5">
          {idCopied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Share</>}
        </button>
      </div>

      {/* add by ID */}
      <div className="glass rounded-2xl p-3 mb-3">
        <p className="text-[10px] font-bold tracking-[0.15em] text-[#caa15a] mb-2">ADD FRIEND BY ID</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={addId} onChange={(e) => { setAddId(e.target.value); setErr(""); }} onKeyDown={(e) => e.key === "Enter" && addFriend()} placeholder="UNO-A7B8C9" maxLength={10}
            className="flex-1 panel-inset rounded-lg px-3 py-2 text-sm uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-gold" />
          <input value={addName} onChange={(e) => setAddName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addFriend()} placeholder="Nickname (optional)" maxLength={15}
            className="flex-1 panel-inset rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold" />
          <button onClick={addFriend} className="btn-3d btn-gold px-4 py-2 text-sm flex items-center justify-center gap-1.5"><UserPlus className="w-4 h-4" /> Add</button>
        </div>
        {err && <p className="text-[11px] text-suit-red mt-1.5">{err}</p>}
      </div>

      {/* list */}
      <div className="glass rounded-2xl overflow-hidden flex flex-col">
        <div className="flex border-b border-white/10">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-xs font-bold ${tab === t ? "text-gold border-b-2 border-gold" : "text-gray-500"}`}>
              {t}{t === "Online" ? ` (${onlineCount})` : ""}
            </button>
          ))}
        </div>
        <div className="p-2.5 border-b border-white/5">
          <div className="panel-inset rounded-lg flex items-center gap-2 px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-gray-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search friends by name or ID" className="flex-1 bg-transparent text-sm focus:outline-none" />
          </div>
        </div>
        <div className="p-3 space-y-2 min-h-[120px]">
          {list.length === 0 && <p className="text-center text-gray-500 text-sm py-6">No friends here yet.</p>}
          {list.map((f) => (
            <div key={f.id} className="panel-inset rounded-xl px-3 py-2.5 flex items-center gap-3">
              <div className="relative frame-ring w-11 h-11 flex-shrink-0">
                <img src={f.avatar} alt="" className="w-full h-full rounded-[0.6rem] object-cover" />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#15151f]" style={{ background: STATUS_COLOR[f.status] }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{f.name}</p>
                <p className="text-[10px] text-gray-500 truncate">{f.id}</p>
              </div>
              <button className={`btn-3d ${f.status === "In Game" ? "btn-green" : "btn-gold"} px-3.5 py-1.5 text-xs`}>{f.status === "In Game" ? "JOIN" : "INVITE"}</button>
              <button onClick={() => removeFriend(f.id)} className="text-gray-500 hover:text-suit-red"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
}
